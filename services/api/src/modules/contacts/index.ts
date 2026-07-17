import { z } from "zod";
import { makeCrudRouter } from "../crudRouter.js";

/** Person-level Contact records (REQ-019), distinct from publicity contacts. */
export const contactSchema = z.object({
  full_name: z.string().min(1),
  title: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company_id: z.string().uuid().optional(),
  owner_id: z.string().uuid().optional(),
  lifecycle_stage: z.string().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  custom_fields: z.record(z.unknown()).optional(),
});

export const contactsRouter = makeCrudRouter({
  module: "contacts",
  table: "contacts",
  schema: contactSchema,
  columns: [
    "full_name",
    "title",
    "email",
    "phone",
    "company_id",
    "owner_id",
    "lifecycle_stage",
    "tags",
    "notes",
    "custom_fields",
  ],
  searchable: ["full_name", "email", "title"],
  jsonColumns: ["custom_fields"],
});
