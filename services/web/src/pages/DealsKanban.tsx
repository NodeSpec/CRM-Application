import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../api/client";
import { useMeta } from "../lib/useMeta";

/** Deal pipeline board (REQ-021): B2B leads grouped by their status stage,
 *  each card showing the deal amount; a select moves a deal between stages. */
interface Lead {
  id: string;
  company_name: string;
  amount?: number | null;
  status: string;
}

function money(n?: number | null) {
  return n == null ? "" : "$" + Number(n).toLocaleString();
}

export function DealsKanban() {
  const meta = useMeta();
  const [leads, setLeads] = useState<Lead[]>([]);
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
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const stages = meta?.lead_statuses ?? [];

  async function move(l: Lead, status: string) {
    try {
      await api.update("b2b-leads", l.id, { company_name: l.company_name, status });
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  return (
    <>
      <div className="page-head">
        <span className="page-desc">Deal pipeline by stage (REQ-021).</span>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="kanban">
        {stages.map((s) => {
          const col = leads.filter((l) => l.status === s.label);
          const total = col.reduce((a, l) => a + (Number(l.amount) || 0), 0);
          return (
            <div className="kanban-col" key={s.label}>
              <div className="kanban-col-head">
                <span>{s.label}</span>
                <span className="muted tnum">
                  {col.length} · {money(total)}
                </span>
              </div>
              {col.map((l) => (
                <div className="kanban-card" key={l.id}>
                  <div className="kanban-card-title">{l.company_name}</div>
                  <div className="tnum kanban-card-amt">{money(l.amount) || "—"}</div>
                  <select value={l.status} onChange={(e) => move(l, e.target.value)}>
                    {stages.map((st) => (
                      <option key={st.label} value={st.label}>
                        {st.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
              {col.length === 0 && (
                <div className="muted" style={{ fontSize: 12, padding: "6px 2px" }}>
                  —
                </div>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}
