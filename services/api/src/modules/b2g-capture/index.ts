import { z } from "zod";
import { makeCrudRouter } from "../crudRouter.js";

/**
 * B2G capture sub-resources (REQ-022): teaming partners, government
 * stakeholders, and compliance gates. Each is filtered by `?opportunity_id=`.
 * None have created_by / updated_at columns.
 */
const teamingSchema = z.object({
  opportunity_id: z.string().uuid(),
  company_name: z.string().min(1),
  role: z.string().optional(),
  poc: z.string().optional(),
  email: z.string().email().optional(),
});
export const teamingRouter = makeCrudRouter({
  module: "b2g_teaming_partners",
  table: "b2g_teaming_partners",
  schema: teamingSchema,
  columns: ["opportunity_id", "company_name", "role", "poc", "email"],
  searchable: ["company_name"],
  trackOwner: false,
  hasUpdatedAt: false,
});

const stakeholderSchema = z.object({
  opportunity_id: z.string().uuid(),
  name: z.string().min(1),
  agency_role: z.string().optional(),
  influence: z.string().optional(),
  disposition: z.string().optional(),
});
export const stakeholdersRouter = makeCrudRouter({
  module: "b2g_stakeholders",
  table: "b2g_stakeholders",
  schema: stakeholderSchema,
  columns: ["opportunity_id", "name", "agency_role", "influence", "disposition"],
  searchable: ["name"],
  trackOwner: false,
  hasUpdatedAt: false,
});

const gateSchema = z.object({
  opportunity_id: z.string().uuid(),
  label: z.string().min(1),
  status: z.string().default("pending"),
  notes: z.string().optional(),
});
export const gatesRouter = makeCrudRouter({
  module: "b2g_compliance_gates",
  table: "b2g_compliance_gates",
  schema: gateSchema,
  columns: ["opportunity_id", "label", "status", "notes"],
  searchable: ["label"],
  trackOwner: false,
  hasUpdatedAt: false,
});
