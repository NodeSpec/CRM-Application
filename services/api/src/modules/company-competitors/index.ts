import { z } from "zod";
import { makeCrudRouter } from "../crudRouter.js";

/**
 * Company competitors (REQ-020). Competition is a property of the COMPANY, so it
 * is shared by Company 360 and any commercial deal for that company (the deal
 * view reads the linked company's competitors). Filtered by `?company_id=`.
 * No created_by / updated_at columns.
 */
export const competitorSchema = z.object({
  company_id: z.string().uuid(),
  name: z.string().min(1),
  note: z.string().optional(),
  disposition: z.string().default("watch"), // leading | threat | watch | low
});

export const companyCompetitorsRouter = makeCrudRouter({
  module: "company_competitors",
  table: "company_competitors",
  schema: competitorSchema,
  columns: ["company_id", "name", "note", "disposition"],
  searchable: ["name"],
  trackOwner: false,
  hasUpdatedAt: false,
});
