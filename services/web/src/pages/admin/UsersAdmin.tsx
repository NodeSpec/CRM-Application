import { useCallback, useEffect, useState } from "react";
import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { AdminNav } from "../../components/AdminNav";
import { NotAllowed } from "../AdminPage";

/** User & role management (REQ-002). Admin changes a user's role via a dropdown;
 *  it takes effect on that user's next request (per-request role re-read). */
interface AppUser {
  id: string;
  email: string;
  display_name: string;
  role: "admin" | "member";
  is_active: boolean;
}

export function UsersAdmin() {
  const { isAdmin } = useAuth();
  const [rows, setRows] = useState<AppUser[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setRows(await api.list<AppUser>("users"));
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (!isAdmin) return <NotAllowed />;

  async function changeRole(u: AppUser, role: "admin" | "member") {
    setSavingId(u.id);
    setError(null);
    try {
      await api.patch("users", u.id, { role });
      await load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSavingId(null);
    }
  }

  return (
    <>
      <AdminNav />
      {error && <p className="error">{error}</p>}
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={3} className="muted">
                  No users yet — users appear here after their first login.
                </td>
              </tr>
            ) : (
              rows.map((u) => (
                <tr key={u.id}>
                  <td>{u.display_name || "—"}</td>
                  <td>{u.email}</td>
                  <td>
                    <select
                      value={u.role}
                      disabled={savingId === u.id}
                      onChange={(e) =>
                        changeRole(u, e.target.value as "admin" | "member")
                      }
                    >
                      <option value="member">member</option>
                      <option value="admin">admin</option>
                    </select>
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
