import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiError } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { Star, DataLegend } from "../components/NeedsData";

/**
 * Unified home dashboard (REQ-013), styled after design 1A "Calm" but populated
 * entirely from our real API — no fabricated revenue/sales/tasks data. KPI cards
 * deep-link into the relevant filtered list views.
 */
interface Summary {
  upcoming_events: number;
  approaching_submission_deadlines: number;
  leads_due_for_follow_up: number;
  b2g_opportunities_nearing_due_date: number;
  publicity_contacts_by_format: { format: string; n: number }[];
  leads_by_status: { status: string; n: number }[];
  open_pipeline_value: number;
  won_revenue: number;
  open_deals: number;
  recent_activities: {
    id: string;
    type: string;
    subject?: string;
    module?: string;
    occurred_at: string;
    actor?: string | null;
  }[];
  tasks_due: { id: string; title: string; due_date?: string }[];
  thresholds: {
    b2g_due_date_threshold_days: number;
    submission_deadline_threshold_days: number;
  };
}

function greetingWord(d: Date): string {
  const h = d.getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

const money = (n?: number) =>
  n == null ? "—" : "$" + Number(n).toLocaleString();

export function Dashboard() {
  const { user } = useAuth();
  const [s, setS] = useState<Summary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const now = new Date();

  useEffect(() => {
    api
      .object<Summary>("dashboard")
      .then(setS)
      .catch((e) =>
        setError(
          e instanceof ApiError && e.status === 401
            ? "Please log in to view the dashboard."
            : `Failed to load dashboard: ${(e as Error).message}`
        )
      );
  }, []);

  const b2gDays = s?.thresholds.b2g_due_date_threshold_days ?? 14;
  const subDays = s?.thresholds.submission_deadline_threshold_days ?? 14;

  const kpis = [
    {
      icon: "event",
      label: "Upcoming events",
      value: s?.upcoming_events,
      sub: "On or after today",
      to: "/events?when=upcoming",
    },
    {
      icon: "description",
      label: "Approaching deadlines",
      value: s?.approaching_submission_deadlines,
      sub: `Submissions due within ${subDays} days`,
      to: "/submissions?due=soon",
    },
    {
      icon: "notifications_active",
      label: "Leads due for follow-up",
      value: s?.leads_due_for_follow_up,
      sub: "Reminder date reached, still open",
      to: "/deals?type=b2b&view=list&due=overdue",
      warn: true,
    },
    {
      icon: "handshake",
      label: "B2G nearing due date",
      value: s?.b2g_opportunities_nearing_due_date,
      sub: `Due within ${b2gDays} days`,
      to: "/deals?type=b2g&view=list&due=soon",
      warn: true,
    },
  ];

  const maxFormat = Math.max(
    1,
    ...(s?.publicity_contacts_by_format.map((r) => r.n) ?? [1])
  );
  const totalLeads = (s?.leads_by_status ?? []).reduce((a, r) => a + r.n, 0);

  return (
    <>
      <div>
        <div className="greeting-title">
          {greetingWord(now)}, {user?.displayName?.split(" ")[0] || "there"} 👋
        </div>
        <div className="greeting-sub">
          Here's what's happening across your CRM today,{" "}
          {now.toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
          .
        </div>
        <div style={{ marginTop: 10 }}>
          <DataLegend />
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      {/* KPI cards */}
      <div className="kpi-grid">
        {kpis.map((k) => (
          <Link key={k.label} to={k.to} className="kpi-card">
            <div className="kpi-top">
              <span className={"kpi-icon" + (k.warn ? " warn" : "")}>
                <span className="material-symbols-rounded">{k.icon}</span>
              </span>
            </div>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value tnum">{k.value ?? "—"}</div>
            <div className="kpi-sub">{k.sub}</div>
          </Link>
        ))}
      </div>

      {/* Revenue / pipeline (from real deal amounts, REQ-021) */}
      <div className="stat-row">
        <Link to="/deals" className="kpi-card">
          <div className="kpi-label">Open pipeline value</div>
          <div className="kpi-value tnum">{money(s?.open_pipeline_value)}</div>
          <div className="kpi-sub">{s?.open_deals ?? 0} open deals</div>
        </Link>
        <div className="kpi-card">
          <div className="kpi-label">Won revenue</div>
          <div className="kpi-value tnum">{money(s?.won_revenue)}</div>
          <div className="kpi-sub">Closed-won deals</div>
        </div>
      </div>

      {/* Panels: leads-by-status pipeline (real) + revenue trend (design 1A) */}
      <div className="grid-2">
        <div className="panel">
          <div className="panel-head">
            <div className="panel-title">Sales pipeline</div>
            <Link to="/deals?type=b2b&view=board" className="muted" style={{ fontSize: 13 }}>
              View all →
            </Link>
          </div>
          <div className="pipe-bar">
            {(s?.leads_by_status ?? []).map((r, i, arr) => (
              <div
                key={r.status}
                className="pipe-seg"
                style={{
                  flex: Math.max(r.n, 0.4),
                  opacity: 0.35 + (0.65 * (i + 1)) / arr.length,
                }}
                title={`${r.status}: ${r.n}`}
              />
            ))}
          </div>
          {(s?.leads_by_status ?? []).map((r, i, arr) => (
            <div className="pipe-row" key={r.status}>
              <span
                className="pipe-dot"
                style={{ opacity: 0.35 + (0.65 * (i + 1)) / arr.length }}
              />
              <Link
                to={`/deals?type=b2b&view=list&status=${encodeURIComponent(r.status)}`}
                className="pipe-name"
                style={{ color: "var(--text)" }}
              >
                {r.status}
              </Link>
              <span className="pipe-count tnum">{r.n}</span>
              <span className="pipe-val">
                <span className="muted" title="Per-stage value not aggregated yet">
                  —
                </span>
                <Star note="Per-stage pipeline value isn't aggregated yet" />
              </span>
            </div>
          ))}
          <div className="kpi-sub">{totalLeads} leads total</div>
        </div>

        <div className="panel" style={{ display: "flex", flexDirection: "column" }}>
          <div className="panel-head">
            <div className="panel-title">
              Revenue<Star note="Monthly revenue history isn't computed — bars are placeholder" />
            </div>
            <span className="badge">6 mo</span>
          </div>
          <div className="kpi-value tnum">{money(s?.won_revenue)}</div>
          <div className="kpi-sub">Closed-won, all time (real)</div>
          <div className="rev-chart">
            {["Feb", "Mar", "Apr", "May", "Jun", "Jul"].map((m, i) => (
              <div className={"rev-col" + (i === 5 ? " hi" : "")} key={m}>
                <div
                  className="bar"
                  style={{ height: `${[52, 44, 66, 58, 78, 100][i]}%` }}
                />
                <span>{m}</span>
              </div>
            ))}
          </div>
          <div className="kpi-sub" style={{ marginTop: 10 }}>
            Monthly trend shown for layout only.
          </div>
        </div>
      </div>

      {/* Publicity (real) */}
      <div className="panel">
          <div className="panel-head">
            <div className="panel-title">Publicity contacts by format</div>
          </div>
          <ul className="format-list">
            {(s?.publicity_contacts_by_format ?? []).map((f) => (
              <li key={f.format}>
                <span className="format-name">{f.format}</span>
                <span className="format-track">
                  <span
                    className="format-fill"
                    style={{ width: `${(f.n / maxFormat) * 100}%` }}
                  />
                </span>
                <span className="format-n tnum">{f.n}</span>
              </li>
            ))}
            {s && s.publicity_contacts_by_format.length === 0 && (
              <li className="muted">No contacts yet.</li>
            )}
          </ul>
      </div>

      {/* Recent activity + tasks due (REQ-024) */}
      <div className="grid-2">
        <div className="panel">
          <div className="panel-head">
            <div className="panel-title">Recent activity</div>
            <Link to="/activities" className="muted" style={{ fontSize: 13 }}>
              View all →
            </Link>
          </div>
          {(s?.recent_activities ?? []).map((a) => (
            <div className="feed-row" key={a.id}>
              <span className="badge">{a.type}</span>
              <span style={{ flex: 1 }}>{a.subject}</span>
              <span className="muted">{a.occurred_at.slice(0, 10)}</span>
            </div>
          ))}
          {s && s.recent_activities.length === 0 && (
            <p className="muted">No activity yet.</p>
          )}
        </div>
        <div className="panel">
          <div className="panel-head">
            <div className="panel-title">Tasks due</div>
            <Link to="/tasks" className="muted" style={{ fontSize: 13 }}>
              View all →
            </Link>
          </div>
          {(s?.tasks_due ?? []).map((t) => (
            <div className="feed-row" key={t.id}>
              <span className="material-symbols-rounded" style={{ fontSize: 18 }}>
                task_alt
              </span>
              <span style={{ flex: 1 }}>{t.title}</span>
              <span className="muted">{t.due_date?.slice(0, 10) ?? ""}</span>
            </div>
          ))}
          {s && s.tasks_due.length === 0 && (
            <p className="muted">Nothing due. 🎉</p>
          )}
        </div>
      </div>
    </>
  );
}
