import { useAuth } from "../auth/AuthContext";
import { AdminNav } from "../components/AdminNav";

/** Admin landing (REQ-002/011/018). Gated on the Admin role. */
export function AdminPage() {
  const { isAdmin } = useAuth();
  if (!isAdmin) return <NotAllowed />;
  return (
    <>
      <AdminNav />
      <div className="panel">
        <p className="muted">
          Manage the pieces that keep records consistent and auditable:
        </p>
        <ul>
          <li>
            <strong>Submission Categories</strong> — add, rename, or deactivate
            the categories used by submissions (REQ-011).
          </li>
          <li>
            <strong>Users &amp; Roles</strong> — assign Admin/Member; changes take
            effect on the user's next request (REQ-002).
          </li>
          <li>
            <strong>Audit Log</strong> — immutable record of every create/update/
            delete, filterable by module, actor, action and date (REQ-018).
          </li>
        </ul>
      </div>
    </>
  );
}

export function NotAllowed() {
  return (
    <section>
      <h2>Admin</h2>
      <p className="muted">You do not have access to admin settings.</p>
    </section>
  );
}
