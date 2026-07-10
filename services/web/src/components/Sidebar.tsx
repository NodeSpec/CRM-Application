import { NavLink } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";

/** Sidebar navigation (1A shell). Nav maps to our real modules; the Admin
 *  entry only appears for Admins (REQ-002 role-aware UI). */
interface NavItem {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
  admin?: boolean;
}

const NAV: NavItem[] = [
  { to: "/", label: "Dashboard", icon: "space_dashboard", end: true },
  { to: "/b2b-leads", label: "B2B Leads", icon: "groups" },
  { to: "/b2g-opportunities", label: "B2G Opportunities", icon: "handshake" },
  { to: "/events", label: "Events", icon: "event" },
  { to: "/submissions", label: "Submissions", icon: "description" },
  { to: "/publicity-contacts", label: "Publicity", icon: "campaign" },
  { to: "/admin", label: "Admin", icon: "admin_panel_settings", admin: true },
];

function initials(name: string, email: string): string {
  const src = name?.trim() || email || "?";
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

export function Sidebar() {
  const { user, isAdmin, logout } = useAuth();

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="brand-mark material-symbols-rounded">graph_2</span>
        <span className="brand-name">CRM Platform</span>
      </div>

      <nav className="sidebar-nav">
        {NAV.filter((n) => !n.admin || isAdmin).map((n) => (
          <NavLink
            key={n.to}
            to={n.to}
            end={n.end}
            className={({ isActive }) =>
              "nav-item" + (isActive ? " active" : "")
            }
          >
            <span className="material-symbols-rounded">{n.icon}</span>
            {n.label}
          </NavLink>
        ))}
      </nav>

      {user && (
        <div className="sidebar-user">
          <span className="avatar">{initials(user.displayName, user.email)}</span>
          <div className="sidebar-user-meta">
            <div className="su-name" title={user.displayName || user.email}>
              {user.displayName || user.email}
            </div>
            <div className="su-role">{user.role}</div>
          </div>
          <button
            className="icon-btn"
            title="Log out"
            onClick={() => void logout()}
          >
            <span className="material-symbols-rounded">logout</span>
          </button>
        </div>
      )}
    </aside>
  );
}
