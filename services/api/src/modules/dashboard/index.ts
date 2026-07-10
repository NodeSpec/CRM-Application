import { Router } from "express";
import { pool } from "../../db/pool.js";
import { config } from "../../config.js";

/**
 * Unified dashboard aggregation (REQ-013). Returns cross-module summary counts
 * plus the publicity-by-format breakdown, driven by the configurable alert
 * thresholds (REQ-008, REQ-010, REQ-015).
 */
export const dashboardRouter = Router();

dashboardRouter.get("/", async (_req, res, next) => {
  try {
    const b2gDays = config.B2G_DUE_DATE_THRESHOLD_DAYS;
    const subDays = config.SUBMISSION_DEADLINE_THRESHOLD_DAYS;

    const [events, submissions, leads, opps, byFormat, byStatus] =
      await Promise.all([
        pool.query(
          `SELECT count(*)::int AS n FROM events WHERE event_date >= current_date`
        ),
      pool.query(
        `SELECT count(*)::int AS n FROM submissions
          WHERE submission_date IS NULL
            AND deadline <= current_date + make_interval(days => $1)`,
        [subDays]
      ),
      pool.query(
        `SELECT count(*)::int AS n FROM b2b_leads
          WHERE reminder_date IS NOT NULL
            AND reminder_date <= current_date
            AND status NOT IN ('Closed-Won', 'Closed-Lost')`
      ),
      pool.query(
        `SELECT count(*)::int AS n FROM b2g_opportunities
          WHERE due_date IS NOT NULL
            AND due_date <= current_date + make_interval(days => $1)
            AND status NOT ILIKE 'closed%'`,
        [b2gDays]
      ),
      pool.query(
        `SELECT coalesce(format, 'Unspecified') AS format, count(*)::int AS n
           FROM publicity_contacts GROUP BY format ORDER BY n DESC`
      ),
      // Leads grouped by the configurable status pipeline (REQ-005/013),
      // including zero-count stages, in pipeline order.
      pool.query(
        `SELECT s.label AS status, count(l.id)::int AS n
           FROM lead_statuses s
           LEFT JOIN b2b_leads l ON l.status = s.label
          WHERE s.is_active = true
          GROUP BY s.label, s.sort_order
          ORDER BY s.sort_order`
      ),
    ]);

    res.json({
      upcoming_events: events.rows[0].n,
      approaching_submission_deadlines: submissions.rows[0].n,
      leads_due_for_follow_up: leads.rows[0].n,
      b2g_opportunities_nearing_due_date: opps.rows[0].n,
      publicity_contacts_by_format: byFormat.rows,
      leads_by_status: byStatus.rows,
      thresholds: {
        b2g_due_date_threshold_days: b2gDays,
        submission_deadline_threshold_days: subDays,
      },
    });
  } catch (err) {
    next(err);
  }
});
