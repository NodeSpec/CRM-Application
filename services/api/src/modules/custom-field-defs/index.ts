import { z } from "zod";
import { makeCrudRouter } from "../crudRouter.js";

/** Admin-defined custom field definitions per module (REQ-023). Values live in
 *  each record's `custom_fields` JSONB column. Admin-only writes. */
export const customFieldDefSchema = z.object({
  module: z.string().min(1),
  key: z.string().min(1),
  label: z.string().min(1),
  type: z.enum(["text", "number", "date", "select"]).default("text"),
  options: z.array(z.string()).optional(),
  is_active: z.boolean().default(true),
  sort_order: z.number().int().optional(),
});

export const customFieldDefsRouter = makeCrudRouter({
  module: "custom_field_defs",
  table: "custom_field_defs",
  schema: customFieldDefSchema,
  columns: ["module", "key", "label", "type", "options", "is_active", "sort_order"],
  searchable: ["module", "label"],
  jsonColumns: ["options"],
  trackOwner: false,
  hasUpdatedAt: false,
  writeRole: "admin",
  deleteRole: "admin",
});
