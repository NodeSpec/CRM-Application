import { z } from "zod";
import { makeCrudRouter } from "../crudRouter.js";

/**
 * Submission category management (REQ-011). Admin-only writes: an Admin can
 * add, rename, or deactivate categories. Deactivating leaves existing records
 * intact but blocks new use.
 */
export const submissionCategorySchema = z.object({
  label: z.string().min(1),
  is_active: z.boolean().default(true),
});

export const submissionCategoriesRouter = makeCrudRouter({
  module: "submission_categories",
  schema: submissionCategorySchema,
  // Category administration is an Admin-only capability (REQ-011 AC1).
  deleteRole: "admin",
});
