import { z } from "zod";
import { makeCrudRouter } from "../crudRouter.js";

/**
 * B2B Lead records (REQ-004, REQ-005, REQ-006).
 * Fields mirror the CRM Database `b2b_leads` table; Contact Email is validated
 * as a proper email before save (REQ-004 AC4).
 */
export const b2bLeadSchema = z.object({
  company_name: z.string().min(1),
  industry_vertical: z.string().optional(),
  primary_poc: z.string().optional(),
  title_role: z.string().optional(),
  contact_email: z.string().email().optional(),
  lead_source: z.string().optional(),
  status: z.string().default("New"),
  pain_point_use_case: z.string().optional(),
  initial_contact_date: z.coerce.date().optional(),
  next_follow_up_date: z.coerce.date().optional(),
  reminder_date: z.coerce.date().optional(),
  notes: z.string().optional(),
});

export const b2bLeadsRouter = makeCrudRouter({
  module: "b2b_leads",
  schema: b2bLeadSchema,
});
