import { query } from "../db/pool.js";
import { mapClaimsToRole, type Role } from "./rbac.js";
import type { VerifiedIdentity } from "./oidc.js";

export interface AppUser {
  id: string;
  email: string;
  displayName: string;
  role: Role;
}

/**
 * Provision or refresh the local user record from a verified IdP identity
 * (REQ-002). The role is derived from IdP group/claim mapping on each login so
 * group changes take effect automatically. An explicit Admin role override
 * (stored via the admin panel) could be layered on top later; for now the IdP
 * mapping is authoritative.
 */
export async function upsertUserFromIdentity(
  identity: VerifiedIdentity
): Promise<AppUser> {
  const role = mapClaimsToRole(identity);
  const { rows } = await query<{
    id: string;
    email: string;
    display_name: string;
    role: Role;
  }>(
    `INSERT INTO users (idp_subject, email, display_name, role)
       VALUES ($1, $2, $3, $4)
     ON CONFLICT (idp_subject) DO UPDATE
       SET email = EXCLUDED.email,
           display_name = EXCLUDED.display_name,
           role = EXCLUDED.role,
           updated_at = now()
     RETURNING id, email, display_name, role`,
    [identity.subject, identity.email, identity.displayName, role]
  );
  const u = rows[0];
  return { id: u.id, email: u.email, displayName: u.display_name, role: u.role };
}
