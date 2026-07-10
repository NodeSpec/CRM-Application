import { useEffect, useState, type FormEvent } from "react";
import { api, ApiError } from "../api/client";
import type { Column, Field, ModuleConfig } from "../modules";

/**
 * Generic module screen. Fetches the module's records and renders them in a
 * table using its column config; when the module defines create fields, a
 * simple form lets you add a record and see it appear (end-to-end write path).
 */
function renderCell(row: Record<string, unknown>, col: Column) {
  const v = row[col.key];
  if (v == null || v === "") return <span className="muted">—</span>;
  if (col.type === "date") return String(v).slice(0, 10);
  if (col.type === "link")
    return (
      <a href={String(v)} target="_blank" rel="noreferrer noopener">
        link
      </a>
    );
  if (col.type === "bool") return v ? "Yes" : "No";
  return String(v);
}

function buildPayload(fields: Field[], form: Record<string, string>) {
  const payload: Record<string, unknown> = {};
  for (const f of fields) {
    const raw = form[f.name];
    if (raw == null || raw === "") continue;
    payload[f.name] = f.type === "number" ? Number(raw) : raw;
  }
  return payload;
}

export function ResourcePage({ config }: { config: ModuleConfig }) {
  const { title, resource, description, columns, fields } = config;
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      setRows(await api.list<Record<string, unknown>>(resource));
    } catch (e) {
      setError(
        e instanceof ApiError && e.status === 401
          ? "Please log in to view this module."
          : `Failed to load: ${(e as Error).message}`
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    setForm({});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resource]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!fields) return;
    setSaving(true);
    setError(null);
    try {
      await api.create(resource, buildPayload(fields, form));
      setForm({});
      await load();
    } catch (e) {
      setError(`Failed to save: ${(e as Error).message}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <h1>{title}</h1>
      <p className="muted">{description}</p>

      {fields && (
        <form className="create-form" onSubmit={onSubmit}>
          <h3>Add new</h3>
          <div className="form-grid">
            {fields.map((f) => (
              <label key={f.name}>
                <span>
                  {f.label}
                  {f.required ? " *" : ""}
                </span>
                {f.type === "textarea" ? (
                  <textarea
                    value={form[f.name] ?? ""}
                    required={f.required}
                    onChange={(e) =>
                      setForm({ ...form, [f.name]: e.target.value })
                    }
                  />
                ) : (
                  <input
                    type={f.type ?? "text"}
                    value={form[f.name] ?? ""}
                    required={f.required}
                    onChange={(e) =>
                      setForm({ ...form, [f.name]: e.target.value })
                    }
                  />
                )}
              </label>
            ))}
          </div>
          <button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Create"}
          </button>
        </form>
      )}

      {error && <p className="error">{error}</p>}

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
                No records yet.
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr key={(row.id as string) ?? i}>
                {columns.map((c) => (
                  <td key={c.key}>{renderCell(row, c)}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </section>
  );
}
