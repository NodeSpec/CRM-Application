import { useState } from "react";
import { api } from "../api/client";
import {
  buildIcs,
  outlookUrl,
  googleUrl,
  inviteText,
  parseEmails,
  downloadIcs,
  type InviteEvent,
} from "../lib/ics";

/**
 * Event invite dialog (REQ-009). Push an event to a set of attendees as an
 * Outlook (or Google) invite — opening the user's own calendar compose with the
 * attendees pre-filled — or copy/download it as a portable .ics. Server-side
 * delivery (emailing attendees directly) is offered when the email gateway is
 * configured (REQ-027); otherwise it reports "not connected" instead of failing.
 */
export function InviteModal({ event, onClose }: { event: InviteEvent; onClose: () => void }) {
  const [raw, setRaw] = useState("");
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [serverMsg, setServerMsg] = useState<string | null>(null);
  const emails = parseEmails(raw);

  async function copyInvite() {
    const text = inviteText(event, emails) + "\n\n" + buildIcs(event, emails);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      setServerMsg("Clipboard blocked by the browser — use Download .ics instead.");
    }
  }

  async function emailFromServer() {
    if (!event.id || emails.length === 0) return;
    setSending(true);
    setServerMsg(null);
    try {
      const res = await api.create<{ delivered: boolean; reason?: string }>(
        `events/${event.id}/invite`,
        { emails }
      );
      setServerMsg(
        res.delivered
          ? `Invite emailed to ${emails.length} recipient${emails.length > 1 ? "s" : ""}.`
          : `Server delivery not available${res.reason ? ` — ${res.reason}` : ""}. Use “Add to Outlook” or “Download .ics”.`
      );
    } catch (e) {
      setServerMsg(`Could not reach the invite service: ${(e as Error).message}`);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div>
            <div style={{ fontWeight: 700, fontSize: 15.5 }}>Invite to “{event.event_name}”</div>
            <div className="muted" style={{ fontSize: 12.5 }}>
              {new Date(event.event_date + "T00:00:00").toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
              {event.location ? ` · ${event.location}` : ""}
            </div>
          </div>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <span className="material-symbols-rounded">close</span>
          </button>
        </div>

        <div className="modal-body">
          <label className="filter-field" style={{ display: "block" }}>
            <span>Attendee emails</span>
            <textarea
              rows={2}
              placeholder="alex@example.com, jordan@example.com…"
              value={raw}
              onChange={(e) => setRaw(e.target.value)}
              style={{ width: "100%", resize: "vertical" }}
            />
          </label>
          {emails.length > 0 && (
            <div className="chip-row">
              {emails.map((e) => (
                <span className="email-chip" key={e}>{e}</span>
              ))}
            </div>
          )}

          <div className="invite-actions">
            <a className="btn btn-primary" href={outlookUrl(event, emails)} target="_blank" rel="noreferrer noopener">
              <span className="material-symbols-rounded">event</span>
              Add to Outlook
            </a>
            <a className="btn" href={googleUrl(event, emails)} target="_blank" rel="noreferrer noopener">
              <span className="material-symbols-rounded">event</span>
              Add to Google
            </a>
            <button className="btn" onClick={() => downloadIcs(event, emails)}>
              <span className="material-symbols-rounded">download</span>
              Download .ics
            </button>
            <button className="btn" onClick={copyInvite}>
              <span className="material-symbols-rounded">{copied ? "check" : "content_copy"}</span>
              {copied ? "Copied" : "Copy invite"}
            </button>
          </div>

          <div className="invite-server">
            <button
              className="btn"
              onClick={emailFromServer}
              disabled={sending || emails.length === 0}
              title={emails.length === 0 ? "Add at least one email" : "Email the invite from the server"}
            >
              <span className="material-symbols-rounded">send</span>
              {sending ? "Sending…" : "Email invite from server"}
            </button>
            <span className="muted" style={{ fontSize: 11.5 }}>
              Sends directly to attendees when the email gateway is configured (REQ-027).
            </span>
          </div>
          {serverMsg && <p className="muted" style={{ fontSize: 12.5, marginBottom: 0 }}>{serverMsg}</p>}
        </div>
      </div>
    </div>
  );
}
