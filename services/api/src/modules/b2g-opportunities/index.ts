import { z } from "zod";
import { makeCrudRouter } from "../crudRouter.js";

/**
 * B2G Opportunity records (REQ-007, REQ-008).
 * Notice ID uniqueness is enforced by the DB (unique constraint); Fit Score is
 * either a numeric 1-10 value or a configurable tier label (REQ-007 AC3).
 */
export const b2gOpportunitySchema = z
  .object({
    notice_id: z.string().min(1),
    agency_department: z.string().optional(),
    opportunity_link: z.string().url().optional(),
    due_date: z.coerce.date().optional(),
    focus_area_rr_role: z.string().optional(),
    fit_score_numeric: z.number().int().min(1).max(10).optional(),
    fit_score_tier: z.string().optional(),
    possible_partner_company: z.string().optional(),
    partner_poc: z.string().optional(),
    contact_email: z.string().email().optional(),
    status: z.string().default("Open"),
    action_officer: z.string().optional(),
    notes: z.string().optional(),
    // Capture management (REQ-022)
    naics: z.string().optional(),
    set_aside: z.string().optional(),
    incumbent: z.string().optional(),
    solicitation_number: z.string().optional(),
    clearance_level: z.string().optional(),
    capture_stage: z.string().optional(),
    meddic: z.record(z.unknown()).optional(),
    custom_fields: z.record(z.unknown()).optional(),
  })
  .refine(
    (v) => v.fit_score_numeric != null || v.fit_score_tier != null || true,
    { message: "Provide a numeric Fit Score (1-10) or a tier label" }
  );

export const b2gOpportunitiesRouter = makeCrudRouter({
  module: "b2g_opportunities",
  table: "b2g_opportunities",
  schema: b2gOpportunitySchema,
  columns: [
    "notice_id",
    "agency_department",
    "opportunity_link",
    "due_date",
    "focus_area_rr_role",
    "fit_score_numeric",
    "fit_score_tier",
    "possible_partner_company",
    "partner_poc",
    "contact_email",
    "status",
    "action_officer",
    "notes",
    "naics",
    "set_aside",
    "incumbent",
    "solicitation_number",
    "clearance_level",
    "capture_stage",
    "meddic",
    "custom_fields",
  ],
  searchable: ["notice_id", "agency_department", "focus_area_rr_role"],
  jsonColumns: ["meddic", "custom_fields"],
});
