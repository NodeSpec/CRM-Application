import { Router } from "express";
import { z } from "zod";
import { pool } from "../../db/pool.js";
import { requireRole } from "../../auth/rbac.js";
import { recordAudit } from "../../middleware/audit.js";
import { HttpError } from "../../middleware/error.js";

/**
 * User & role administration (REQ-002). Admin-only: list users and change a
 * user's role. Combined with the per-request role re-read in authenticate.ts,
 * a role change takes effect on that user's next request (REQ-002 AC2).
 */
export const usersRouter = Router();
usersRouter.use(requireRole("admin"));

usersRouter.get("/", async (_req, res, next) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, email, display_name, role, is_active, created_at
         FROM users ORDER BY email`
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

const roleSchema = z.object({ role: z.enum(["admin", "member"]) });

usersRouter.patch("/:id", async (req, res, next) => {
  try {
    const parsed = roleSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: "Validation failed", details: parsed.error.issues });
    }
    const before = (
      await pool.query(`SELECT id, role FROM users WHERE id = $1`, [
        req.params.id,
      ])
    ).rows[0];
    if (!before) throw new HttpError(404, "Not found");

    const { rows } = await pool.query(
      `UPDATE users SET role = $1, updated_at = now() WHERE id = $2
         RETURNING id, email, display_name, role, is_active`,
      [parsed.data.role, req.params.id]
    );
    if (req.principal)
      await recordAudit({
        actor: req.principal,
        action: "update",
        module: "users",
        recordId: req.params.id,
        before: { role: before.role },
        after: { role: parsed.data.role },
      });
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});
