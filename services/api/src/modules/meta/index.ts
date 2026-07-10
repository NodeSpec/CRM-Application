import { Router } from "express";
import { pool } from "../../db/pool.js";
import { config } from "../../config.js";

/**
 * Metadata endpoint powering the frontend's filter dropdowns, create-form
 * selects, and due-date badges from a single call (REQ-006/008/010/011):
 * configurable lead statuses, active submission categories, publicity formats,
 * and the alert thresholds.
 */
export const metaRouter = Router();

metaRouter.get("/", async (_req, res, next) => {
  try {
    const [statuses, categories, formats] = await Promise.all([
      pool.query(
        `SELECT label, is_closed FROM lead_statuses
          WHERE is_active = true ORDER BY sort_order`
      ),
      pool.query(
        `SELECT id, label FROM submission_categories
          WHERE is_active = true ORDER BY label`
      ),
      pool.query(
        `SELECT label FROM publicity_formats WHERE is_active = true ORDER BY label`
      ),
    ]);

    res.json({
      lead_statuses: statuses.rows,
      submission_categories: categories.rows,
      publicity_formats: formats.rows.map((r) => r.label),
      thresholds: {
        b2g_due_date_threshold_days: config.B2G_DUE_DATE_THRESHOLD_DAYS,
        submission_deadline_threshold_days:
          config.SUBMISSION_DEADLINE_THRESHOLD_DAYS,
      },
    });
  } catch (err) {
    next(err);
  }
});
