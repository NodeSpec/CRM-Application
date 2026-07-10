import { Redis } from "ioredis";
import { config } from "./config.js";

/**
 * Redis client for the Session & Revocation Store (REQ-003).
 * Holds hot session metadata and a jti/session blocklist the API checks on
 * every authenticated request, enabling immediate logout and admin-forced
 * termination that stateless JWTs cannot provide on their own.
 */
export const redis = new Redis(config.REDIS_URL, {
  lazyConnect: false,
  maxRetriesPerRequest: 3,
});

redis.on("error", (err: Error) => {
  console.error("[redis] connection error", err.message);
});

export const SESSION_PREFIX = "session:";
export const REVOKED_PREFIX = "revoked:";
