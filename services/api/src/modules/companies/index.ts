import { z } from "zod";
import { makeCrudRouter } from "../crudRouter.js";

/** Company / Account records (REQ-020). */
export const companySchema = z.object({
  name: z.string().min(1),
  website: z.string().optional(),
  domain: z.string().optional(),
  industry: z.string().optional(),
  segment: z.string().optional(),
  owner_id: z.string().uuid().optional(),
  about: z.string().optional(),
  custom_fields: z.record(z.unknown()).optional(),
});

export const companiesRouter = makeCrudRouter({
  module: "companies",
  table: "companies",
  schema: companySchema,
  columns: [
    "name",
    "website",
    "domain",
    "industry",
    "segment",
    "owner_id",
    "about",
    "custom_fields",
  ],
  searchable: ["name", "industry", "segment"],
  jsonColumns: ["custom_fields"],
});
