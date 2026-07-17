import { z } from "zod";
import { makeCrudRouter } from "../crudRouter.js";

/**
 * Contact lifecycle-stage management (REQ-019/023). Admin-only writes: an Admin
 * can add, rename, reorder, activate/deactivate, or delete stages from the
 * Contacts "Customize" drawer. Deactivating keeps existing contacts' values
 * intact but hides the stage from new selections; deleting removes it outright.
 *
 * The table has no created_at/updated_at columns, so ordering is by sort_order
 * and updated_at bumping is disabled.
 */
export const lifecycleStageSchema = z.object({
  label: z.string().min(1),
  sort_order: z.number().int().optional(),
  is_active: z.boolean().default(true),
});

export const contactLifecycleStagesRouter = makeCrudRouter({
  module: "contact_lifecycle_stages",
  table: "contact_lifecycle_stages",
  schema: lifecycleStageSchema,
  columns: ["label", "sort_order", "is_active"],
  searchable: ["label"],
  trackOwner: false,
  hasUpdatedAt: false,
  orderBy: "sort_order, label",
  writeRole: "admin",
  deleteRole: "admin",
});
