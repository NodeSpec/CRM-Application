import { randomBytes } from "node:crypto";
import { Router } from "express";
import { config } from "../../config.js";
import {
  buildAuthorizeUrl,
  buildLogoutUrl,
  exchangeCode,
  verifyToken,
} from "../../auth/oidc.js";
import { upsertUserFromIdentity } from "../../auth/users.js";
import {
  createSession,
  destroySession,
  SESSION_COOKIE,
} from "../../auth/session.js";
import { authenticate } from "../../middleware/authenticate.js";

/**
 * Authentication routes (REQ-001, REQ-002, REQ-003). Public except /me.
 * Implements the BFF login flow: /login -> IdP -> /callback -> server session.
 */
export const authRouter = Router();

const STATE_COOKIE = "oidc_state";

// GET /login — redirect the browser to the IdP authorization endpoint.
authRouter.get("/login", (_req, res) => {
  const state = randomBytes(16).toString("hex");
  res.cookie(STATE_COOKIE, state, {
    httpOnly: true,
    secure: config.COOKIE_SECURE,
    sameSite: "lax", // must survive the top-level redirect back from the IdP
    maxAge: 10 * 60 * 1000,
    path: "/",
  });
  res.redirect(buildAuthorizeUrl(state));
});

// GET /callback — exchange the code, verify, create session, redirect to app.
authRouter.get("/callback", async (req, res, next) => {
  try {
    const { code, state } = req.query as { code?: string; state?: string };
    const expected = req.cookies?.[STATE_COOKIE];
    if (!code || !state || !expected || state !== expected) {
      return res.status(400).json({ error: "Invalid OAuth state or code" });
    }
    res.clearCookie(STATE_COOKIE, { path: "/" });

    const tokens = await exchangeCode(code);
    // Prefer the ID token for identity claims; fall back to access token.
    const identity = await verifyToken(tokens.id_token ?? tokens.access_token);
    const user = await upsertUserFromIdentity(identity);

    await createSession(res, {
      userId: user.id,
      subject: identity.subject,
      email: user.email,
      displayName: user.displayName,
      role: user.role,
      jti: identity.jti,
    });

    // Back to the SPA home; the app then calls /auth/me.
    res.redirect(config.APP_BASE_URL);
  } catch (err) {
    next(err);
  }
});

// POST /logout — invalidate the server-side session (REQ-003 AC3).
authRouter.post("/logout", async (req, res, next) => {
  try {
    const sessionId = req.cookies?.[SESSION_COOKIE];
    if (sessionId) await destroySession(sessionId, res);
    res.json({ ok: true, idpLogoutUrl: buildLogoutUrl() });
  } catch (err) {
    next(err);
  }
});

// GET /me — current authenticated principal (used by the SPA on load).
authRouter.get("/me", authenticate, (req, res) => {
  res.json({ user: req.principal });
});
