import type { Request, Response, NextFunction } from "express";
import { readSession, SESSION_COOKIE } from "../auth/session.js";

/**
 * Authentication middleware. Resolves the server-side session from the
 * HttpOnly cookie and attaches the principal to the request. The role is read
 * from the session on every request so an Admin's role change takes effect on
 * the user's next request (REQ-002 AC2). Expired/revoked sessions yield 401 so
 * the SPA can redirect to login (REQ-003 AC1).
 *
 * NOTE (scaffold): the login route that first establishes the session by
 * exchanging an IdP authorization code and calling `createSession` is a TODO
 * integration seam. This middleware — the per-request enforcement side — is
 * fully wired.
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
    req.principal = {
      userId: session.userId,
      subject: session.subject,
      email: session.email,
      displayName: session.displayName,
      role: session.role,
    };
    next();
  } catch (err) {
    next(err);
  }
}
