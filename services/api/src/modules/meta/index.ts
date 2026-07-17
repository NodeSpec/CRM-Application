import { Router } from "express";
import { pool } from "../../db/pool.js";
import { config } from "../../config.js";

/**
 * Metadata endpoint powering the frontend's filter dropdowns, create-form
 * selects, custom-field rendering, and due-date badges from a single call
 * (REQ-006/008/010/011/019/023): lead statuses, submission categories,
 * publicity formats, contact lifecycle stages, owners (users), active
 * custom-field definitions, and alert thresholds.
 */
export const metaRouter = Router();

metaRouter.get("/", async (_req, res, next) => {
  try {
    const [statuses, categories, formats, lifecycle, owners, cfDefs] =
      await Promise.all([
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
        pool.query(
          `SELECT label FROM contact_lifecycle_stages
            WHERE is_active = true ORDER BY sort_order`
        ),
        pool.query(
          `SELECT id, display_name, email FROM users
            WHERE is_active = true ORDER BY display_name`
        ),
        pool.query(
          `SELECT module, key, label, type, options, sort_order
             FROM custom_field_defs WHERE is_active = true
            ORDER BY module, sort_order`
        ),
      ]);

    res.json({
      lead_statuses: statuses.rows,
      submission_categories: categories.rows,
      publicity_formats: formats.rows.map((r) => r.label),
      contact_lifecycle_stages: lifecycle.rows.map((r) => r.label),
      owners: owners.rows,
      custom_field_defs: cfDefs.rows,
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
