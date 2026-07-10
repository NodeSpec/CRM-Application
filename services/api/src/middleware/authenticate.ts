import type { Request, Response, NextFunction } from "express";
import { readSession, SESSION_COOKIE } from "../auth/session.js";
import { query } from "../db/pool.js";
import type { Role } from "../auth/rbac.js";

/**
 * Authentication middleware. Resolves the server-side session from the
 * HttpOnly cookie and attaches the principal to the request. The role is
 * re-read from the database on every request so an Admin's role change takes
 * effect on the user's next request (REQ-002 AC2); the session value is the
 * fallback. Expired/revoked sessions yield 401 so the SPA can redirect to login
 * (REQ-003 AC1).
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const sessionId = req.cookies?.[SESSION_COOKIE];
    if (!sessionId) {
      return res.status(401).json({ error: "Unauthorized: no session" });
    }
    const session = await readSession(sessionId);
    if (!session) {
      return res
        .status(401)
        .json({ error: "Unauthorized: session expired or revoked" });
    }
    // Re-read the current role from the DB so admin changes take effect next
    // request (REQ-002 AC2); fall back to the session's role if the row is gone.
    let role: Role = session.role;
    if (session.userId) {
      const { rows } = await query<{ role: Role }>(
        `SELECT role FROM users WHERE id = $1`,
        [session.userId]
      );
      if (rows[0]) role = rows[0].role;
    }

    req.principal = {
      userId: session.userId,
      subject: session.subject,
      email: session.email,
      displayName: session.displayName,
      role,
    };
    next();
  } catch (err) {
    next(err);
  }
}
