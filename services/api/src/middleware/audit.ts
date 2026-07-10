import type { Principal } from "../auth/rbac.js";
import { query } from "../db/pool.js";

/**
 * Audit logging helper (REQ-018). Every create/update/delete on a CRM record
 * must produce an append-only audit entry with the actor, action, module,
 * record id, timestamp and before/after snapshots. Module handlers call
 * `recordAudit` inside their write transactions once implemented.
 *
 * The `audit_log` table is immutable at the DB level (trigger blocks
 * UPDATE/DELETE), so there is no update/delete path here by design.
 */
export type AuditAction = "create" | "update" | "delete";

export interface AuditInput {
  actor: Principal;
  action: AuditAction;
  module: string;
  recordId: string | null;
  before?: unknown;
  after?: unknown;
}

export async function recordAudit(input: AuditInput): Promise<void> {
  await query(
    `INSERT INTO audit_log
       (actor_user_id, actor_name, action, module, record_id, before_data, after_data)
     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      input.actor.userId || null,
      input.actor.displayName || input.actor.email || "unknown",
      input.action,
      input.module,
      input.recordId,
      input.before != null ? JSON.stringify(input.before) : null,
      input.after != null ? JSON.stringify(input.after) : null,
    ]
  );
}
