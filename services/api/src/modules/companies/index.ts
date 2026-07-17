import { z } from "zod";
import { makeCrudRouter } from "../crudRouter.js";

/** Company / Account records (REQ-020). */
/** Official social profile URLs/handles per platform (REQ-026). */
export const socialLinksSchema = z
  .object({
    linkedin: z.string(),
    x: z.string(),
    instagram: z.string(),
    tiktok: z.string(),
  })
  .partial();

export const companySchema = z.object({
  name: z.string().min(1),
  website: z.string().optional(),
  domain: z.string().optional(),
  industry: z.string().optional(),
  segment: z.string().optional(),
  owner_id: z.string().uuid().optional(),
  about: z.string().optional(),
  custom_fields: z.record(z.unknown()).optional(),
  social_links: socialLinksSchema.optional(),
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
    "social_links",
  ],
  searchable: ["name", "industry", "segment"],
  jsonColumns: ["custom_fields", "social_links"],
});
