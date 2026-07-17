/**
 * Calendar-invite helpers (REQ-009). An event becomes a portable iCalendar
 * (.ics) VEVENT understood by Outlook, Google, and Apple Calendar, plus
 * pre-filled "compose" deeplinks for Outlook web and Google Calendar so a user
 * can push an invite to a set of attendees straight from their own mailbox — no
 * server email infrastructure required. Events are all-day (date-only).
 */
export interface InviteEvent {
  id?: string;
  event_name: string;
  event_date: string; // YYYY-MM-DD
  location?: string | null;
  website_url?: string | null;
}

/** "YYYY-MM-DD" -> "YYYYMMDD". */
const compact = (isoDate: string) => isoDate.slice(0, 10).replace(/-/g, "");

/** Day after an all-day event (iCal/Google DTEND is exclusive). */
function nextDay(isoDate: string): string {
  const d = new Date(isoDate + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10).replace(/-/g, "");
}

/** Escape a value for an iCalendar text field. */
function esc(v: string): string {
  return v.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

/** A stable-ish timestamp for DTSTAMP without needing wall-clock precision. */
function stamp(): string {
  return new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function description(ev: InviteEvent): string {
  return [ev.website_url ? `More info: ${ev.website_url}` : "", "Sent from CRM Platform"]
    .filter(Boolean)
    .join("\n");
}

/** Build the .ics document for an event (optionally addressed to attendees). */
export function buildIcs(ev: InviteEvent, emails: string[] = []): string {
  const uid = `${ev.id ?? Math.abs(hash(ev.event_name + ev.event_date))}@crm-platform`;
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CRM Platform//Events//EN",
    "CALSCALE:GREGORIAN",
    emails.length ? "METHOD:REQUEST" : "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${stamp()}`,
    `DTSTART;VALUE=DATE:${compact(ev.event_date)}`,
    `DTEND;VALUE=DATE:${nextDay(ev.event_date)}`,
    `SUMMARY:${esc(ev.event_name)}`,
    ev.location ? `LOCATION:${esc(ev.location)}` : "",
    `DESCRIPTION:${esc(description(ev))}`,
    ev.website_url ? `URL:${esc(ev.website_url)}` : "",
    ...emails.map((e) => `ATTENDEE;ROLE=REQ-PARTICIPANT;RSVP=TRUE:mailto:${e}`),
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);
  // iCal lines are CRLF-delimited.
  return lines.join("\r\n");
}

/** Simple string hash for a fallback UID (no crypto needed). */
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return h;
}

/** Outlook web "compose event" deeplink with attendees pre-filled. */
export function outlookUrl(ev: InviteEvent, emails: string[] = []): string {
  const p = new URLSearchParams({
    path: "/calendar/action/compose",
    rru: "addevent",
    startdt: `${ev.event_date}T00:00:00`,
    enddt: `${ev.event_date}T23:59:00`,
    allday: "true",
    subject: ev.event_name,
    location: ev.location ?? "",
    body: description(ev),
  });
  if (emails.length) p.set("to", emails.join(","));
  return `https://outlook.office.com/calendar/0/deeplink/compose?${p.toString()}`;
}

/** Google Calendar template link with guests pre-filled. */
export function googleUrl(ev: InviteEvent, emails: string[] = []): string {
  const p = new URLSearchParams({
    action: "TEMPLATE",
    text: ev.event_name,
    dates: `${compact(ev.event_date)}/${nextDay(ev.event_date)}`,
    location: ev.location ?? "",
    details: description(ev),
  });
  if (emails.length) p.set("add", emails.join(","));
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}

/** Human-readable invite text for "copy as invite". */
export function inviteText(ev: InviteEvent, emails: string[] = []): string {
  const when = new Date(ev.event_date + "T00:00:00").toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  return [
    `You're invited: ${ev.event_name}`,
    `When: ${when} (all day)`,
    ev.location ? `Where: ${ev.location}` : "",
    ev.website_url ? `Details: ${ev.website_url}` : "",
    emails.length ? `Invitees: ${emails.join(", ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

/** Parse a free-text list of emails (comma / space / semicolon / newline). */
export function parseEmails(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(/[\s,;]+/)
        .map((s) => s.trim())
        .filter((s) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s))
    )
  );
}

/** Trigger a download of the .ics file. */
export function downloadIcs(ev: InviteEvent, emails: string[] = []): void {
  const blob = new Blob([buildIcs(ev, emails)], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${ev.event_name.replace(/[^\w.-]+/g, "_")}.ics`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
