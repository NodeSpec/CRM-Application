import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

/**
 * Primary navigation. Role-aware (REQ-002): the Admin link is only rendered
 * for Admins. Login/logout reflects auth state (REQ-001).
 */
const LINKS = [
  { to: "/", label: "Dashboard", end: true },
  { to: "/b2b-leads", label: "B2B Leads" },
  { to: "/b2g-opportunities", label: "B2G Opportunities" },
  { to: "/events", label: "Events" },
  { to: "/submissions", label: "Submissions" },
  { to: "/publicity-contacts", label: "Publicity" },
];

export function Nav() {
  const { user, isAdmin, login, logout } = useAuth();

  return (
    <nav className="nav">
      <div className="nav-brand">CRM Platform</div>
      <ul className="nav-links">
        {LINKS.map((l) => (
          <li key={l.to}>
            <NavLink to={l.to} end={l.end}>
              {l.label}
            </NavLink>
          </li>
        ))}
        {isAdmin && (
          <li>
            <NavLink to="/admin">Admin</NavLink>
          </li>
        )}
      </ul>
      <div className="nav-auth">
        {user ? (
          <>
            <span className="muted">
              {user.displayName || user.email} ({user.role})
            </span>
            <button onClick={logout}>Log out</button>
          </>
        ) : (
          <button onClick={login}>Log in</button>
        )}
      </div>
    </nav>
  );
}
