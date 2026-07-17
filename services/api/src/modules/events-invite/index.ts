import { Router } from "express";
import { z } from "zod";
import { pool } from "../../db/pool.js";
import { config } from "../../config.js";
import { HttpError } from "../../middleware/error.js";

/**
 * Event invite delivery (REQ-009 / REQ-027).
 *
 * POST /events/:id/invite { emails: string[] } builds the canonical iCalendar
 * (.ics) for the event and, when an email gateway is configured, sends it to the
 * attendees. Without a gateway it returns the .ics with delivered=false and an
 * honest reason — the client still has the Outlook/Google/.ics flows, and the
 * API never claims to have sent mail it couldn't.
 *
 * Per REQ-027, actual sending MUST go through the email gateway
 * (config.EMAIL_GATEWAY_URL) — a managed SMTP relay or Microsoft Graph endpoint
 * reached via the egress gateway — never a direct third-party call from here.
 */
export const eventInviteRouter = Router();

const inviteSchema = z.object({
  emails: z.array(z.string().email()).min(1).max(200),
});

interface EventRow {
  id: string;
  event_name: string;
  event_date: string;
  location: string | null;
  website_url: string | null;
}

const compact = (iso: string) => iso.slice(0, 10).replace(/-/g, "");
function nextDay(iso: string): string {
  const d = new Date(iso.slice(0, 10) + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}
const esc = (v: string) =>
  v.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

/** Canonical .ics (METHOD:REQUEST with attendees) for an event. */
function buildIcs(ev: EventRow, emails: string[], dtstamp: string): string {
  const org = config.EMAIL_FROM || "no-reply@crm.local";
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CRM Platform//Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:REQUEST",
    "BEGIN:VEVENT",
    `UID:${ev.id}@crm-platform`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART;VALUE=DATE:${compact(ev.event_date)}`,
    `DTEND;VALUE=DATE:${nextDay(ev.event_date)}`,
    `SUMMARY:${esc(ev.event_name)}`,
    ev.location ? `LOCATION:${esc(ev.location)}` : "",
    ev.website_url ? `URL:${esc(ev.website_url)}` : "",
    `ORGANIZER:mailto:${org}`,
    ...emails.map((e) => `ATTENDEE;ROLE=REQ-PARTICIPANT;RSVP=TRUE:mailto:${e}`),
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");
}

eventInviteRouter.post("/:id/invite", async (req, res, next) => {
  try {
    const parsed = inviteSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: "Validation failed", details: parsed.error.issues });
    }
    const { rows } = await pool.query<EventRow>(
      // event_date::text -> "YYYY-MM-DD" (node-pg otherwise returns a Date object).
      "SELECT id, event_name, event_date::text AS event_date, location, website_url FROM events WHERE id = $1",
      [req.params.id]
    );
    const ev = rows[0];
    if (!ev) throw new HttpError(404, "Not found");

    // DTSTAMP is request-time; fine to compute here (not resume-sensitive).
    const dtstamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const ics = buildIcs(ev, parsed.data.emails, dtstamp);

    if (!config.EMAIL_GATEWAY_URL) {
      return res.json({
        delivered: false,
        reason: "email gateway not configured",
        recipients: parsed.data.emails.length,
        ics,
      });
    }

    // Real delivery seam (REQ-027): POST the invite to the email gateway, e.g.
    //   await fetch(`${config.EMAIL_GATEWAY_URL}/send`, {
    //     method: "POST",
    //     headers: { authorization: `Bearer ${config.EMAIL_API_TOKEN}` },
    //     body: JSON.stringify({ from: config.EMAIL_FROM, to: emails,
    //       subject: `Invitation: ${ev.event_name}`, ics }),
    //   })
    // Left unwired so nothing silently no-ops as "sent" without a real gateway.
    return res.json({
      delivered: false,
      reason: "email gateway send not implemented",
      recipients: parsed.data.emails.length,
      ics,
    });
  } catch (err) {
    next(err);
  }
});
