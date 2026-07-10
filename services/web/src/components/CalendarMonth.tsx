import { useMemo, useState } from "react";

/** Monthly calendar for events (REQ-009). Dependency-free; places events by
 *  event_date, greys past days, and supports prev/next month navigation. */
export interface CalEvent {
  id?: string;
  event_name: string;
  event_date: string;
  website_url?: string | null;
}

const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function ymd(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function CalendarMonth({ events }: { events: CalEvent[] }) {
  const now = new Date();
  const [cursor, setCursor] = useState(
    () => new Date(now.getFullYear(), now.getMonth(), 1)
  );

  const byDay = useMemo(() => {
    const map = new Map<string, CalEvent[]>();
    for (const e of events) {
      const key = String(e.event_date).slice(0, 10);
      (map.get(key) ?? map.set(key, []).get(key)!).push(e);
    }
    return map;
  }, [events]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey = ymd(now);

  const cells: (number | null)[] = [];
  for (let i = 0; i < firstWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="cal">
      <div className="cal-head">
        <button
          className="icon-btn"
          onClick={() => setCursor(new Date(year, month - 1, 1))}
          title="Previous month"
        >
          <span className="material-symbols-rounded">chevron_left</span>
        </button>
        <div className="cal-title">
          {MONTHS[month]} {year}
        </div>
        <button
          className="icon-btn"
          onClick={() => setCursor(new Date(year, month + 1, 1))}
          title="Next month"
        >
          <span className="material-symbols-rounded">chevron_right</span>
        </button>
        <span className="spacer" style={{ flex: 1 }} />
        <button className="btn" onClick={() => setCursor(new Date(now.getFullYear(), now.getMonth(), 1))}>
          Today
        </button>
      </div>
      <div className="cal-grid">
        {DOW.map((d) => (
          <div className="cal-dow" key={d}>
            {d}
          </div>
        ))}
        {cells.map((d, i) => {
          if (d == null) return <div className="cal-cell empty" key={`e${i}`} />;
          const key = ymd(new Date(year, month, d));
          const dayEvents = byDay.get(key) ?? [];
          const isPast = key < todayKey;
          const isToday = key === todayKey;
          return (
            <div
              className={
                "cal-cell" + (isPast ? " past" : "") + (isToday ? " today" : "")
              }
              key={key}
            >
              <span className="cal-daynum">{d}</span>
              {dayEvents.map((e, j) => (
                <span className="cal-event" key={e.id ?? j} title={e.event_name}>
                  {e.event_name}
                </span>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
