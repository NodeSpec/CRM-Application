import { Router, type Request, type Response, type NextFunction } from "express";
import type { ZodSchema } from "zod";
import { pool } from "../db/pool.js";
import { requireRole, type Role } from "../auth/rbac.js";
import { recordAudit, type AuditAction } from "../middleware/audit.js";
import { HttpError } from "../middleware/error.js";

/**
 * Generic DB-backed REST resource router (REQ-016). One instance per module
 * provides working list / get / create / update / delete against its table,
 * with request-body validation, audit logging on every mutation (REQ-018),
 * and optional Admin-only guards.
 *
 * Table and column names come exclusively from this codebase (never user
 * input), so they are safe to interpolate; all values are parameterized.
 */
export interface CrudOptions {
  /** Module name used in audit entries, e.g. "b2b_leads". */
  module: string;
  /** Database table (usually equal to `module`). */
  table: string;
  /** Writable columns accepted on create/update. */
  columns: string[];
  /** Zod schema validating create/update bodies. */
  schema: ZodSchema;
  /** Columns usable as `?<col>=` equality filters and free-text search. */
  searchable?: string[];
  /** Whether the table has a `created_by` owner column (default true). Set
   *  false for tables without one (e.g. submission_categories). */
  trackOwner?: boolean;
  /** Column the current user's id is written to on create (default
   *  "created_by"). Use e.g. "actor_id" for tables with a different owner col. */
  ownerColumn?: string;
  /** Columns of JSONB type — values are JSON-encoded before binding. */
  jsonColumns?: string[];
  /** Whether the table has an `updated_at` column (default true). */
  hasUpdatedAt?: boolean;
  /** Role required to create/update (defaults to any authenticated user). */
  writeRole?: Role;
  /** Role required to delete (defaults to any authenticated user). */
  deleteRole?: Role;
}

function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res
        .status(400)
        .json({ error: "Validation failed", details: result.error.issues });
    }
    req.body = result.data;
    next();
  };
}

export function makeCrudRouter(opts: CrudOptions): Router {
  const router = Router();
  const { module, table, columns, schema } = opts;
  const searchable = opts.searchable ?? [];
  const jsonCols = new Set(opts.jsonColumns ?? []);
  const ownerCol =
    opts.trackOwner === false ? null : (opts.ownerColumn ?? "created_by");
  const hasUpdatedAt = opts.hasUpdatedAt !== false;

  // JSON-encode values bound to JSONB columns; pass everything else through
  // (node-postgres handles arrays -> Postgres array literals natively).
  const enc = (col: string, val: unknown) =>
    jsonCols.has(col) ? JSON.stringify(val) : val;

  async function audit(
    action: AuditAction,
    req: Request,
    recordId: string | null,
    before?: unknown,
    after?: unknown
  ) {
    if (!req.principal) return;
    await recordAudit({
      actor: req.principal,
      action,
      module,
      recordId,
      before,
      after,
    });
  }

  // LIST — equality filters on any column + `q` ILIKE across searchable cols.
  router.get("/", async (req, res, next) => {
    try {
      const where: string[] = [];
      const params: unknown[] = [];
      for (const col of columns) {
        // Equality filter: ?<col>=value
        const val = req.query[col];
        if (typeof val === "string" && val !== "") {
          params.push(val);
          where.push(`${col} = $${params.length}`);
        }
        // Range filters: ?<col>_from= / ?<col>_to= (dates or comparable values).
        const from = req.query[`${col}_from`];
        if (typeof from === "string" && from !== "") {
          params.push(from);
          where.push(`${col} >= $${params.length}`);
        }
        const to = req.query[`${col}_to`];
        if (typeof to === "string" && to !== "") {
          params.push(to);
          where.push(`${col} <= $${params.length}`);
        }
      }
      const q = req.query.q;
      if (typeof q === "string" && q && searchable.length) {
        params.push(`%${q}%`);
        const idx = params.length;
        where.push(
          `(${searchable.map((c) => `${c}::text ILIKE $${idx}`).join(" OR ")})`
        );
      }
      const limit = Math.min(Number(req.query.limit) || 200, 500);
      const offset = Number(req.query.offset) || 0;
      const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
      const { rows } = await pool.query(
        `SELECT * FROM ${table} ${clause} ORDER BY created_at DESC LIMIT ${limit} OFFSET ${offset}`,
        params
      );
      res.json(rows);
    } catch (err) {
      next(err);
    }
  });

  // GET one.
  router.get("/:id", async (req, res, next) => {
    try {
      const { rows } = await pool.query(
        `SELECT * FROM ${table} WHERE id = $1`,
        [req.params.id]
      );
      if (!rows[0]) throw new HttpError(404, "Not found");
      res.json(rows[0]);
    } catch (err) {
      next(err);
    }
  });

  // Optional admin (or other) gate on create/update (REQ-011 categories).
  const writeGuards = opts.writeRole ? [requireRole(opts.writeRole)] : [];

  // CREATE.
  router.post("/", ...writeGuards, validateBody(schema), async (req, res, next) => {
    try {
      const provided = columns.filter((c) => req.body[c] !== undefined);
      const cols = [...provided];
      const values = provided.map((c) => enc(c, req.body[c]));
      if (ownerCol) {
        cols.push(ownerCol);
        values.push(req.principal?.userId ?? null);
      }
      const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");
      const { rows } = await pool.query(
        `INSERT INTO ${table} (${cols.join(", ")}) VALUES (${placeholders}) RETURNING *`,
        values
      );
      await audit("create", req, rows[0].id, null, rows[0]);
      res.status(201).json(rows[0]);
    } catch (err) {
      next(err);
    }
  });

  // UPDATE.
  router.put("/:id", ...writeGuards, validateBody(schema), async (req, res, next) => {
    try {
      const before = (
        await pool.query(`SELECT * FROM ${table} WHERE id = $1`, [
          req.params.id,
        ])
      ).rows[0];
      if (!before) throw new HttpError(404, "Not found");

      const provided = columns.filter((c) => req.body[c] !== undefined);
      if (provided.length === 0) return res.json(before);
      const sets = provided.map((c, i) => `${c} = $${i + 1}`);
      const values = provided.map((c) => enc(c, req.body[c]));
      values.push(req.params.id);
      const touch = hasUpdatedAt ? ", updated_at = now()" : "";
      const { rows } = await pool.query(
        `UPDATE ${table} SET ${sets.join(", ")}${touch} WHERE id = $${values.length} RETURNING *`,
        values
      );
      await audit("update", req, rows[0].id, before, rows[0]);
      res.json(rows[0]);
    } catch (err) {
      next(err);
    }
  });

  // DELETE (optionally Admin-only).
  const doDelete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const before = (
        await pool.query(`SELECT * FROM ${table} WHERE id = $1`, [
          req.params.id,
        ])
      ).rows[0];
      if (!before) throw new HttpError(404, "Not found");
      await pool.query(`DELETE FROM ${table} WHERE id = $1`, [req.params.id]);
      await audit("delete", req, req.params.id, before, null);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  };
  if (opts.deleteRole) {
    router.delete("/:id", requireRole(opts.deleteRole), doDelete);
  } else {
    router.delete("/:id", doDelete);
  }

  return router;
}
