import { randomBytes } from "node:crypto";
import type { Response } from "express";
import { redis, SESSION_PREFIX, REVOKED_PREFIX } from "../redis.js";
import { config } from "../config.js";
import type { Principal } from "./rbac.js";

/**
 * Secure server-side session lifecycle (REQ-003).
 *
 * The API owns sessions: it creates a server-side record (in Redis for speed,
 * mirrored in Postgres for durability/admin review), issues an opaque session
 * id in an HttpOnly/Secure/SameSite=Strict cookie, enforces a configurable idle
 * timeout via a sliding TTL, and invalidates sessions on logout or admin action
 * so a token cannot be reused.
 */
export const SESSION_COOKIE = "crm_session";

const idleTtlSeconds = config.SESSION_IDLE_TIMEOUT_MIN * 60;

export interface SessionData extends Principal {
  jti?: string;
  createdAt: number;
}

function sessionKey(id: string) {
  return `${SESSION_PREFIX}${id}`;
}

/** Create a session, store it in Redis with idle TTL, and set the cookie. */
export async function createSession(
  res: Response,
  data: Omit<SessionData, "createdAt">
): Promise<string> {
  const id = randomBytes(32).toString("hex");
  const payload: SessionData = { ...data, createdAt: Date.now() };
  await redis.set(sessionKey(id), JSON.stringify(payload), "EX", idleTtlSeconds);

  res.cookie(SESSION_COOKIE, id, {
    httpOnly: true, // not accessible via JavaScript (REQ-003 AC2)
    secure: config.COOKIE_SECURE, // HTTPS-only in production
    sameSite: "strict",
    maxAge: idleTtlSeconds * 1000,
    path: "/",
  });
  return id;
}

/**
 * Read a session by id, refreshing its idle TTL (sliding expiry). Returns null
 * if the session is missing, expired, or has been revoked (REQ-003 AC1/AC3).
 */
export async function readSession(id: string): Promise<SessionData | null> {
  if (await redis.exists(`${REVOKED_PREFIX}${id}`)) return null;
  const raw = await redis.get(sessionKey(id));
  if (!raw) return null;
  // Slide the idle timeout forward on activity.
  await redis.expire(sessionKey(id), idleTtlSeconds);
  return JSON.parse(raw) as SessionData;
}

/** Invalidate a session immediately (logout or admin action) and clear cookie. */
export async function destroySession(id: string, res?: Response): Promise<void> {
  await redis.del(sessionKey(id));
  // Tombstone so any in-flight copy of the token cannot be reused.
  await redis.set(`${REVOKED_PREFIX}${id}`, "1", "EX", idleTtlSeconds);
  if (res) res.clearCookie(SESSION_COOKIE, { path: "/" });
}
