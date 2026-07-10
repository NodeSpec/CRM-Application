import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiError } from "../api/client";

/**
 * Unified home dashboard (REQ-013). Fetches cross-module summary counts from
 * /api/v1/dashboard and links each widget to its filtered list view.
 */
interface Summary {
  upcoming_events: number;
  approaching_submission_deadlines: number;
  leads_due_for_follow_up: number;
  b2g_opportunities_nearing_due_date: number;
  publicity_contacts_by_format: { format: string; n: number }[];
}

const WIDGETS: { title: string; to: string; key: keyof Summary }[] = [
  { title: "Upcoming Events", to: "/events", key: "upcoming_events" },
  {
    title: "Approaching Submission Deadlines",
    to: "/submissions",
    key: "approaching_submission_deadlines",
  },
  {
    title: "Leads Due for Follow-up",
    to: "/b2b-leads",
    key: "leads_due_for_follow_up",
  },
  {
    title: "B2G Opportunities Nearing Due Date",
    to: "/b2g-opportunities",
    key: "b2g_opportunities_nearing_due_date",
  },
];

export function Dashboard() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .object<Summary>("dashboard")
      .then(setSummary)
      .catch((e) =>
        setError(
          e instanceof ApiError && e.status === 401
            ? "Please log in to view the dashboard."
            : `Failed to load dashboard: ${(e as Error).message}`
        )
      );
  }, []);

  return (
    <section>
      <h1>Dashboard</h1>
      {error && <p className="error">{error}</p>}
      <div className="grid">
        {WIDGETS.map((w) => (
          <Link key={w.title} to={w.to} className="card">
            <h3>{w.title}</h3>
            <span className="metric">
              {summary ? (summary[w.key] as number) : "—"}
            </span>
          </Link>
        ))}
        <div className="card">
          <h3>Publicity Contacts by Format</h3>
          {summary ? (
            <ul className="format-list">
              {summary.publicity_contacts_by_format.map((f) => (
                <li key={f.format}>
                  <span>{f.format}</span>
                  <strong>{f.n}</strong>
                </li>
              ))}
              {summary.publicity_contacts_by_format.length === 0 && (
                <li className="muted">No contacts yet.</li>
              )}
            </ul>
          ) : (
            <span className="metric">—</span>
          )}
        </div>
      </div>
    </section>
  );
}
