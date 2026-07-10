import { NavLink } from "react-router-dom";

/** Sub-navigation for the admin section (REQ-002/011/018). */
export function AdminNav() {
  const cls = ({ isActive }: { isActive: boolean }) => (isActive ? "active" : "");
  return (
    <nav className="admin-nav">
      <NavLink to="/admin" end className={cls}>
        Overview
      </NavLink>
      <NavLink to="/admin/categories" className={cls}>
        Submission Categories
      </NavLink>
      <NavLink to="/admin/users" className={cls}>
        Users &amp; Roles
      </NavLink>
      <NavLink to="/admin/audit" className={cls}>
        Audit Log
      </NavLink>
    </nav>
  );
}
