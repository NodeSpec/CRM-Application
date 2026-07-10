import { Router, type Request, type Response } from "express";
import type { ZodSchema } from "zod";
import { requireRole, type Role } from "../auth/rbac.js";

/**
 * Factory for a standard versioned REST resource router (REQ-016).
 *
 * Produces the canonical CRUD shape — GET / , GET /:id , POST / , PUT /:id ,
 * DELETE /:id — with request-body validation already wired to the module's zod
 * schema. Handlers return `501 Not Implemented` by design: the integration
 * spine (routing, auth, validation, RBAC) is complete; per-module persistence
 * logic is the remaining fill-in work under the chosen scaffold scope.
 *
 * To implement a module: replace each `notImplemented` body with a
 * parameterized query against the pool, wrap writes in a transaction, and call
 * `recordAudit(...)` for create/update/delete (REQ-018).
 */
export interface CrudOptions {
  /** Module name used in audit entries and stub messages, e.g. "b2b_leads". */
  module: string;
  /** Zod schema validating create/update bodies. */
  schema: ZodSchema;
  /** Role required to delete (defaults to any authenticated user). */
  deleteRole?: Role;
}

function notImplemented(module: string, op: string) {
  return (_req: Request, res: Response) => {
    // TODO(scaffold): implement ${op} for ${module} with a parameterized query.
    res.status(501).json({
      error: "Not implemented",
      module,
      operation: op,
      hint: "Scaffold stub — persistence logic to be implemented.",
    });
  };
}

function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: (e?: unknown) => void) => {
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
  const { module, schema } = opts;

  router.get("/", notImplemented(module, "list"));
  router.get("/:id", notImplemented(module, "get"));
  router.post("/", validateBody(schema), notImplemented(module, "create"));
  router.put("/:id", validateBody(schema), notImplemented(module, "update"));

  const del = notImplemented(module, "delete");
  if (opts.deleteRole) {
    router.delete("/:id", requireRole(opts.deleteRole), del);
  } else {
    router.delete("/:id", del);
  }

  return router;
}
