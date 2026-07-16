import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { api, ApiError } from "../api/client";
import type { Column, Field, ModuleConfig, OptionSource } from "../modules";
import { useMeta, type Meta } from "../lib/useMeta";
import { FilterBar } from "../components/FilterBar";
import { rowsToCsv, downloadCsv } from "../lib/csv";
import {
  b2gDueBadge,
  submissionDeadlineBadge,
  submissionStatusBadge,
  type BadgeInfo,
} from "../lib/badges";

const today = () => new Date().toISOString().slice(0, 10);
function addDays(iso: string, n: number): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function fieldOptions(source: OptionSource | undefined, meta: Meta | null) {
  if (!meta || !source) return [] as { value: string; label: string }[];
  if (source === "lead_statuses")
    return meta.lead_statuses.map((s) => ({ value: s.label, label: s.label }));
  if (source === "submission_categories")
    return meta.submission_categories.map((c) => ({ value: c.id, label: c.label }));
  if (source === "contact_lifecycle_stages")
    return meta.contact_lifecycle_stages.map((s) => ({ value: s, label: s }));
  if (source === "owners")
    return meta.owners.map((o) => ({
      value: o.id,
      label: o.display_name || o.email,
    }));
  return meta.publicity_formats.map((f) => ({ value: f, label: f }));
}

function Badge({ info }: { info: BadgeInfo }) {
  return (
    <span className={`badge badge-${info.kind}`}>
      {info.icon && <span className="material-symbols-rounded">{info.icon}</span>}
      {info.text}
    </span>
  );
}

export function ResourcePage({ config }: { config: ModuleConfig }) {
  const { resource, description, columns, fields } = config;
  const meta = useMeta();
  const [searchParams] = useSearchParams();
  const searchKey = searchParams.toString();

  const [filters, setFilters] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const b2gDays = meta?.thresholds.b2g_due_date_threshold_days ?? 14;
  const subDays = meta?.thresholds.submission_deadline_threshold_days ?? 14;

  // Re-initialize filters from the URL whenever the route or its query changes
  // (so dashboard KPI deep-links land pre-filtered). Waits for meta thresholds.
  useEffect(() => {
    setReady(false);
    setShowForm(false);
    setForm({});
  }, [resource, searchKey]);

  useEffect(() => {
    if (ready || !meta) return;
    const init: Record<string, string> = {};
    searchParams.forEach((v, k) => {
      if (k !== "due" && k !== "when") init[k] = v;
    });
    const due = searchParams.get("due");
    const when = searchParams.get("when");
    const t = today();
    if (resource === "events" && when === "upcoming") init.event_date_from = t;
    if (resource === "submissions" && due === "soon")
      init.deadline_to = addDays(t, subDays);
    if (resource === "b2b-leads" && due === "overdue") init.reminder_date_to = t;
    if (resource === "b2g-opportunities" && due === "soon")
      init.due_date_to = addDays(t, b2gDays);
    setFilters(init);
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta, ready, resource, searchKey]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params: Record<string, string> = {};
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== "") params[k] = v;
      });
      setRows(await api.list<Record<string, unknown>>(resource, params));
    } catch (e) {
      setError(
        e instanceof ApiError && e.status === 401
          ? "Please log in to view this module."
          : `Failed to load: ${(e as Error).message}`
      );
    } finally {
      setLoading(false);
    }
  }, [resource, filters]);

  useEffect(() => {
    if (ready) void load();
  }, [ready, load]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!fields) return;
    setSaving(true);
    setError(null);
    try {
      const payload: Record<string, unknown> = {};
      for (const f of fields) {
        const raw = form[f.name];
        if (raw == null || raw === "") continue;
        payload[f.name] = f.type === "number" ? Number(raw) : raw;
      }
      await api.create(resource, payload);
      setForm({});
      setShowForm(false);
      await load();
    } catch (e) {
      setError(`Failed to save: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  }

  function renderCell(row: Record<string, unknown>, col: Column) {
    if (col.badge === "submission_status") {
      const info = submissionStatusBadge(row.submission_date);
      return <Badge info={info} />;
    }
    const v = row[col.key];
    const base =
      v == null || v === "" ? (
        <span className="muted">—</span>
      ) : col.type === "date" ? (
        String(v).slice(0, 10)
      ) : col.type === "link" ? (
        <a href={String(v)} target="_blank" rel="noreferrer noopener">
          link
        </a>
      ) : col.type === "bool" ? (
        v ? "Yes" : "No"
      ) : (
        String(v)
      );

    let badge: BadgeInfo | null = null;
    if (col.badge === "b2g_due")
      badge = b2gDueBadge(row.due_date, row.status, b2gDays);
    else if (col.badge === "submission_deadline")
      badge = submissionDeadlineBadge(row.deadline, row.submission_date, subDays);

    if (!badge) return base;
    return (
      <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
        {base}
        <Badge info={badge} />
      </span>
    );
  }

  function onExport() {
    downloadCsv(`${resource}.csv`, rowsToCsv(rows, columns));
  }

  return (
    <>
      <div className="page-head">
        <span className="page-desc">{description}</span>
        <span className="spacer" />
        <span className="muted" style={{ fontSize: 13 }}>
          {rows.length} shown
        </span>
        {fields && (
          <button
            className="btn btn-primary"
            onClick={() => setShowForm((v) => !v)}
          >
            <span
              className="material-symbols-rounded"
              style={{ fontSize: 16, verticalAlign: "-3px", marginRight: 4 }}
            >
              add
            </span>
            New
          </button>
        )}
      </div>

      <FilterBar
        config={config}
        meta={meta}
        values={filters}
        onChange={setFilters}
        onExport={onExport}
      />

      {showForm && fields && (
        <form className="create-form" onSubmit={onSubmit}>
          <h3>Add new</h3>
          <div className="form-grid">
            {fields.map((f: Field) => (
              <label key={f.name}>
                <span>
                  {f.label}
                  {f.required ? " *" : ""}
                </span>
                {f.type === "select" ? (
                  <select
                    value={form[f.name] ?? ""}
                    required={f.required}
                    onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                  >
                    <option value="">Select…</option>
                    {fieldOptions(f.optionsFrom, meta).map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                ) : f.type === "textarea" ? (
                  <textarea
                    value={form[f.name] ?? ""}
                    required={f.required}
                    onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                  />
                ) : (
                  <input
                    type={f.type ?? "text"}
                    value={form[f.name] ?? ""}
                    required={f.required}
                    onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                  />
                )}
              </label>
            ))}
          </div>
          <button className="btn btn-primary" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Create"}
          </button>
        </form>
      )}

      {error && <p className="error">{error}</p>}

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key}>{c.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="muted">
                  Loading…
                </td>
              </tr>
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="muted">
                  No records match.
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr key={(row.id as string) ?? i}>
                  {columns.map((c, ci) => (
                    <td key={c.key}>
                      {ci === 0 && config.detailPath && row.id ? (
                        <Link to={`${config.detailPath}/${row.id}`}>
                          {renderCell(row, c)}
                        </Link>
                      ) : (
                        renderCell(row, c)
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
