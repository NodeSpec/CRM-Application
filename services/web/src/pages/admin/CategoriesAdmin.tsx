import { useCallback, useEffect, useState } from "react";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { AdminNav } from "../../components/AdminNav";
import { NotAllowed } from "../AdminPage";

/** Submission category management (REQ-011): add, rename, activate/deactivate. */
interface Category {
  id: string;
  label: string;
  is_active: boolean;
}

export function CategoriesAdmin() {
  const { isAdmin } = useAuth();
  const [rows, setRows] = useState<Category[]>([]);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [newLabel, setNewLabel] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setRows(await api.list<Category>("submission-categories"));
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (!isAdmin) return <NotAllowed />;

  async function add() {
    if (!newLabel.trim()) return;
    try {
      await api.create("submission-categories", { label: newLabel.trim() });
      setNewLabel("");
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function rename(c: Category) {
    const label = edits[c.id]?.trim();
    if (!label || label === c.label) return;
    try {
      await api.update("submission-categories", c.id, { label, is_active: c.is_active });
      await load();
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function toggle(c: Category) {
    try {
      await api.update("submission-categories", c.id, {
        label: c.label,
        is_active: !c.is_active,
      });
      await load();
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
          <span>New category</span>
          <input
            value={newLabel}
            placeholder="e.g. Fellowship"
            onChange={(e) => setNewLabel(e.target.value)}
          />
        </label>
        <div className="filter-actions">
          <button className="btn btn-primary" onClick={add}>
            Add category
          </button>
        </div>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Label</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => (
              <tr key={c.id} className={c.is_active ? "" : "row-muted"}>
                <td>
                  <input
                    value={edits[c.id] ?? c.label}
                    onChange={(e) =>
                      setEdits({ ...edits, [c.id]: e.target.value })
                    }
                    onBlur={() => rename(c)}
                  />
                </td>
                <td>
                  <span className={"badge " + (c.is_active ? "badge-pos" : "")}>
                    {c.is_active ? "Active" : "Inactive"}
                  </span>
                </td>
                <td>
                  <button className="btn" onClick={() => toggle(c)}>
                    {c.is_active ? "Deactivate" : "Activate"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
