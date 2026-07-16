import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useParams, Link } from "react-router-dom";
import { api } from "../api/client";

/**
 * B2G Federal Capture view (REQ-022): capture lifecycle stepper, acquisition
 * details, MEDDIC qualification, and teaming / stakeholders / compliance gates.
 */
const CAPTURE_STAGES = [
  "Identify",
  "Qualify",
  "Pursue",
  "Capture",
  "Proposal",
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

interface Opp {
  id: string;
  notice_id: string;
  agency_department?: string;
  due_date?: string;
  status?: string;
  naics?: string;
  set_aside?: string;
  incumbent?: string;
  solicitation_number?: string;
  clearance_level?: string;
  capture_stage?: string;
  meddic?: Record<string, string>;
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <div className="kpi-label">{label}</div>
      <div style={{ fontWeight: 600 }}>{value || "—"}</div>
    </div>
  );
}

/** Small list of a sub-resource with an inline add row. */
function SubList({
  title,
  resource,
  oppId,
  fields,
  render,
}: {
  title: string;
  resource: string;
  oppId: string;
  fields: { name: string; label: string }[];
  render: (row: Record<string, unknown>) => string;
}) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [form, setForm] = useState<Record<string, string>>({});
  const load = useCallback(() => {
    api
      .list<Record<string, unknown>>(resource, { opportunity_id: oppId })
      .then(setRows)
      .catch(() => {});
  }, [resource, oppId]);
  useEffect(() => {
    load();
  }, [load]);

  async function add(e: FormEvent) {
    e.preventDefault();
    try {
      await api.create(resource, { opportunity_id: oppId, ...form });
      setForm({});
      load();
    } catch {
      /* ignore */
    }
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <div className="panel-title">{title}</div>
      </div>
      {rows.length ? (
        rows.map((r) => (
          <div className="feed-row" key={r.id as string}>
            {render(r)}
          </div>
        ))
      ) : (
        <p className="muted">None yet.</p>
      )}
      <form onSubmit={add} style={{ display: "flex", gap: 6, marginTop: 8 }}>
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
    </div>
  );
}

export function B2GCaptureView() {
  const { id } = useParams();
  const [opp, setOpp] = useState<Opp | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    if (!id) return;
    api
      .get<Opp>("b2g-opportunities", id)
      .then(setOpp)
      .catch((e) => setError((e as Error).message));
  }, [id]);
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

  const currentIdx = CAPTURE_STAGES.indexOf(opp.capture_stage ?? "");

  return (
    <>
      <div className="page-head">
        <Link to="/b2g-opportunities" className="muted">
          ← B2G Opportunities
        </Link>
      </div>

      <div className="panel">
        <h1 style={{ margin: 0 }}>{opp.notice_id}</h1>
        <div className="muted">
          {[opp.agency_department, opp.status].filter(Boolean).join(" · ")}
          {opp.due_date ? ` · Due ${opp.due_date.slice(0, 10)}` : ""}
        </div>
        {/* Capture lifecycle stepper */}
        <div className="stepper">
          {CAPTURE_STAGES.map((st, i) => (
            <button
              key={st}
              className={
                "step" +
                (i === currentIdx ? " active" : "") +
                (currentIdx >= 0 && i < currentIdx ? " done" : "")
              }
              onClick={() => setStage(st)}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-head">
            <div className="panel-title">Acquisition details</div>
          </div>
          <div className="form-grid">
            <Field label="NAICS" value={opp.naics} />
            <Field label="Set-Aside" value={opp.set_aside} />
            <Field label="Incumbent" value={opp.incumbent} />
            <Field label="Solicitation #" value={opp.solicitation_number} />
            <Field label="Clearance" value={opp.clearance_level} />
          </div>
        </div>
        <div className="panel">
          <div className="panel-head">
            <div className="panel-title">MEDDIC qualification</div>
          </div>
          <div className="form-grid">
            {MEDDIC_KEYS.map(([k, label]) => (
              <Field key={k} label={label} value={opp.meddic?.[k]} />
            ))}
          </div>
        </div>
      </div>

      <div className="grid-2">
        <SubList
          title="Teaming partners"
          resource="b2g-teaming-partners"
          oppId={opp.id}
          fields={[
            { name: "company_name", label: "Company" },
            { name: "role", label: "Role" },
          ]}
          render={(r) =>
            `${r.company_name}${r.role ? ` — ${r.role}` : ""}`
          }
        />
        <SubList
          title="Government stakeholders"
          resource="b2g-stakeholders"
          oppId={opp.id}
          fields={[
            { name: "name", label: "Name" },
            { name: "agency_role", label: "Role" },
          ]}
          render={(r) =>
            `${r.name}${r.agency_role ? ` — ${r.agency_role}` : ""}`
          }
        />
      </div>

      <SubList
        title="Compliance & security gates"
        resource="b2g-compliance-gates"
        oppId={opp.id}
        fields={[
          { name: "label", label: "Gate" },
          { name: "status", label: "Status" },
        ]}
        render={(r) => `${r.label} — ${r.status ?? "pending"}`}
      />
    </>
  );
}
