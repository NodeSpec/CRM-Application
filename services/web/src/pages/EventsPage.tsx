import { useEffect, useState } from "react";
import { api, ApiError } from "../api/client";
import { ResourcePage } from "./ResourcePage";
import { CalendarMonth, type CalEvent } from "../components/CalendarMonth";
import { InviteModal } from "../components/InviteModal";
import type { InviteEvent } from "../lib/ics";
import { MODULES } from "../modules";

/**
 * Events module (REQ-009): a List/Calendar toggle. List reuses the generic
 * ResourcePage (filters, CSV, create) with a per-row "Invite" action; Calendar
 * renders the month grid. The Invite action opens a dialog to push the event to
 * a set of attendees as an Outlook/Google invite, or copy/download it as .ics.
 */
export function EventsPage() {
  const [view, setView] = useState<"list" | "calendar">("list");
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [invite, setInvite] = useState<InviteEvent | null>(null);

  useEffect(() => {
    if (view !== "calendar") return;
    api
      .list<CalEvent>("events")
      .then(setEvents)
      .catch((e) =>
        setError(
          e instanceof ApiError && e.status === 401
            ? "Please log in."
            : `Failed to load events: ${(e as Error).message}`
        )
      );
  }, [view]);

  const toInvite = (row: Record<string, unknown>): InviteEvent => ({
    id: row.id as string | undefined,
    event_name: String(row.event_name ?? "Event"),
    event_date: String(row.event_date ?? "").slice(0, 10),
    location: (row.location as string) ?? null,
    website_url: (row.website_url as string) ?? null,
  });

  return (
    <>
      <div className="page-head">
        <span className="spacer" />
        <div className="seg">
          <button
            className={view === "list" ? "active" : ""}
            onClick={() => setView("list")}
          >
            List
          </button>
          <button
            className={view === "calendar" ? "active" : ""}
            onClick={() => setView("calendar")}
          >
            Calendar
          </button>
        </div>
      </div>

      {view === "list" ? (
        <ResourcePage
          config={MODULES.events}
          rowAction={(row) => (
            <button
              className="btn"
              onClick={() => setInvite(toInvite(row))}
              title="Send / copy a calendar invite"
            >
              <span
                className="material-symbols-rounded"
                style={{ fontSize: 16, verticalAlign: "-3px", marginRight: 4 }}
              >
                mail
              </span>
              Invite
            </button>
          )}
        />
      ) : (
        <>
          {error && <p className="error">{error}</p>}
          <CalendarMonth events={events} />
        </>
      )}

      {invite && <InviteModal event={invite} onClose={() => setInvite(null)} />}
    </>
  );
}
