import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client";
import { Star, DataLegend } from "../components/NeedsData";

/**
 * B2G Federal Capture cockpit (REQ-022) — reproduces design option 3A with our
 * real opportunity + capture data: classification header, capture lifecycle
 * stepper, acquisition details, compliance gates, teaming, MEDDIC, milestones,
 * and government stakeholders.
 */
const CAPTURE_STAGES = [
  "Identify",
  "Qualify",
  "Pursue",
  "Capture",
  "Proposal",
  "Submitted",
  "Award",
];

const MEDDIC_KEYS: [string, string][] = [
  ["metrics", "Metrics"],
  ["economic_buyer", "Economic Buyer"],
  ["decision_criteria", "Decision Criteria"],
  ["decision_process", "Decision Process"],
  ["identify_pain", "Identify Pain"],
  ["champion", "Champion"],
  ["competition", "Competition"],
];

const AVATAR_COLORS = ["#6d5ef0", "#0ea5a3", "#e0682f", "#2563eb", "#12a150", "#a855f7"];

interface Opp {
  id: string;
  notice_id: string;
  agency_department?: string;
  focus_area_rr_role?: string;
  due_date?: string;
  status?: string;
  action_officer?: string;
  naics?: string;
  set_aside?: string;
  incumbent?: string;
  solicitation_number?: string;
  clearance_level?: string;
  capture_stage?: string;
  fit_score_numeric?: number;
  fit_score_tier?: string;
  meddic?: Record<string, string>;
}
type Row = Record<string, unknown>;

const initials = (s: string) =>
  (s.trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join("") || "?").toUpperCase();
const avatarColor = (s: string) =>
  AVATAR_COLORS[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length];

function Detail({
  label,
  value,
  star,
}: {
  label: string;
  value?: unknown;
  star?: string;
}) {
  return (
    <div>
      <div className="dtl-label">
        {label}
        {star && <Star note={star} />}
      </div>
      <div className={"dtl-val" + (value ? "" : " muted")}>
        {value ? String(value) : "—"}
      </div>
    </div>
  );
}

/** Inline add form for a capture sub-resource. */
function AddRow({
  resource,
  oppId,
  fields,
  onAdded,
}: {
  resource: string;
  oppId: string;
  fields: { name: string; label: string }[];
  onAdded: () => void;
}) {
  const [form, setForm] = useState<Record<string, string>>({});
  async function add(e: FormEvent) {
    e.preventDefault();
    try {
      await api.create(resource, { opportunity_id: oppId, ...form });
      setForm({});
      onAdded();
    } catch {
      /* ignore */
    }
  }
  return (
    <form onSubmit={add} style={{ display: "flex", gap: 6, marginTop: 10 }}>
      {fields.map((f) => (
        <input
          key={f.name}
          placeholder={f.label}
          value={form[f.name] ?? ""}
          onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
        />
      ))}
      <button className="btn" type="submit">
        Add
      </button>
    </form>
  );
}

/** Editable acquisition-detail fields (those backed by a real column). */
const ACQ_FIELDS: { name: keyof Opp; label: string }[] = [
  { name: "solicitation_number", label: "Solicitation #" },
  { name: "naics", label: "NAICS" },
  { name: "set_aside", label: "Set-aside" },
  { name: "clearance_level", label: "Clearance" },
  { name: "incumbent", label: "Incumbent" },
  { name: "focus_area_rr_role", label: "Focus area" },
  { name: "action_officer", label: "Action officer" },
  { name: "status", label: "Status" },
];

/** Standard federal compliance/security gates offered as one-click additions. */
const STANDARD_GATES = [
  "Facility Clearance (FCL)",
  "Personnel Clearance",
  "CMMC Level",
  "NIST SP 800-171",
  "ITAR",
  "FedRAMP / Impact Level",
];

export function B2GCaptureView() {
  const { id } = useParams();
  const [opp, setOpp] = useState<Opp | null>(null);
  const [teaming, setTeaming] = useState<Row[]>([]);
  const [stakeholders, setStakeholders] = useState<Row[]>([]);
  const [gates, setGates] = useState<Row[]>([]);
  // Ref mirror of `gates` — a reliable "latest" source for optimistic gate edits
  // (useState functional updaters don't run synchronously, so we can't read the
  // merged value back inline).
  const gatesRef = useRef<Row[]>([]);
  useEffect(() => {
    gatesRef.current = gates;
  }, [gates]);
  const [error, setError] = useState<string | null>(null);
  const [editAcq, setEditAcq] = useState(false);
  const [acqForm, setAcqForm] = useState<Record<string, string>>({});
  const [savingAcq, setSavingAcq] = useState(false);

  const loadSubs = useCallback(() => {
    if (!id) return;
    api.list<Row>("b2g-teaming-partners", { opportunity_id: id }).then(setTeaming).catch(() => {});
    api.list<Row>("b2g-stakeholders", { opportunity_id: id }).then(setStakeholders).catch(() => {});
    api
      .list<Row>("b2g-compliance-gates", { opportunity_id: id })
      // Stable display order (rows seeded together share a created_at timestamp).
      .then((gs) => setGates([...gs].sort((a, b) => String(a.label).localeCompare(String(b.label)))))
      .catch(() => {});
  }, [id]);
  const load = useCallback(() => {
    if (!id) return;
    api.get<Opp>("b2g-opportunities", id).then(setOpp).catch((e) => setError((e as Error).message));
    loadSubs();
  }, [id, loadSubs]);
  useEffect(() => {
    load();
  }, [load]);

  async function setStage(stage: string) {
    if (!opp) return;
    try {
      await api.update("b2g-opportunities", opp.id, {
        notice_id: opp.notice_id,
        capture_stage: stage,
      });
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  function openAcqEditor() {
    if (!opp) return;
    const init: Record<string, string> = {};
    ACQ_FIELDS.forEach((f) => {
      const v = opp[f.name];
      init[f.name as string] = v == null ? "" : String(v);
    });
    setAcqForm(init);
    setEditAcq(true);
  }

  async function saveAcq() {
    if (!opp) return;
    setSavingAcq(true);
    try {
      const body: Record<string, unknown> = { notice_id: opp.notice_id };
      ACQ_FIELDS.forEach((f) => {
        const v = acqForm[f.name as string]?.trim() ?? "";
        // fit is numeric elsewhere; these acquisition fields are all text.
        body[f.name as string] = v === "" ? null : v;
      });
      await api.update("b2g-opportunities", opp.id, body);
      setEditAcq(false);
      load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSavingAcq(false);
    }
  }

  /**
   * Persist a change to one gate (Good/Gap flag or its detail text). Reads the
   * latest gate from state (not a stale closure) so a Good/Gap click and a detail
   * blur can't clobber each other, updates optimistically, and does NOT refetch on
   * success (refetching was reverting the change). Reconciles only on error.
   */
  async function patchGate(gateId: string, patch: { met?: boolean; status?: string }) {
    if (!opp) return;
    const cur = gatesRef.current.find((x) => String(x.id) === gateId);
    if (!cur) return;
    const merged: Row = { ...cur, ...patch };
    // Optimistic write to both the ref (latest source) and state (render).
    gatesRef.current = gatesRef.current.map((x) =>
      String(x.id) === gateId ? merged : x
    );
    setGates(gatesRef.current);
    try {
      await api.update("b2g-compliance-gates", gateId, {
        opportunity_id: opp.id,
        label: String(merged.label),
        status: String(merged.status ?? ""),
        met: merged.met === true,
      });
    } catch (e) {
      setError((e as Error).message);
      loadSubs(); // reconcile back to server truth on failure
    }
  }

  async function addGate(label: string) {
    if (!opp || !label.trim()) return;
    if (gates.some((g) => String(g.label).toLowerCase() === label.trim().toLowerCase()))
      return; // avoid duplicates
    try {
      await api.create("b2g-compliance-gates", {
        opportunity_id: opp.id,
        label: label.trim(),
        status: "",
        met: false,
      });
      loadSubs();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function removeGate(g: Row) {
    try {
      await api.remove("b2g-compliance-gates", g.id as string);
      loadSubs();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  // Only a load failure (no opportunity) blocks the page; mutation errors show
  // as a dismissible banner so a single failed action doesn't nuke the view.
  if (!opp) return error ? <p className="error">{error}</p> : <p className="muted">Loading…</p>;

  const curIdx = CAPTURE_STAGES.indexOf(opp.capture_stage ?? "");
  const nextStage = curIdx >= 0 && curIdx < CAPTURE_STAGES.length - 1 ? CAPTURE_STAGES[curIdx + 1] : null;
  const gapCount = gates.filter((g) => g.met !== true).length;
  const missingStandard = STANDARD_GATES.filter(
    (s) => !gates.some((g) => String(g.label).toLowerCase() === s.toLowerCase())
  );

  return (
    <>
      <div className="page-head">
        <Link to="/b2g-opportunities" className="muted">
          ← B2G Opportunities
        </Link>
        <span className="spacer" />
        <DataLegend />
      </div>

      {error && (
        <div className="error" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ flex: 1 }}>{error}</span>
          <button className="btn" onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      {/* Classification header */}
      <div className="detail-header">
        <div style={{ display: "flex", alignItems: "flex-start", gap: 16 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="crumb">
              <span>Deals</span>
              <span>/</span>
              <span className="chip chip-fed">B2G · FEDERAL</span>
              {opp.clearance_level && (
                <span className="chip chip-secret">
                  <span className="material-symbols-rounded">lock</span>
                  {opp.clearance_level.toUpperCase()}
                </span>
              )}
            </div>
            <div className="detail-title">{opp.notice_id}</div>
            <div className="detail-sub">
              {[opp.agency_department, opp.focus_area_rr_role].filter(Boolean).join(" · ") || "—"}
            </div>
          </div>
          <div style={{ flex: "0 0 auto", textAlign: "right" }}>
            <div className="dtl-label">
              Est. ceiling value<Star note="No contract ceiling / IDIQ value field captured" />
            </div>
            <div className="value-lg tnum muted">—</div>
            <div className="detail-sub">
              Response due {opp.due_date ? opp.due_date.slice(0, 10) : "—"}
            </div>
          </div>
        </div>
        {/* Capture lifecycle stepper */}
        <div className="stepper" style={{ marginTop: 18 }}>
          {CAPTURE_STAGES.map((st, i) => (
            <button
              key={st}
              className={"step" + (i === curIdx ? " active" : "") + (curIdx >= 0 && i < curIdx ? " done" : "")}
              onClick={() => setStage(st)}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className="detail-cols">
        {/* Left column */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="icon-title" style={{ marginBottom: 0 }}>
                <span className="material-symbols-rounded">description</span>Acquisition details
              </div>
              {!editAcq && (
                <button className="btn" onClick={openAcqEditor}>
                  <span className="material-symbols-rounded" style={{ fontSize: 16, verticalAlign: "-3px", marginRight: 4 }}>edit</span>
                  Edit
                </button>
              )}
            </div>

            {editAcq ? (
              <>
                <div className="detail-grid" style={{ marginTop: 15 }}>
                  {ACQ_FIELDS.map((f) => (
                    <label key={f.name as string} className="acq-field">
                      <span className="dtl-label">{f.label}</span>
                      <input
                        value={acqForm[f.name as string] ?? ""}
                        onChange={(e) => setAcqForm({ ...acqForm, [f.name as string]: e.target.value })}
                      />
                    </label>
                  ))}
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                  <button className="btn btn-primary" onClick={saveAcq} disabled={savingAcq}>
                    {savingAcq ? "Saving…" : "Save"}
                  </button>
                  <button className="btn" onClick={() => setEditAcq(false)}>Cancel</button>
                </div>
              </>
            ) : (
              <div className="detail-grid" style={{ marginTop: 15 }}>
                <Detail label="Solicitation #" value={opp.solicitation_number} />
                <Detail label="NAICS" value={opp.naics} />
                <Detail label="Set-aside" value={opp.set_aside} />
                <Detail label="Clearance" value={opp.clearance_level} />
                <Detail label="Incumbent" value={opp.incumbent} />
                <Detail label="Focus area" value={opp.focus_area_rr_role} />
                <Detail label="Action officer" value={opp.action_officer} />
                <Detail
                  label="Fit score"
                  value={opp.fit_score_numeric ?? opp.fit_score_tier}
                />
                <Detail label="Status" value={opp.status} />
                <Detail label="Contract vehicle" star="No contract-vehicle field (e.g. OTA/GSA/IDIQ) yet" />
                <Detail label="Contract type" star="No contract-type field (e.g. CPFF/FFP) yet" />
                <Detail label="Color of money" star="No appropriation / color-of-money field yet" />
                <Detail label="Jurisdiction" star="Federal/State/Local jurisdiction not modeled yet" />
                <Detail label="Period of perf." star="No period-of-performance field yet" />
              </div>
            )}
          </div>

          <div className="panel">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div className="icon-title" style={{ marginBottom: 0 }}>
                <span className="material-symbols-rounded">verified_user</span>Compliance &amp; security gates
              </div>
              {gapCount > 0 && (
                <span className="chip" style={{ background: "var(--warn-soft)", color: "var(--warn)" }}>
                  {gapCount} gap{gapCount > 1 ? "s" : ""}
                </span>
              )}
            </div>
            <div className="gate-list" style={{ marginTop: 15 }}>
              {gates.map((g) => {
                const ok = g.met === true;
                return (
                  <div className={"gate2 " + (ok ? "ok" : "warn")} key={g.id as string}>
                    <span className="material-symbols-rounded g-ic">
                      {ok ? "check_circle" : "error"}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div className="g-title">{String(g.label)}</div>
                      <input
                        className="g-detail"
                        placeholder="Add detail (e.g. SECRET · on file)…"
                        defaultValue={String(g.status ?? "")}
                        onBlur={(e) => {
                          const v = e.target.value;
                          if (v !== String(g.status ?? "")) patchGate(String(g.id), { status: v });
                        }}
                      />
                    </div>
                    {/* Good / Gap toggle */}
                    <div className="gg-toggle">
                      <button
                        type="button"
                        className={"gg good" + (ok ? " on" : "")}
                        onClick={() => patchGate(String(g.id), { met: true })}
                        title="Requirement met"
                      >
                        Good
                      </button>
                      <button
                        type="button"
                        className={"gg gap" + (!ok ? " on" : "")}
                        onClick={() => patchGate(String(g.id), { met: false })}
                        title="Gap — not yet met"
                      >
                        Gap
                      </button>
                    </div>
                    <button
                      type="button"
                      className="icon-btn"
                      style={{ width: 28, height: 28 }}
                      title="Remove gate"
                      onClick={() => removeGate(g)}
                    >
                      <span className="material-symbols-rounded" style={{ fontSize: 16 }}>delete</span>
                    </button>
                  </div>
                );
              })}
              {gates.length === 0 && <p className="muted">No gates yet — add from the standard set below.</p>}
            </div>

            {/* Standard federal gate quick-add */}
            {missingStandard.length > 0 && (
              <div className="gate-templates">
                <span className="muted" style={{ fontSize: 12, fontWeight: 600 }}>Add standard:</span>
                {missingStandard.map((s) => (
                  <button key={s} className="tmpl-chip" onClick={() => addGate(s)}>
                    <span className="material-symbols-rounded" style={{ fontSize: 15 }}>add</span>
                    {s}
                  </button>
                ))}
              </div>
            )}
            {/* Custom gate */}
            <AddRow
              resource="b2g-compliance-gates"
              oppId={opp.id}
              fields={[{ name: "label", label: "Custom gate" }]}
              onAdded={loadSubs}
            />
          </div>

          <div className="panel">
            <div className="icon-title">
              <span className="material-symbols-rounded">diversity_3</span>Teaming &amp; partners
            </div>
            {teaming.map((t) => (
              <div className="team-row" key={t.id as string}>
                <span className={"tag" + (/prime/i.test(String(t.role)) ? " prime" : "")}>
                  {String(t.role || "SUB").toUpperCase()}
                </span>
                <span style={{ fontSize: 13.5, fontWeight: 600, flex: 1 }}>
                  {String(t.company_name)}
                </span>
                <span className="muted" style={{ fontSize: 12.5 }}>
                  {String(t.poc ?? "")}
                </span>
              </div>
            ))}
            {teaming.length === 0 && <p className="muted">No teaming partners yet.</p>}
            <div className="team-row" style={{ borderTop: "1px solid var(--border)" }}>
              <span className="material-symbols-rounded" style={{ fontSize: 18, color: "var(--text-3)" }}>military_tech</span>
              <span className="muted" style={{ fontSize: 12.5, flex: 1 }}>
                CPARS / past-performance ratings
                <Star note="No CPARS / past-performance rating field captured" />
              </span>
              <span className="muted">—</span>
            </div>
            <AddRow
              resource="b2g-teaming-partners"
              oppId={opp.id}
              fields={[
                { name: "company_name", label: "Company" },
                { name: "role", label: "Role (Prime/Sub)" },
              ]}
              onAdded={loadSubs}
            />
          </div>

          <div className="panel">
            <div className="icon-title">
              <span className="material-symbols-rounded">fact_check</span>Qualification (MEDDIC)
            </div>
            <div className="gate-grid">
              {MEDDIC_KEYS.map(([k, label]) => {
                const v = opp.meddic?.[k];
                return (
                  <div className={"gate " + (v ? "ok" : "")} key={k}>
                    <span className="material-symbols-rounded g-ic">
                      {v ? "check_circle" : "radio_button_unchecked"}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div className="g-title">{label}</div>
                      <div className="g-sub">{v || "Not captured"}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right rail */}
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="panel">
            <div className="icon-title">
              <span className="material-symbols-rounded">event</span>Key dates
            </div>
            <div className="timeline">
              <div className="tl-item">
                <div className="tl-rail">
                  <span className={"tl-dot" + (curIdx >= 0 ? " done" : "")} />
                  <span className="tl-line" />
                </div>
                <div style={{ paddingBottom: 14 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Capture stage</div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {opp.capture_stage ?? "—"}
                  </div>
                </div>
              </div>
              <div className="tl-item">
                <div className="tl-rail">
                  <span className="tl-dot now" />
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: "var(--accent-strong)" }}>
                    Response due
                  </div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {opp.due_date ? opp.due_date.slice(0, 10) : "—"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="icon-title">
              <span className="material-symbols-rounded">event</span>Acquisition milestones
              <Star note="No structured acquisition-milestone dates (RFI/Industry Day/Draft RFP/Award) modeled yet" />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              {[
                { label: "Sources Sought / RFI", state: "done" as const },
                { label: "Industry Day", state: "done" as const },
                { label: "Draft RFP / Q&A", state: "now" as const },
                { label: "Proposal due", state: "todo" as const },
                { label: "Award target", state: "todo" as const, last: true },
              ].map((m) => (
                <div className="ms-item" key={m.label}>
                  <div className="ms-rail">
                    <span className={"ms-dot" + (m.state === "done" ? " done" : m.state === "now" ? " now" : "")} />
                    {!m.last && <span className="ms-line" />}
                  </div>
                  <div style={{ paddingBottom: m.last ? 0 : 14 }}>
                    <div style={{ fontSize: 13, fontWeight: m.state === "now" ? 700 : 600, color: m.state === "now" ? "var(--accent-strong)" : m.state === "todo" ? "var(--text-2)" : "var(--text)" }}>
                      {m.label}
                    </div>
                    <div className="muted" style={{ fontSize: 12 }}>Date not tracked</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="panel">
            <div className="icon-title">
              <span className="material-symbols-rounded">account_balance</span>Government stakeholders
            </div>
            {stakeholders.map((s) => (
              <div className="stakeholder-row" key={s.id as string}>
                <span className="avatar-sm" style={{ background: avatarColor(String(s.name)) }}>
                  {initials(String(s.name))}
                </span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>{String(s.name)}</div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {[s.agency_role, s.disposition].filter(Boolean).join(" · ")}
                  </div>
                </div>
              </div>
            ))}
            {stakeholders.length === 0 && <p className="muted">No stakeholders yet.</p>}
            <AddRow
              resource="b2g-stakeholders"
              oppId={opp.id}
              fields={[
                { name: "name", label: "Name" },
                { name: "agency_role", label: "Role" },
              ]}
              onAdded={loadSubs}
            />
          </div>

          {nextStage && (
            <button className="big-btn" onClick={() => setStage(nextStage)}>
              <span className="material-symbols-rounded">rocket_launch</span>
              Advance to {nextStage}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
