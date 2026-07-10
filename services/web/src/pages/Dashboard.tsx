import { Link } from "react-router-dom";

/**
 * Unified home dashboard (REQ-013). Surfaces one widget per module, each
 * linking to the relevant filtered list view. Data wiring (aggregation from
 * /api/v1/dashboard) is a TODO under the scaffold scope.
 */
const WIDGETS = [
  { title: "Upcoming Events", to: "/events", hint: "Events on or after today" },
  {
    title: "Approaching Submission Deadlines",
    to: "/submissions",
    hint: "Deadline within threshold, not yet submitted",
  },
  {
    title: "Leads Due for Follow-up",
    to: "/b2b-leads?filter=overdue",
    hint: "Reminder Date today or past, status not closed",
  },
  {
    title: "B2G Opportunities Nearing Due Date",
    to: "/b2g-opportunities?filter=due-soon",
    hint: "Due Date within threshold",
  },
  {
    title: "Publicity Contacts by Format",
    to: "/publicity-contacts",
    hint: "Counts grouped by format",
  },
];

export function Dashboard() {
  return (
    <section>
      <h1>Dashboard</h1>
      <div className="grid">
        {WIDGETS.map((w) => (
          <Link key={w.title} to={w.to} className="card">
            <h3>{w.title}</h3>
            <p className="muted">{w.hint}</p>
            {/* TODO(scaffold): show live count/summary from /api/v1/dashboard. */}
            <span className="metric">—</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
