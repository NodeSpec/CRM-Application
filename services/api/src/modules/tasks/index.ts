import { z } from "zod";
import { makeCrudRouter } from "../crudRouter.js";

/** Tasks with due date + assignee (REQ-024). */
export const taskSchema = z.object({
  title: z.string().min(1),
  due_date: z.coerce.date().optional(),
  assignee_id: z.string().uuid().optional(),
  status: z.enum(["open", "done"]).default("open"),
  module: z.string().optional(),
  record_id: z.string().uuid().optional(),
});

export const tasksRouter = makeCrudRouter({
  module: "tasks",
  table: "tasks",
  schema: taskSchema,
  columns: ["title", "due_date", "assignee_id", "status", "module", "record_id"],
  searchable: ["title"],
});
