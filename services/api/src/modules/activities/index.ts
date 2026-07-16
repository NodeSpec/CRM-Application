import { z } from "zod";
import { makeCrudRouter } from "../crudRouter.js";

/** User-facing activity log (REQ-024) — distinct from the immutable audit log.
 *  Filter by ?module=&record_id= to get a record's timeline. */
export const activitySchema = z.object({
  type: z.enum(["call", "email", "note", "meeting"]).default("note"),
  subject: z.string().optional(),
  body: z.string().optional(),
  module: z.string().optional(),
  record_id: z.string().uuid().optional(),
  occurred_at: z.coerce.date().optional(),
});

export const activitiesRouter = makeCrudRouter({
  module: "activities",
  table: "activities",
  schema: activitySchema,
  columns: ["type", "subject", "body", "module", "record_id", "occurred_at"],
  searchable: ["subject", "body"],
  ownerColumn: "actor_id", // current user is the actor
  hasUpdatedAt: false,
});
