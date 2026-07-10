import { useEffect, useState } from "react";
import { api, ApiError } from "../api/client";
import { ResourcePage } from "./ResourcePage";
import { CalendarMonth, type CalEvent } from "../components/CalendarMonth";
import { MODULES } from "../modules";

/**
 * Events module (REQ-009): a List/Calendar toggle. List reuses the generic
 * ResourcePage (filters, CSV, create); Calendar renders the month grid.
 */
export function EventsPage() {
  const [view, setView] = useState<"list" | "calendar">("list");
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

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
        <ResourcePage config={MODULES.events} />
      ) : (
        <>
          {error && <p className="error">{error}</p>}
          <CalendarMonth events={events} />
        </>
      )}
    </>
  );
}
