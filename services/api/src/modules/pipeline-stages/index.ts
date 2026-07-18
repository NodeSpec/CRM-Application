import { z } from "zod";
import { makeCrudRouter } from "../crudRouter.js";

/**
 * Admin-configurable pipeline stages (REQ-021/022/023). An Admin can add,
 * rename, reorder, activate/deactivate, or delete the stages that drive the
 * Pipeline board, steppers, and filters:
 *  - lead_statuses         — commercial (B2B) sales stages (is_closed marks the
 *    terminal stages used by pipeline/revenue rollups)
 *  - b2g_capture_stages    — federal capture lifecycle stages
 * Neither table has created_at/updated_at; ordering is by sort_order.
 */
export const leadStatusSchema = z.object({
  label: z.string().min(1),
  sort_order: z.number().int().optional(),
  is_closed: z.boolean().default(false),
  is_active: z.boolean().default(true),
});

export const leadStatusesRouter = makeCrudRouter({
  module: "lead_statuses",
  table: "lead_statuses",
  schema: leadStatusSchema,
  columns: ["label", "sort_order", "is_closed", "is_active"],
  searchable: ["label"],
  trackOwner: false,
  hasUpdatedAt: false,
  orderBy: "sort_order, label",
  writeRole: "admin",
  deleteRole: "admin",
});

export const captureStageSchema = z.object({
  label: z.string().min(1),
  sort_order: z.number().int().optional(),
  is_active: z.boolean().default(true),
});

export const captureStagesRouter = makeCrudRouter({
  module: "b2g_capture_stages",
  table: "b2g_capture_stages",
  schema: captureStageSchema,
  columns: ["label", "sort_order", "is_active"],
  searchable: ["label"],
  trackOwner: false,
  hasUpdatedAt: false,
  orderBy: "sort_order, label",
  writeRole: "admin",
  deleteRole: "admin",
});
