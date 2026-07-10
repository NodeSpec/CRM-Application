import { Router } from "express";
import { pool } from "../../db/pool.js";
import { requireRole } from "../../auth/rbac.js";

/**
 * Audit log viewer (REQ-018). Admin-only, read-only: entries are immutable and
 * filterable by module, actor, action type and date range. No create/update/
 * delete endpoints exist — audit rows are written internally by module
 * handlers via `recordAudit` and the table is immutable at the DB level.
 */
export const auditRouter = Router();

auditRouter.get("/", requireRole("admin"), async (req, res, next) => {
  try {
    const where: string[] = [];
    const params: unknown[] = [];
    const add = (clause: string, value: unknown) => {
      params.push(value);
      where.push(clause.replace("$?", `$${params.length}`));
    };

    const { module, actor, action, from, to } = req.query as Record<
      string,
      string | undefined
    >;
    if (module) add("module = $?", module);
    if (actor) add("actor_user_id = $?", actor);
    if (action) add("action = $?", action);
    if (from) add("created_at >= $?", from);
    if (to) add("created_at <= $?", to);

    const limit = Math.min(Number(req.query.limit) || 200, 500);
    const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const { rows } = await pool.query(
      `SELECT * FROM audit_log ${clause} ORDER BY created_at DESC LIMIT ${limit}`,
      params
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});
