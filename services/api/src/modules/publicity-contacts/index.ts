import { z } from "zod";
import { makeCrudRouter } from "../crudRouter.js";

/**
 * Publicity contact records (REQ-012). Organization and Email are required;
 * Email is validated as a proper email address before save.
 */
export const publicityContactSchema = z.object({
  organization: z.string().min(1),
  format: z.string().optional(),
  contact_name: z.string().optional(),
  email: z.string().email(),
  notes: z.string().optional(),
});

export const publicityContactsRouter = makeCrudRouter({
  module: "publicity_contacts",
  schema: publicityContactSchema,
});
