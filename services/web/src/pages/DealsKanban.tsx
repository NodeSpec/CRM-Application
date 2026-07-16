import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiError } from "../api/client";
import { useMeta } from "../lib/useMeta";
import { Star } from "../components/NeedsData";

/**
 * Unified deal pipeline (REQ-021/022) — reproduces design 3A's Commercial (B2B)
 * / Federal (B2G) toggle. One board, two pipelines:
 *   • Commercial: B2B leads by sales status, cards show deal amount.
 *   • Federal: B2G opportunities by capture stage, cards show fit + due date and
 *     link to the capture cockpit. Ceiling value isn't modeled yet (marked *).
 */
interface Lead {
  id: string;
  company_name: string;
  amount?: number | null;
  status: string;
  owner_id?: string | null;
  close_date?: string | null;
}
interface Opp {
  id: string;
  notice_id: string;
  agency_department?: string | null;
  capture_stage?: string | null;
  fit_score_numeric?: number | null;
  due_date?: string | null;
  status?: string | null;
}

/** Federal capture lifecycle — mirrors B2GCaptureView. */
const CAPTURE_STAGES = [
  "Identify",
  "Qualify",
  "Pursue",
  "Capture",
  "Proposal",
  "Submitted",
  "Award",
];
const WON = "Closed-Won";
const UNSTAGED = "Unstaged";

const money = (n?: number | null) =>
  n == null ? "" : "$" + Number(n).toLocaleString();

/** Days until a due date (negative = overdue); null if no date. */
function daysTo(date?: string | null): number | null {
  if (!date) return null;
  const ms = new Date(date).getTime() - Date.now();
  return Math.round(ms / 86_400_000);
}

export function DealsKanban() {
  const meta = useMeta();
  const [mode, setMode] = useState<"b2b" | "b2g">("b2b");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [opps, setOpps] = useState<Opp[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api
      .list<Lead>("b2b-leads")
      .then(setLeads)
      .catch((e) =>
        setError(
          e instanceof ApiError && e.status === 401
            ? "Please log in."
            : `Failed to load: ${(e as Error).message}`
        )
      );
    api.list<Opp>("b2g-opportunities").then(setOpps).catch(() => {});
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const ownerName = (id?: string | null) =>
    meta?.owners.find((o) => o.id === id)?.display_name ?? "";
  const b2gDays = meta?.thresholds.b2g_due_date_threshold_days ?? 14;

  async function moveLead(l: Lead, status: string) {
    try {
      await api.update("b2b-leads", l.id, { company_name: l.company_name, status });
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function moveOpp(o: Opp, capture_stage: string) {
    try {
      await api.update("b2g-opportunities", o.id, {
        notice_id: o.notice_id,
        capture_stage,
      });
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const leadStages = meta?.lead_statuses ?? [];
  // Federal columns: only prepend "Unstaged" if some record lands there.
  const oppStageOf = (o: Opp) =>
    o.capture_stage && CAPTURE_STAGES.includes(o.capture_stage)
      ? o.capture_stage
      : UNSTAGED;
  const hasUnstaged = opps.some((o) => oppStageOf(o) === UNSTAGED);
  const fedStages = hasUnstaged ? [UNSTAGED, ...CAPTURE_STAGES] : CAPTURE_STAGES;

  // Summary rollups for the active mode.
  const openLeads = leads.filter((l) => {
    const st = leadStages.find((s) => s.label === l.status);
    return st ? !st.is_closed : true;
  });
  const openValue = openLeads.reduce((a, l) => a + (Number(l.amount) || 0), 0);
  const wonValue = leads
    .filter((l) => l.status === WON)
    .reduce((a, l) => a + (Number(l.amount) || 0), 0);
  const fitScores = opps
    .map((o) => Number(o.fit_score_numeric))
    .filter((n) => !Number.isNaN(n) && n > 0);
  const avgFit = fitScores.length
    ? (fitScores.reduce((a, n) => a + n, 0) / fitScores.length).toFixed(1)
    : "—";
  const dueSoon = opps.filter((o) => {
    const d = daysTo(o.due_date);
    return d != null && d >= 0 && d <= b2gDays;
  }).length;

  return (
    <>
      <div className="page-head" style={{ alignItems: "center" }}>
        <span className="topbar-title" style={{ fontSize: 18 }}>
          Pipeline
        </span>
        <span className="spacer" />
        <div className="seg-toggle" role="tablist" aria-label="Pipeline type">
          <button
            className={"seg" + (mode === "b2b" ? " on" : "")}
            onClick={() => setMode("b2b")}
            role="tab"
            aria-selected={mode === "b2b"}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 17 }}>
              handshake
            </span>
            Commercial · B2B
          </button>
          <button
            className={"seg" + (mode === "b2g" ? " on" : "")}
            onClick={() => setMode("b2g")}
            role="tab"
            aria-selected={mode === "b2g"}
          >
            <span className="material-symbols-rounded" style={{ fontSize: 17 }}>
              account_balance
            </span>
            Federal · B2G
          </button>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      {/* Summary rollups */}
      {mode === "b2b" ? (
        <div className="pipe-summary">
          <div className="stat-mini">
            <div className="m-label">Open pipeline</div>
            <div className="m-val tnum">{money(openValue) || "$0"}</div>
          </div>
          <div className="stat-mini">
            <div className="m-label">Open deals</div>
            <div className="m-val tnum">{openLeads.length}</div>
          </div>
          <div className="stat-mini">
            <div className="m-label">Won revenue</div>
            <div className="m-val tnum">{money(wonValue) || "$0"}</div>
          </div>
          <div className="stat-mini">
            <div className="m-label">Total leads</div>
            <div className="m-val tnum">{leads.length}</div>
          </div>
        </div>
      ) : (
        <div className="pipe-summary">
          <div className="stat-mini">
            <div className="m-label">Open opportunities</div>
            <div className="m-val tnum">{opps.length}</div>
          </div>
          <div className="stat-mini">
            <div className="m-label">Due within {b2gDays}d</div>
            <div className="m-val tnum">{dueSoon}</div>
          </div>
          <div className="stat-mini">
            <div className="m-label">Avg fit score</div>
            <div className="m-val tnum">{avgFit}</div>
          </div>
          <div className="stat-mini">
            <div className="m-label">
              Ceiling value<Star note="No contract ceiling / IDIQ value field yet" />
            </div>
            <div className="m-val tnum muted">—</div>
          </div>
        </div>
      )}

      {/* Board */}
      {mode === "b2b" ? (
        <div className="kanban">
          {leadStages.map((s) => {
            const col = leads.filter((l) => l.status === s.label);
            const total = col.reduce((a, l) => a + (Number(l.amount) || 0), 0);
            return (
              <div className="kanban-col" key={s.label}>
                <div className="kanban-col-head">
                  <span>{s.label}</span>
                  <span className="muted tnum">
                    {col.length} · {money(total) || "$0"}
                  </span>
                </div>
                {col.map((l) => (
                  <div className="kanban-card" key={l.id}>
                    <div className="kanban-card-title">{l.company_name}</div>
                    <div className="tnum kanban-card-amt">
                      {money(l.amount) || "—"}
                    </div>
                    <div className="kanban-card-sub">
                      {[
                        ownerName(l.owner_id),
                        l.close_date ? `close ${l.close_date.slice(0, 10)}` : "",
                      ]
                        .filter(Boolean)
                        .join(" · ") || " "}
                    </div>
                    <select
                      value={l.status}
                      onChange={(e) => moveLead(l, e.target.value)}
                    >
                      {leadStages.map((st) => (
                        <option key={st.label} value={st.label}>
                          {st.label}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
                {col.length === 0 && (
                  <div
                    className="muted"
                    style={{ fontSize: 12, padding: "6px 2px" }}
                  >
                    —
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="kanban">
          {fedStages.map((stage) => {
            const col = opps.filter((o) => oppStageOf(o) === stage);
            return (
              <div className="kanban-col" key={stage}>
                <div className="kanban-col-head">
                  <span>{stage}</span>
                  <span className="muted tnum">{col.length}</span>
                </div>
                {col.map((o) => {
                  const d = daysTo(o.due_date);
                  const dueCls =
                    d == null
                      ? ""
                      : d < 0
                      ? " over"
                      : d <= b2gDays
                      ? " soon"
                      : "";
                  return (
                    <div className="kanban-card" key={o.id}>
                      <Link
                        to={`/b2g-opportunities/${o.id}`}
                        className="kanban-card-title"
                        style={{ color: "var(--text)" }}
                      >
                        {o.notice_id}
                      </Link>
                      <div className="kanban-card-sub">
                        {o.agency_department || "—"}
                      </div>
                      <div className="kanban-card-row">
                        {o.fit_score_numeric != null && (
                          <span className="fit-badge">
                            <span
                              className="material-symbols-rounded"
                              style={{ fontSize: 12 }}
                            >
                              target
                            </span>
                            Fit {o.fit_score_numeric}
                          </span>
                        )}
                        {o.due_date && (
                          <span className={"due-chip" + dueCls}>
                            <span
                              className="material-symbols-rounded"
                              style={{ fontSize: 12 }}
                            >
                              event
                            </span>
                            {o.due_date.slice(0, 10)}
                          </span>
                        )}
                      </div>
                      <select
                        value={oppStageOf(o) === UNSTAGED ? "" : o.capture_stage ?? ""}
                        onChange={(e) => moveOpp(o, e.target.value)}
                      >
                        {oppStageOf(o) === UNSTAGED && (
                          <option value="" disabled>
                            Set stage…
                          </option>
                        )}
                        {CAPTURE_STAGES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                  );
                })}
                {col.length === 0 && (
                  <div
                    className="muted"
                    style={{ fontSize: 12, padding: "6px 2px" }}
                  >
                    —
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
