import { useCallback, useEffect, useState, type FormEvent } from "react";
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
const gateOk = (status: unknown) =>
  /complete|done|pass|approved|on file|current|ok|verified/i.test(String(status ?? ""));

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

export function B2GCaptureView() {
  const { id } = useParams();
  const [opp, setOpp] = useState<Opp | null>(null);
  const [teaming, setTeaming] = useState<Row[]>([]);
  const [stakeholders, setStakeholders] = useState<Row[]>([]);
  const [gates, setGates] = useState<Row[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadSubs = useCallback(() => {
    if (!id) return;
    api.list<Row>("b2g-teaming-partners", { opportunity_id: id }).then(setTeaming).catch(() => {});
    api.list<Row>("b2g-stakeholders", { opportunity_id: id }).then(setStakeholders).catch(() => {});
    api.list<Row>("b2g-compliance-gates", { opportunity_id: id }).then(setGates).catch(() => {});
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

  if (error) return <p className="error">{error}</p>;
  if (!opp) return <p className="muted">Loading…</p>;

  const curIdx = CAPTURE_STAGES.indexOf(opp.capture_stage ?? "");
  const nextStage = curIdx >= 0 && curIdx < CAPTURE_STAGES.length - 1 ? CAPTURE_STAGES[curIdx + 1] : null;
  const gapCount = gates.filter((g) => !gateOk(g.status)).length;

  return (
    <>
      <div className="page-head">
        <Link to="/b2g-opportunities" className="muted">
          ← B2G Opportunities
        </Link>
        <span className="spacer" />
        <DataLegend />
      </div>

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
            <div className="icon-title">
              <span className="material-symbols-rounded">description</span>Acquisition details
            </div>
            <div className="detail-grid">
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
            <div className="gate-grid" style={{ marginTop: 15 }}>
              {gates.map((g) => {
                const ok = gateOk(g.status);
                return (
                  <div className={"gate " + (ok ? "ok" : "warn")} key={g.id as string}>
                    <span className="material-symbols-rounded g-ic">
                      {ok ? "check_circle" : "error"}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div className="g-title">{String(g.label)}</div>
                      <div className="g-sub">{String(g.status ?? "")}</div>
                    </div>
                  </div>
                );
              })}
              {gates.length === 0 && <p className="muted">No gates yet.</p>}
            </div>
            <AddRow
              resource="b2g-compliance-gates"
              oppId={opp.id}
              fields={[
                { name: "label", label: "Gate" },
                { name: "status", label: "Status" },
              ]}
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
