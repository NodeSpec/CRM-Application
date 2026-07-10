import { useAuth } from "../auth/AuthContext";

/**
 * Admin settings (REQ-002, REQ-011, REQ-018). User/role management, submission
 * category management and the audit-log viewer live here. Rendered only for
 * Admins; Members are shown an access notice (defence-in-depth alongside the
 * role-aware nav and the API's server-side RBAC).
 */
export function AdminPage() {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return (
      <section>
        <h1>Admin</h1>
        <p className="muted">You do not have access to admin settings.</p>
      </section>
    );
  }

  return (
    <section>
      <h1>Admin</h1>
      <ul>
        <li>User &amp; role management (REQ-002)</li>
        <li>Submission category management (REQ-011)</li>
        <li>Audit log viewer (REQ-018)</li>
      </ul>
      <p className="muted">
        {/* TODO(scaffold): build the admin panels against the API. */}
        Scaffold — admin panels to be implemented.
      </p>
    </section>
  );
}
