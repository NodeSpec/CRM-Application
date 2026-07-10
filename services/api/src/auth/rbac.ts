import type { Request, Response, NextFunction } from "express";
import type { VerifiedIdentity } from "./oidc.js";

/**
 * Role-based access control (REQ-002). The CRM API is the authoritative owner
 * of RBAC: it maps IdP claims/groups to CRM roles on login and enforces
 * authorization on every route via middleware.
 */
export type Role = "admin" | "member";

/**
 * Map IdP role-claim values (e.g. group memberships) to a CRM role.
 * The mapping is configuration-driven: any claim value containing "admin"
 * grants Admin, otherwise the user is a Member (REQ-002 AC3). Adjust the
 * matching rules here or externalise them to config as needs grow.
 */
export function mapClaimsToRole(identity: VerifiedIdentity): Role {
  const values = identity.roleClaimValues.map((v) => v.toLowerCase());
  const isAdmin = values.some((v) => v.includes("admin"));
  return isAdmin ? "admin" : "member";
}

/** The authenticated principal attached to each request after auth. */
export interface Principal {
  userId: string;
  subject: string;
  email: string;
  displayName: string;
  role: Role;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      principal?: Principal;
    }
  }
}

/**
 * Guard that requires the caller to hold one of the allowed roles.
 * Admin-only routes (user management, category admin, audit viewer) use
 * `requireRole("admin")`; the change takes effect on the user's next request
 * because the role is re-derived per request from the session (REQ-002 AC2).
 */
export function requireRole(...allowed: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const principal = req.principal;
    if (!principal) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (!allowed.includes(principal.role)) {
      return res.status(403).json({ error: "Forbidden: insufficient role" });
    }
    next();
  };
}
