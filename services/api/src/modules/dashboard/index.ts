import { Router } from "express";

/**
 * Unified dashboard aggregation (REQ-013). Surfaces cross-module summaries:
 * upcoming events, approaching submission deadlines, leads due for follow-up,
 * B2G opportunities nearing due date, and publicity contacts by format.
 *
 * NOTE (scaffold): returns a stubbed shape describing the widgets. Implement
 * each field with an aggregation query against the CRM Database.
 */
export const dashboardRouter = Router();

dashboardRouter.get("/", (_req, res) => {
  // TODO(scaffold): replace with real aggregation queries (REQ-013).
  res.status(501).json({
    error: "Not implemented",
    module: "dashboard",
    widgets: [
      "upcoming_events",
      "approaching_submission_deadlines",
      "leads_due_for_follow_up",
      "b2g_opportunities_nearing_due_date",
      "publicity_contacts_by_format",
    ],
    hint: "Scaffold stub — aggregation logic to be implemented.",
  });
});
