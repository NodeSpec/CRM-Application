import { useCallback, useEffect, useState } from "react";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { AdminNav } from "../../components/AdminNav";
import { NotAllowed } from "../AdminPage";

/** Custom field definitions per module (REQ-023). Admin-only. */
interface Def {
  id: string;
  module: string;
  key: string;
  label: string;
  type: string;
  options: string[];
  is_active: boolean;
}

const MODULES = [
  "b2b_leads",
  "b2g_opportunities",
  "events",
  "submissions",
  "publicity_contacts",
  "companies",
  "contacts",
];

export function CustomFieldsAdmin() {
  const { isAdmin } = useAuth();
  const [rows, setRows] = useState<Def[]>([]);
  const [form, setForm] = useState({
    module: "companies",
    key: "",
    label: "",
    type: "text",
    options: "",
  });
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    api
      .list<Def>("custom-field-defs")
      .then(setRows)
      .catch((e) => setError((e as Error).message));
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  if (!isAdmin) return <NotAllowed />;

  async function add() {
    if (!form.key.trim() || !form.label.trim()) return;
    try {
      const body: Record<string, unknown> = {
        module: form.module,
        key: form.key.trim(),
        label: form.label.trim(),
        type: form.type,
      };
      if (form.type === "select" && form.options.trim())
        body.options = form.options
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
      await api.create("custom-field-defs", body);
      setForm({ ...form, key: "", label: "", options: "" });
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function toggle(d: Def) {
    try {
      await api.update("custom-field-defs", d.id, {
        module: d.module,
        key: d.key,
        label: d.label,
        type: d.type,
        options: d.options,
        is_active: !d.is_active,
      });
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <>
      <AdminNav />
      {error && <p className="error">{error}</p>}
      <div className="filter-bar">
        <label className="filter-field">
          <span>Module</span>
          <select
            value={form.module}
            onChange={(e) => setForm({ ...form, module: e.target.value })}
          >
            {MODULES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label className="filter-field">
          <span>Key</span>
          <input
            value={form.key}
            placeholder="e.g. tier"
            onChange={(e) => setForm({ ...form, key: e.target.value })}
          />
        </label>
        <label className="filter-field">
          <span>Label</span>
          <input
            value={form.label}
            placeholder="e.g. Account Tier"
            onChange={(e) => setForm({ ...form, label: e.target.value })}
          />
        </label>
        <label className="filter-field">
          <span>Type</span>
          <select
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          >
            <option value="text">text</option>
            <option value="number">number</option>
            <option value="date">date</option>
            <option value="select">select</option>
          </select>
        </label>
        {form.type === "select" && (
          <label className="filter-field">
            <span>Options (comma-sep)</span>
            <input
              value={form.options}
              placeholder="Gold, Silver, Bronze"
              onChange={(e) => setForm({ ...form, options: e.target.value })}
            />
          </label>
        )}
        <div className="filter-actions">
          <button className="btn btn-primary" onClick={add}>
            Add field
          </button>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Module</th>
              <th>Key</th>
              <th>Label</th>
              <th>Type</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="muted">
                  No custom fields defined.
                </td>
              </tr>
            ) : (
              rows.map((d) => (
                <tr key={d.id} className={d.is_active ? "" : "row-muted"}>
                  <td data-label="Module">{d.module}</td>
                  <td data-label="Key">{d.key}</td>
                  <td data-label="Label">{d.label}</td>
                  <td data-label="Type">{d.type}</td>
                  <td data-label="Status">
                    <span className={"badge " + (d.is_active ? "badge-pos" : "")}>
                      {d.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td>
                    <button className="btn" onClick={() => toggle(d)}>
                      {d.is_active ? "Deactivate" : "Activate"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
