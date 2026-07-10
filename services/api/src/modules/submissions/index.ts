import { z } from "zod";
import { makeCrudRouter } from "../crudRouter.js";

/**
 * Submission records (REQ-010). Name, Category and Deadline are required;
 * Submission Date presence marks a record as "Submitted".
 */
export const submissionSchema = z.object({
  name: z.string().min(1),
  category_id: z.string().uuid(),
  deadline: z.coerce.date(),
  submission_date: z.coerce.date().optional(),
  website_url: z.string().url().optional(),
});

export const submissionsRouter = makeCrudRouter({
  module: "submissions",
  schema: submissionSchema,
});
