import { useCallback, useEffect, useState } from "react";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { AdminNav } from "../../components/AdminNav";
import { NotAllowed } from "../AdminPage";

/** Audit log viewer (REQ-018). Admin-only; filter by module, action, date range. */
interface AuditRow {
  id: string;
  actor_name: string;
  action: "create" | "update" | "delete";
  module: string;
  record_id: string | null;
  before_data: Record<string, unknown> | null;
  after_data: Record<string, unknown> | null;
  created_at: string;
}

const MODULES = [
  "b2b_leads",
  "b2g_opportunities",
  "events",
  "submissions",
  "submission_categories",
  "publicity_contacts",
  "users",
];

function changedFields(r: AuditRow): string {
  if (r.action === "delete") return "—";
  if (r.action === "create") return Object.keys(r.after_data ?? {}).join(", ");
  const before = r.before_data ?? {};
  const after = r.after_data ?? {};
  const keys = Object.keys(after).filter(
    (k) => JSON.stringify(after[k]) !== JSON.stringify(before[k])
  );
  return keys.join(", ") || "—";
}

export function AuditAdmin() {
  const { isAdmin } = useAuth();
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const params: Record<string, string> = {};
      Object.entries(filters).forEach(([k, v]) => v && (params[k] = v));
      setRows(await api.list<AuditRow>("audit", params));
    } catch (e) {
      setError((e as Error).message);
    }
  }, [filters]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!isAdmin) return <NotAllowed />;

  const set = (k: string, v: string) =>
    setFilters((f) => {
      const n = { ...f };
      if (v) n[k] = v;
      else delete n[k];
      return n;
    });

  return (
    <>
      <AdminNav />
      {error && <p className="error">{error}</p>}
      <div className="filter-bar">
        <label className="filter-field">
          <span>Module</span>
          <select value={filters.module ?? ""} onChange={(e) => set("module", e.target.value)}>
            <option value="">All</option>
            {MODULES.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>
        <label className="filter-field">
          <span>Action</span>
          <select value={filters.action ?? ""} onChange={(e) => set("action", e.target.value)}>
            <option value="">All</option>
            <option value="create">create</option>
            <option value="update">update</option>
            <option value="delete">delete</option>
          </select>
        </label>
        <label className="filter-field">
          <span>From</span>
          <input type="date" value={filters.from ?? ""} onChange={(e) => set("from", e.target.value)} />
        </label>
        <label className="filter-field">
          <span>To</span>
          <input type="date" value={filters.to ?? ""} onChange={(e) => set("to", e.target.value)} />
        </label>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>When</th>
              <th>Actor</th>
              <th>Action</th>
              <th>Module</th>
              <th>Record</th>
              <th>Changed fields</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} className="muted">
                  No audit entries match.
                </td>
              </tr>
            ) : (
              rows.map((r) => (
                <tr key={r.id}>
                  <td>{new Date(r.created_at).toLocaleString()}</td>
                  <td>{r.actor_name}</td>
                  <td>
                    <span
                      className={
                        "badge " +
                        (r.action === "delete"
                          ? "badge-neg"
                          : r.action === "create"
                            ? "badge-pos"
                            : "badge-warn")
                      }
                    >
                      {r.action}
                    </span>
                  </td>
                  <td>{r.module}</td>
                  <td className="muted" style={{ fontSize: 12 }}>
                    {r.record_id ? r.record_id.slice(0, 8) : "—"}
                  </td>
                  <td className="muted">{changedFields(r)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}
