import { Router } from "express";
import { requireRole } from "../../auth/rbac.js";

/**
 * Audit log viewer (REQ-018). Admin-only, read-only: entries are immutable and
 * filterable by module, actor, action type and date range. No create/update/
 * delete endpoints exist — audit rows are written internally by module
 * handlers via `recordAudit` and the table is immutable at the DB level.
 */
export const auditRouter = Router();

// Only Admins may view the audit log (REQ-018 AC2).
auditRouter.get("/", requireRole("admin"), (_req, res) => {
  // TODO(scaffold): implement filtered query over audit_log
  // (params: module, actor, action, from, to) with pagination.
  res.status(501).json({
    error: "Not implemented",
    module: "audit_log",
    filters: ["module", "actor", "action", "from", "to"],
    hint: "Scaffold stub — query logic to be implemented.",
  });
});
