import { z } from "zod";
import { makeCrudRouter } from "../crudRouter.js";

/**
 * Event records (REQ-009). All fields except Website are required.
 */
export const eventSchema = z.object({
  event_name: z.string().min(1),
  event_date: z.coerce.date(),
  location: z.string().min(1),
  website_url: z.string().url().optional(),
});

export const eventsRouter = makeCrudRouter({
  module: "events",
  table: "events",
  schema: eventSchema,
  columns: ["event_name", "event_date", "location", "website_url"],
  searchable: ["event_name", "location"],
});
