import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { useMeta } from "../lib/useMeta";
import { Star, DataLegend } from "../components/NeedsData";

/**
 * Commercial (B2B) deal cockpit (REQ-021) — reproduces the updated design 3A
 * commercial branch with our real data: deal details, economics, MEDDIC
 * qualification, competitive landscape (sourced from the linked company's
 * competitors), forecast/health (win probability), buying committee (the
 * company's contacts), activity, and next steps (tasks). Fields without a home
 * in our schema are marked with an asterisk; MRR is intentionally omitted.
 */
interface Lead {
  id: string;
  company_name: string;
  industry_vertical?: string;
  primary_poc?: string;
  title_role?: string;
  lead_source?: string;
  status: string;
  amount?: number | null;
  close_date?: string | null;
  owner_id?: string | null;
  company_id?: string | null;
  probability?: number | null;
  meddic?: Record<string, string>;
  created_at?: string;
}
interface Contact {
  id: string;
  full_name: string;
  title?: string;
  lifecycle_stage?: string;
}
interface Competitor {
  id: string;
  name: string;
  note?: string;
  disposition?: string;
}
interface Activity {
  id: string;
  type: string;
  subject?: string;
  body?: string;
  occurred_at: string;
}
interface Task {
  id: string;
  title: string;
  status?: string;
  due_date?: string | null;
}

const MEDDIC_KEYS: [string, string][] = [
  ["metrics", "Metrics"],
  ["economic_buyer", "Economic buyer"],
  ["decision_criteria", "Decision criteria"],
  ["decision_process", "Decision process"],
  ["pain", "Pain"],
  ["champion", "Champion"],
];
const AV = ["#6d5ef0", "#0ea5a3", "#e0682f", "#2563eb", "#12a150", "#a855f7"];
const initials = (s: string) =>
  (s.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("") || "?").toUpperCase();
const avatarColor = (s: string) => AV[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % AV.length];
const money = (n?: number | null) => (n == null ? "—" : "$" + Number(n).toLocaleString());
const WON = "Closed-Won";

/** Disposition -> {label,color} for competitor rows. */
function dispo(d?: string): { label: string; color: string } {
  const k = (d ?? "watch").toLowerCase();
  if (k === "leading") return { label: "Leading", color: "var(--pos)" };
  if (k === "threat") return { label: "Threat", color: "var(--warn)" };
  if (k === "low") return { label: "Low", color: "var(--text-3)" };
  return { label: "Watch", color: "var(--text-2)" };
}

export function B2BDealView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const meta = useMeta();
  const [lead, setLead] = useState<Lead | null>(null);
  const [company, setCompany] = useState<{ id: string; name: string } | null>(null);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [comps, setComps] = useState<Competitor[]>([]);
  const [acts, setActs] = useState<Activity[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [editDetails, setEditDetails] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [note, setNote] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [compForm, setCompForm] = useState<Record<string, string>>({});

  const loadSubs = useCallback((companyId?: string | null) => {
    if (!id) return;
    api.list<Activity>("activities", { module: "b2b_leads", record_id: id }).then(setActs).catch(() => {});
    api.list<Task>("tasks", { module: "b2b_leads", record_id: id }).then(setTasks).catch(() => {});
    if (companyId) {
      api.list<Contact>("contacts", { company_id: companyId }).then(setContacts).catch(() => {});
      api.list<Competitor>("company-competitors", { company_id: companyId }).then(setComps).catch(() => {});
    }
  }, [id]);

  const load = useCallback(() => {
    if (!id) return;
    api
      .get<Lead>("b2b-leads", id)
      .then((l) => {
        setLead(l);
        loadSubs(l.company_id);
        if (l.company_id)
          api.get<{ id: string; name: string }>("companies", l.company_id).then(setCompany).catch(() => {});
      })
      .catch((e) => setError((e as Error).message));
  }, [id, loadSubs]);
  useEffect(() => {
    load();
  }, [load]);

  const ownerName = (oid?: string | null) => meta?.owners.find((o) => o.id === oid)?.display_name ?? "";
  const stages = meta?.lead_statuses ?? [];

  if (!lead) return error ? <p className="error">{error}</p> : <p className="muted">Loading…</p>;

  const curIdx = stages.findIndex((s) => s.label === lead.status);
  const prob = lead.probability ?? null;
  const weighted = lead.amount != null && prob != null ? (Number(lead.amount) * prob) / 100 : null;
  const ageDays = lead.created_at
    ? Math.max(0, Math.round((Date.now() - new Date(lead.created_at).getTime()) / 86_400_000))
    : null;
  const lastAct = acts[0]?.occurred_at ? acts[0].occurred_at.slice(0, 10) : "—";
  const meddicStrong = MEDDIC_KEYS.filter(([k]) => (lead.meddic?.[k] ?? "").trim()).length;

  async function save(body: Record<string, unknown>) {
    if (!lead) return;
    try {
      await api.update("b2b-leads", lead.id, { company_name: lead.company_name, ...body });
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function openEditor() {
    if (!lead) return;
    setForm({
      close_date: lead.close_date?.slice(0, 10) ?? "",
      lead_source: lead.lead_source ?? "",
      industry_vertical: lead.industry_vertical ?? "",
      primary_poc: lead.primary_poc ?? "",
      title_role: lead.title_role ?? "",
      amount: lead.amount != null ? String(lead.amount) : "",
    });
    setEditDetails(true);
  }
  async function saveDetails() {
    const body: Record<string, unknown> = {};
    ["close_date", "lead_source", "industry_vertical", "primary_poc", "title_role"].forEach((k) => {
      body[k] = form[k]?.trim() ? form[k].trim() : null;
    });
    body.amount = form.amount?.trim() ? Number(form.amount) : null;
    await save(body);
    setEditDetails(false);
  }
  async function setMeddic(key: string, value: string) {
    if (!lead) return;
    await save({ meddic: { ...(lead.meddic ?? {}), [key]: value } });
  }
  async function logActivity(e: FormEvent) {
    e.preventDefault();
    if (!note.trim() || !id) return;
    try {
      await api.create("activities", { type: "note", subject: note.trim(), module: "b2b_leads", record_id: id });
      setNote("");
      loadSubs(lead?.company_id);
    } catch (err) {
      setError((err as Error).message);
    }
  }
  async function addTask(e: FormEvent) {
    e.preventDefault();
    if (!taskTitle.trim() || !id) return;
    try {
      await api.create("tasks", { title: taskTitle.trim(), status: "open", module: "b2b_leads", record_id: id });
      setTaskTitle("");
      loadSubs(lead?.company_id);
    } catch (err) {
      setError((err as Error).message);
    }
  }
  async function toggleTask(t: Task) {
    try {
      await api.update("tasks", t.id, { title: t.title, status: t.status === "done" ? "open" : "done" });
      loadSubs(lead?.company_id);
    } catch (err) {
      setError((err as Error).message);
    }
  }
  async function addCompetitor(e: FormEvent) {
    e.preventDefault();
    if (!compForm.name?.trim() || !lead?.company_id) return;
    try {
      await api.create("company-competitors", {
        company_id: lead.company_id,
        name: compForm.name.trim(),
        note: compForm.note ?? "",
        disposition: compForm.disposition || "watch",
      });
      setCompForm({});
      loadSubs(lead.company_id);
    } catch (err) {
      setError((err as Error).message);
    }
  }
  async function removeCompetitor(c: Competitor) {
    try {
      await api.remove("company-competitors", c.id);
      loadSubs(lead?.company_id);
    } catch (err) {
      setError((err as Error).message);
    }
  }

  async function deleteDeal() {
    if (!lead) return;
    if (!window.confirm(`Delete the "${lead.company_name}" deal? This cannot be undone.`)) return;
    try {
      await api.remove("b2b-leads", lead.id);
      navigate("/deals?type=b2b");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <>
      <div className="page-head">
        <Link to="/deals?type=b2b" className="muted">← Pipeline</Link>
        <span className="spacer" />
        <DataLegend />
        <button
          className="icon-btn row-del"
          style={{ width: 34, height: 34 }}
          title="Delete deal"
          onClick={() => void deleteDeal()}
        >
          <span className="material-symbols-rounded" style={{ fontSize: 18 }}>delete</span>
        </button>
      </div>

      {error && (
        <div className="error" style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span style={{ flex: 1 }}>{error}</span>
          <button className="btn" onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {/* Header */}
      <div className="detail-header">
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="crumb">
              <span>Pipeline</span><span>/</span>
              <span className="chip chip-b2b">B2B · COMMERCIAL</span>
              <span className="chip" style={{ background: "var(--accent-soft)", color: "var(--accent-strong)" }}>
                {lead.status}
              </span>
            </div>
            <div className="detail-title">{lead.company_name}</div>
            <div className="detail-sub">
              {[lead.industry_vertical, lead.primary_poc, company ? "Account linked" : ""].filter(Boolean).join(" · ") || "—"}
            </div>
          </div>
          <div style={{ flex: "0 0 auto", textAlign: "right" }}>
            <div className="dtl-label">Contract value</div>
            <div className="value-lg tnum">{money(lead.amount)}</div>
            <div className="detail-sub">
              MRR<Star note="No recurring / subscription basis captured — MRR omitted" />
              {" · "}close {lead.close_date ? lead.close_date.slice(0, 10) : "—"}
            </div>
          </div>
        </div>
        {/* Sales pipeline stepper */}
        <div className="stepper" style={{ marginTop: 18 }}>
          {stages.map((st, i) => (
            <button
              key={st.label}
              className={"step" + (i === curIdx ? " active" : "") + (curIdx >= 0 && i < curIdx ? " done" : "")}
              onClick={() => save({ status: st.label })}
            >
              {st.label}
            </button>
          ))}
        </div>
      </div>

      <div className="detail-cols">
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Deal details */}
          <div className="panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="icon-title" style={{ marginBottom: 0 }}>
                <span className="material-symbols-rounded">description</span>Deal details
              </div>
              {!editDetails && (
                <button className="btn" onClick={openEditor}>
                  <span className="material-symbols-rounded" style={{ fontSize: 16, verticalAlign: "-3px", marginRight: 4 }}>edit</span>Edit
                </button>
              )}
            </div>
            {editDetails ? (
              <>
                <div className="detail-grid" style={{ marginTop: 15 }}>
                  {[
                    ["amount", "Contract value"],
                    ["close_date", "Close date"],
                    ["lead_source", "Lead source"],
                    ["industry_vertical", "Industry"],
                    ["primary_poc", "Primary POC"],
                    ["title_role", "POC title"],
                  ].map(([k, label]) => (
                    <label key={k} className="acq-field">
                      <span className="dtl-label">{label}</span>
                      <input
                        type={k === "close_date" ? "date" : k === "amount" ? "number" : "text"}
                        value={form[k] ?? ""}
                        onChange={(e) => setForm({ ...form, [k]: e.target.value })}
                      />
                    </label>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                  <button className="btn btn-primary" onClick={saveDetails}>Save</button>
                  <button className="btn" onClick={() => setEditDetails(false)}>Cancel</button>
                </div>
              </>
            ) : (
              <div className="detail-grid" style={{ marginTop: 15 }}>
                <div><div className="dtl-label">Close date</div><div className={"dtl-val" + (lead.close_date ? "" : " muted")}>{lead.close_date ? lead.close_date.slice(0, 10) : "—"}</div></div>
                <div><div className="dtl-label">Deal owner</div><div className={"dtl-val" + (ownerName(lead.owner_id) ? "" : " muted")}>{ownerName(lead.owner_id) || "—"}</div></div>
                <div><div className="dtl-label">Lead source</div><div className={"dtl-val" + (lead.lead_source ? "" : " muted")}>{lead.lead_source || "—"}</div></div>
                <div><div className="dtl-label">Industry</div><div className={"dtl-val" + (lead.industry_vertical ? "" : " muted")}>{lead.industry_vertical || "—"}</div></div>
                <div><div className="dtl-label">Primary POC</div><div className={"dtl-val" + (lead.primary_poc ? "" : " muted")}>{lead.primary_poc || "—"}</div></div>
                <div><div className="dtl-label">Created</div><div className={"dtl-val" + (lead.created_at ? "" : " muted")}>{lead.created_at ? `${lead.created_at.slice(0, 10)}${ageDays != null ? ` · ${ageDays}d ago` : ""}` : "—"}</div></div>
              </div>
            )}
          </div>

          {/* Deal economics */}
          <div className="panel">
            <div className="icon-title"><span className="material-symbols-rounded">payments</span>Deal economics</div>
            <div className="econ-grid">
              <div className="econ-cell"><div className="dtl-label">Contract value</div><div className="econ-val tnum">{money(lead.amount)}</div></div>
              <div className="econ-cell"><div className="dtl-label">Weighted</div><div className="econ-val tnum">{weighted != null ? money(Math.round(weighted)) : "—"}</div></div>
              <div className="econ-cell"><div className="dtl-label">MRR<Star note="No recurring basis captured" /></div><div className="econ-val tnum muted">—</div></div>
              <div className="econ-cell"><div className="dtl-label">Gross margin<Star note="No cost/margin data captured" /></div><div className="econ-val tnum muted">—</div></div>
            </div>
            <div className="detail-grid" style={{ marginTop: 14 }}>
              <div><div className="dtl-label">Billing<Star note="Not modeled" /></div><div className="dtl-val muted">—</div></div>
              <div><div className="dtl-label">Payment terms<Star note="Not modeled" /></div><div className="dtl-val muted">—</div></div>
              <div><div className="dtl-label">Discount<Star note="No list price / discount captured" /></div><div className="dtl-val muted">—</div></div>
            </div>
          </div>

          {/* MEDDIC */}
          <div className="panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="icon-title" style={{ marginBottom: 0 }}>
                <span className="material-symbols-rounded">fact_check</span>Qualification (MEDDIC)
              </div>
              <span className="chip" style={{ background: "var(--pos-soft)", color: "var(--pos)" }}>{meddicStrong} / 6 strong</span>
            </div>
            <div className="gate-grid" style={{ marginTop: 15 }}>
              {MEDDIC_KEYS.map(([k, label]) => {
                const v = (lead.meddic?.[k] ?? "").trim();
                return (
                  <div className={"gate2 " + (v ? "ok" : "warn")} key={k}>
                    <span className="material-symbols-rounded g-ic">{v ? "check_circle" : "error"}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="g-title">{label}</div>
                      <input
                        className="g-detail"
                        placeholder="Add detail…"
                        defaultValue={v}
                        onBlur={(e) => {
                          if (e.target.value !== v) setMeddic(k, e.target.value);
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Competitive landscape (from the company's competitors) */}
          <div className="panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="icon-title" style={{ marginBottom: 0 }}>
                <span className="material-symbols-rounded">swords</span>Competitive landscape
                <span className="sync-chip"><span className="material-symbols-rounded">sync</span>from {company?.name ?? "account"}</span>
              </div>
            </div>
            {!lead.company_id && (
              <p className="muted" style={{ fontSize: 12.5, marginTop: 12 }}>
                Link this deal to a company to track competitors.
              </p>
            )}
            {lead.company_id && (
              <>
                <div className="comp-row">
                  <span className="comp-tag us">US</span>
                  <span style={{ fontSize: 13.5, fontWeight: 600, flex: 1 }}>Us</span>
                  <span className="muted" style={{ fontSize: 12.5 }}>Our proposal</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: "var(--pos)", width: 66, textAlign: "right" }}>Leading</span>
                </div>
                {comps.map((c) => {
                  const d = dispo(c.disposition);
                  return (
                    <div className="comp-row" key={c.id}>
                      <span className="comp-tag">ALT</span>
                      <span style={{ fontSize: 13.5, fontWeight: 600, flex: 1 }}>{c.name}</span>
                      <span className="muted" style={{ fontSize: 12.5, flex: 1, minWidth: 0 }}>{c.note}</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: d.color, width: 66, textAlign: "right" }}>{d.label}</span>
                      <button className="icon-btn" style={{ width: 26, height: 26 }} title="Remove" onClick={() => removeCompetitor(c)}>
                        <span className="material-symbols-rounded" style={{ fontSize: 15 }}>close</span>
                      </button>
                    </div>
                  );
                })}
                <form onSubmit={addCompetitor} style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                  <input placeholder="Competitor" value={compForm.name ?? ""} onChange={(e) => setCompForm({ ...compForm, name: e.target.value })} />
                  <input placeholder="Note" value={compForm.note ?? ""} onChange={(e) => setCompForm({ ...compForm, note: e.target.value })} style={{ flex: 1, minWidth: 120 }} />
                  <select value={compForm.disposition ?? "watch"} onChange={(e) => setCompForm({ ...compForm, disposition: e.target.value })}>
                    <option value="threat">Threat</option>
                    <option value="watch">Watch</option>
                    <option value="low">Low</option>
                    <option value="leading">Leading</option>
                  </select>
                  <button className="btn" type="submit">Add</button>
                </form>
              </>
            )}
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Forecast & health */}
          <div className="panel">
            <div className="icon-title"><span className="material-symbols-rounded">insights</span>Forecast &amp; health</div>
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
              <div className="prob-ring" style={{ background: `conic-gradient(var(--pos) 0 ${prob ?? 0}%, var(--surface-3) ${prob ?? 0}% 100%)` }}>
                <div className="prob-hole"><span className="tnum" style={{ fontSize: 15, fontWeight: 800 }}>{prob != null ? `${prob}%` : "—"}</span></div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>Win probability</div>
                <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>
                  Weighted at <b style={{ color: "var(--text)" }}>{weighted != null ? money(Math.round(weighted)) : "—"}</b>
                </div>
                <input
                  type="range" min={0} max={100} step={5} value={prob ?? 0}
                  onChange={(e) => setLead({ ...lead, probability: Number(e.target.value) })}
                  onMouseUp={(e) => save({ probability: Number((e.target as HTMLInputElement).value) })}
                  onTouchEnd={(e) => save({ probability: Number((e.target as HTMLInputElement).value) })}
                  style={{ width: "100%", marginTop: 8 }}
                />
              </div>
            </div>
            <div className="detail-grid">
              <div><div className="dtl-label">Deal age</div><div className="dtl-val">{ageDays != null ? `${ageDays} days` : "—"}</div></div>
              <div><div className="dtl-label">Last activity</div><div className="dtl-val">{lastAct}</div></div>
              <div><div className="dtl-label">Days in stage<Star note="Stage-entry timestamp not tracked" /></div><div className="dtl-val muted">—</div></div>
            </div>
          </div>

          {/* Buying committee (company contacts) */}
          <div className="panel">
            <div className="panel-head">
              <div className="icon-title" style={{ marginBottom: 0 }}>
                <span className="material-symbols-rounded">groups</span>Buying committee
                <span className="sync-chip"><span className="material-symbols-rounded">sync</span>from Contacts</span>
              </div>
            </div>
            {contacts.map((c) => (
              <div className="entity-row" key={c.id}>
                <span className="avatar-sm" style={{ background: avatarColor(c.full_name) }}>{initials(c.full_name)}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <Link to={`/contacts/${c.id}`} style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)" }}>{c.full_name}</Link>
                  <div className="muted" style={{ fontSize: 12 }}>{[c.title, c.lifecycle_stage].filter(Boolean).join(" · ")}</div>
                </div>
              </div>
            ))}
            {contacts.length === 0 && (
              <p className="muted" style={{ fontSize: 12.5 }}>
                {lead.company_id ? "No contacts on this account yet." : "Link a company to see its contacts."}
              </p>
            )}
          </div>

          {/* Recent activity */}
          <div className="panel">
            <div className="icon-title"><span className="material-symbols-rounded">history</span>Recent activity</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 12 }}>
              {acts.map((a) => (
                <div className="feed-card" key={a.id}>
                  <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 4 }}>
                    <span className="badge">{a.type}</span>
                    <span style={{ fontSize: 12.5, fontWeight: 700, flex: 1 }}>{a.subject}</span>
                    <span className="muted" style={{ fontSize: 11.5 }}>{a.occurred_at.slice(0, 10)}</span>
                  </div>
                  {a.body && <div style={{ fontSize: 13, lineHeight: 1.5 }}>{a.body}</div>}
                </div>
              ))}
              {acts.length === 0 && <p className="muted" style={{ fontSize: 12.5 }}>No activity yet.</p>}
            </div>
            <form onSubmit={logActivity} style={{ display: "flex", gap: 8 }}>
              <input style={{ flex: 1 }} placeholder="Log a note…" value={note} onChange={(e) => setNote(e.target.value)} />
              <button className="btn btn-primary" type="submit">Log</button>
            </form>
          </div>

          {/* Next steps (tasks) */}
          <div className="panel">
            <div className="icon-title"><span className="material-symbols-rounded">bolt</span>Next steps</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 9, marginBottom: 12 }}>
              {tasks.map((t) => (
                <div key={t.id} style={{ display: "flex", alignItems: "center", gap: 11 }}>
                  <button
                    className="task-check"
                    onClick={() => toggleTask(t)}
                    aria-label="toggle"
                    style={t.status === "done" ? { background: "var(--accent)", borderColor: "var(--accent)" } : undefined}
                  >
                    {t.status === "done" && <span className="material-symbols-rounded" style={{ fontSize: 14, color: "#fff" }}>check</span>}
                  </button>
                  <span style={{ fontSize: 13.5, flex: 1, textDecoration: t.status === "done" ? "line-through" : "none", color: t.status === "done" ? "var(--text-3)" : "var(--text)" }}>{t.title}</span>
                  {t.due_date && <span className="muted" style={{ fontSize: 11.5 }}>{t.due_date.slice(0, 10)}</span>}
                </div>
              ))}
              {tasks.length === 0 && <p className="muted" style={{ fontSize: 12.5 }}>No next steps yet.</p>}
            </div>
            <form onSubmit={addTask} style={{ display: "flex", gap: 8 }}>
              <input style={{ flex: 1 }} placeholder="Add next step…" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} />
              <button className="btn" type="submit">Add</button>
            </form>
          </div>

          {lead.status !== WON && (
            <button className="big-btn" onClick={() => save({ status: WON })}>
              <span className="material-symbols-rounded">check_circle</span>Mark as Won
            </button>
          )}
        </div>
      </div>
    </>
  );
}
