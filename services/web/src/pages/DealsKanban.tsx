import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { api, ApiError } from "../api/client";
import { useMeta } from "../lib/useMeta";
import { useAuth } from "../auth/AuthContext";
import { Star, DataLegend } from "../components/NeedsData";
import { ResourcePage } from "./ResourcePage";
import { MODULES } from "../modules";

/**
 * Unified Deals hub (REQ-021/022) — the single "Deals" destination that replaces
 * the separate B2B Leads / Pipeline / B2G Opportunities nav items. Two toggles:
 * a sub-view (Commercial B2B / Federal B2G, per design 3A) and a layout (Board /
 * List). The List layout reuses the generic ResourcePage (filters/search/CSV/
 * create) for the underlying module.
 *
 * Board layout — one board, two pipelines:
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

/** Admin-configurable stage row (lead_statuses / b2g_capture_stages). */
interface StageRow {
  id: string;
  label: string;
  sort_order: number;
  is_closed?: boolean;
  is_active?: boolean;
}

/** Federal capture lifecycle — fallback until stage config loads. */
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
  const [params, setParams] = useSearchParams();
  // Sub-view (commercial/federal) and layout (board/list) are URL-driven so the
  // dashboard and other pages can deep-link straight to a specific view.
  const mode: "b2b" | "b2g" = params.get("type") === "b2g" ? "b2g" : "b2b";
  const view: "board" | "list" = params.get("view") === "list" ? "list" : "board";
  const setMode = (m: "b2b" | "b2g") =>
    setParams((p) => {
      p.set("type", m);
      return p;
    });
  const setView = (v: "board" | "list") =>
    setParams((p) => {
      p.set("view", v);
      return p;
    });
  const [leads, setLeads] = useState<Lead[]>([]);
  const [opps, setOpps] = useState<Opp[]>([]);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [newForm, setNewForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Admin-configurable stages (REQ-023): the board/steppers read live stage
  // config; meta is the fallback until the lists load.
  const { isAdmin } = useAuth();
  const [customizing, setCustomizing] = useState(false);
  const [b2bStageRows, setB2bStageRows] = useState<StageRow[] | null>(null);
  const [fedStageRows, setFedStageRows] = useState<StageRow[] | null>(null);
  const [newStage, setNewStage] = useState("");
  const loadStages = useCallback(() => {
    api.list<StageRow>("lead-statuses").then(setB2bStageRows).catch(() => {});
    api.list<StageRow>("b2g-capture-stages").then(setFedStageRows).catch(() => {});
  }, []);
  useEffect(() => {
    loadStages();
  }, [loadStages]);

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

  /** Create a new deal in the active pipeline and open its detail view. */
  async function createDeal(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      if (mode === "b2b") {
        if (!newForm.company_name?.trim()) return;
        const body: Record<string, unknown> = {
          company_name: newForm.company_name.trim(),
          status: newForm.status || (meta?.lead_statuses[0]?.label ?? "New"),
        };
        if (newForm.amount?.trim()) body.amount = Number(newForm.amount);
        if (newForm.close_date) body.close_date = newForm.close_date;
        if (newForm.owner_id) body.owner_id = newForm.owner_id;
        const created = await api.create<{ id: string }>("b2b-leads", body);
        navigate(`/b2b-leads/${created.id}`);
      } else {
        if (!newForm.notice_id?.trim()) return;
        const body: Record<string, unknown> = { notice_id: newForm.notice_id.trim() };
        if (newForm.agency_department?.trim()) body.agency_department = newForm.agency_department.trim();
        if (newForm.due_date) body.due_date = newForm.due_date;
        if (newForm.capture_stage) body.capture_stage = newForm.capture_stage;
        const created = await api.create<{ id: string }>("b2g-opportunities", body);
        navigate(`/b2g-opportunities/${created.id}`);
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  // ---- Stage config CRUD (admin) ----
  const stageResource = mode === "b2b" ? "lead-statuses" : "b2g-capture-stages";
  const stageRows = (mode === "b2b" ? b2bStageRows : fedStageRows) ?? [];

  async function addStage() {
    const label = newStage.trim();
    if (!label) return;
    try {
      const nextOrder = stageRows.reduce((m, s) => Math.max(m, s.sort_order || 0), 0) + 1;
      await api.create(stageResource, { label, sort_order: nextOrder });
      setNewStage("");
      loadStages();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function patchStage(s: StageRow, patch: Partial<StageRow>) {
    try {
      const body: Record<string, unknown> = {
        label: s.label,
        sort_order: s.sort_order,
        is_active: s.is_active !== false,
        ...patch,
      };
      if (mode === "b2b") body.is_closed = patch.is_closed ?? !!s.is_closed;
      await api.update(stageResource, s.id, body);
      loadStages();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function deleteStage(s: StageRow) {
    if (!window.confirm(`Delete the "${s.label}" stage? Existing records keep their value and appear under Unstaged.`))
      return;
    try {
      await api.remove(stageResource, s.id);
      loadStages();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const leadStages = b2bStageRows
    ? b2bStageRows
        .filter((s) => s.is_active !== false)
        .map((s) => ({ label: s.label, is_closed: !!s.is_closed }))
    : meta?.lead_statuses ?? [];
  const captureStages =
    fedStageRows && fedStageRows.length
      ? fedStageRows.filter((s) => s.is_active !== false).map((s) => s.label)
      : meta?.capture_stages?.length
        ? meta.capture_stages
        : CAPTURE_STAGES;
  // Federal columns: only prepend "Unstaged" if some record lands there.
  const oppStageOf = (o: Opp) =>
    o.capture_stage && captureStages.includes(o.capture_stage)
      ? o.capture_stage
      : UNSTAGED;
  const hasUnstaged = opps.some((o) => oppStageOf(o) === UNSTAGED);
  const fedStages = hasUnstaged ? [UNSTAGED, ...captureStages] : captureStages;

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
      <div className="page-head" style={{ alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <span className="topbar-title" style={{ fontSize: 18 }}>
          Pipeline
        </span>
        <span className="spacer" />
        {/* Sub-view: commercial (B2B) vs federal (B2G) — design 3A toggle */}
        <div className="seg-toggle" role="tablist" aria-label="Deal type">
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
        {/* Layout: pipeline board vs filterable list */}
        <div className="seg-toggle" role="tablist" aria-label="Layout">
          <button
            className={"seg" + (view === "board" ? " on" : "")}
            onClick={() => setView("board")}
            role="tab"
            aria-selected={view === "board"}
            title="Pipeline board"
          >
            <span className="material-symbols-rounded" style={{ fontSize: 17 }}>view_kanban</span>
            Board
          </button>
          <button
            className={"seg" + (view === "list" ? " on" : "")}
            onClick={() => setView("list")}
            role="tab"
            aria-selected={view === "list"}
            title="Filterable list + CSV export"
          >
            <span className="material-symbols-rounded" style={{ fontSize: 17 }}>table_rows</span>
            List
          </button>
        </div>
        {isAdmin && (
          <button
            className="btn"
            style={{ color: "var(--accent-strong)", borderColor: "var(--accent)" }}
            onClick={() => setCustomizing(true)}
            title="Customize pipeline stages"
          >
            <span className="material-symbols-rounded" style={{ fontSize: 17, verticalAlign: "-3px", marginRight: 4 }}>tune</span>
            Customize
          </button>
        )}
        <button
          className="btn btn-primary"
          onClick={() => {
            setNewForm({});
            setCreating(true);
          }}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 17, verticalAlign: "-3px", marginRight: 4 }}>add</span>
          New {mode === "b2b" ? "deal" : "opportunity"}
        </button>
      </div>

      <div style={{ marginBottom: 14 }}>
        <DataLegend />
      </div>

      {error && <p className="error">{error}</p>}

      {/* List view reuses the generic ResourcePage (filters, search, CSV, create,
          custom fields) for the underlying module — one destination, full CRUD. */}
      {view === "list" ? (
        <ResourcePage
          key={mode}
          config={MODULES[mode === "b2b" ? "b2b-leads" : "b2g-opportunities"]}
        />
      ) : (
        <>

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
                    <Link to={`/b2b-leads/${l.id}`} className="kanban-card-title" style={{ color: "var(--text)" }}>
                      {l.company_name}
                    </Link>
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
                        {captureStages.map((st) => (
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
      )}

      {creating && (
        <div className="modal-overlay" onClick={() => setCreating(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div style={{ fontWeight: 700, fontSize: 15.5 }}>
                New {mode === "b2b" ? "commercial deal" : "federal opportunity"}
              </div>
              <button className="icon-btn" onClick={() => setCreating(false)} aria-label="Close">
                <span className="material-symbols-rounded">close</span>
              </button>
            </div>
            <form className="modal-body" onSubmit={createDeal}>
              {mode === "b2b" ? (
                <>
                  <label className="acq-field"><span className="dtl-label">Company *</span>
                    <input required value={newForm.company_name ?? ""} onChange={(e) => setNewForm({ ...newForm, company_name: e.target.value })} /></label>
                  <div className="form-grid">
                    <label className="acq-field"><span className="dtl-label">Contract value</span>
                      <input type="number" value={newForm.amount ?? ""} onChange={(e) => setNewForm({ ...newForm, amount: e.target.value })} /></label>
                    <label className="acq-field"><span className="dtl-label">Close date</span>
                      <input type="date" value={newForm.close_date ?? ""} onChange={(e) => setNewForm({ ...newForm, close_date: e.target.value })} /></label>
                    <label className="acq-field"><span className="dtl-label">Stage</span>
                      <select value={newForm.status ?? ""} onChange={(e) => setNewForm({ ...newForm, status: e.target.value })}>
                        <option value="">—</option>
                        {(meta?.lead_statuses ?? []).map((s) => <option key={s.label} value={s.label}>{s.label}</option>)}
                      </select></label>
                    <label className="acq-field"><span className="dtl-label">Owner</span>
                      <select value={newForm.owner_id ?? ""} onChange={(e) => setNewForm({ ...newForm, owner_id: e.target.value })}>
                        <option value="">—</option>
                        {(meta?.owners ?? []).map((o) => <option key={o.id} value={o.id}>{o.display_name || o.email}</option>)}
                      </select></label>
                  </div>
                </>
              ) : (
                <>
                  <label className="acq-field"><span className="dtl-label">Notice ID *</span>
                    <input required value={newForm.notice_id ?? ""} onChange={(e) => setNewForm({ ...newForm, notice_id: e.target.value })} /></label>
                  <div className="form-grid">
                    <label className="acq-field"><span className="dtl-label">Agency</span>
                      <input value={newForm.agency_department ?? ""} onChange={(e) => setNewForm({ ...newForm, agency_department: e.target.value })} /></label>
                    <label className="acq-field"><span className="dtl-label">Due date</span>
                      <input type="date" value={newForm.due_date ?? ""} onChange={(e) => setNewForm({ ...newForm, due_date: e.target.value })} /></label>
                    <label className="acq-field"><span className="dtl-label">Capture stage</span>
                      <select value={newForm.capture_stage ?? ""} onChange={(e) => setNewForm({ ...newForm, capture_stage: e.target.value })}>
                        <option value="">—</option>
                        {captureStages.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select></label>
                  </div>
                </>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-primary" type="submit" disabled={saving}>
                  {saving ? "Creating…" : "Create & open"}
                </button>
                <button className="btn" type="button" onClick={() => setCreating(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin: customize the active pipeline's stages (REQ-023) */}
      {customizing && isAdmin && (
        <div className="modal-overlay" onClick={() => setCustomizing(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-head">
              <div>
                <div style={{ fontWeight: 700, fontSize: 15.5 }}>
                  Customize {mode === "b2b" ? "sales" : "capture"} stages
                </div>
                <div className="muted" style={{ fontSize: 12 }}>
                  Admin only · drives the board columns, steppers and filters
                </div>
              </div>
              <button className="icon-btn" onClick={() => setCustomizing(false)} aria-label="Close">
                <span className="material-symbols-rounded">close</span>
              </button>
            </div>
            <div className="modal-body">
              {stageRows.length === 0 && <p className="muted" style={{ fontSize: 12.5 }}>No stages yet.</p>}
              {stageRows.map((s) => (
                <div className="stage-item" key={s.id} style={s.is_active === false ? { opacity: 0.55 } : undefined}>
                  <input
                    className="stage-edit"
                    defaultValue={s.label}
                    aria-label={`Rename ${s.label}`}
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (v && v !== s.label) patchStage(s, { label: v });
                    }}
                    onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()}
                  />
                  {mode === "b2b" && (
                    <button
                      type="button"
                      className="chip"
                      style={
                        s.is_closed
                          ? { background: "var(--pos-soft)", color: "var(--pos)", cursor: "pointer", border: "none" }
                          : { background: "var(--surface-3)", color: "var(--text-3)", cursor: "pointer", border: "none" }
                      }
                      title="Closed stages are terminal (drive won/lost rollups)"
                      onClick={() => patchStage(s, { is_closed: !s.is_closed })}
                    >
                      {s.is_closed ? "Closed" : "Open"}
                    </button>
                  )}
                  <button
                    type="button"
                    className={"switch " + (s.is_active !== false ? "on" : "off")}
                    title={s.is_active !== false ? "Active — click to deactivate" : "Inactive — click to activate"}
                    onClick={() => patchStage(s, { is_active: s.is_active === false })}
                  >
                    <span className="knob" />
                  </button>
                  <button
                    type="button"
                    className="icon-btn row-del"
                    style={{ width: 28, height: 28 }}
                    title="Delete stage"
                    onClick={() => void deleteStage(s)}
                  >
                    <span className="material-symbols-rounded" style={{ fontSize: 16 }}>delete</span>
                  </button>
                </div>
              ))}
              <div className="stage-add">
                <input
                  value={newStage}
                  placeholder="New stage…"
                  onChange={(e) => setNewStage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && void addStage()}
                />
                <button className="dashed-btn" style={{ width: "auto", flex: "0 0 auto", padding: "9px 12px" }} onClick={() => void addStage()}>
                  <span className="material-symbols-rounded" style={{ fontSize: 17 }}>add</span>
                  Add stage
                </button>
              </div>
              <div className="sync-note">
                <span className="material-symbols-rounded" style={{ fontSize: 18, color: "var(--accent-strong)" }}>database</span>
                <span>Changes apply to the board immediately. Records in a removed stage keep their value and appear under Unstaged.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
