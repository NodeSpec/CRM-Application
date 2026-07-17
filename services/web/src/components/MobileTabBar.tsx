import { NavLink } from "react-router-dom";

/**
 * Mobile bottom tab bar (REQ-025) — reproduces the design's mobile variants
 * (1C/2B/3C/4B): a fixed bottom nav with the primary destinations. Hidden on
 * desktop; shown under the 860px breakpoint (see styles.css .mobile-tabbar),
 * where the desktop sidebar is hidden.
 */
interface Tab {
  to: string;
  label: string;
  icon: string;
  end?: boolean;
}

const TABS: Tab[] = [
  { to: "/", label: "Home", icon: "space_dashboard", end: true },
  { to: "/contacts", label: "Contacts", icon: "group" },
  { to: "/deals", label: "Pipeline", icon: "handshake" },
  { to: "/companies", label: "Companies", icon: "apartment" },
  { to: "/tasks", label: "Tasks", icon: "task_alt" },
];

export function MobileTabBar() {
  return (
    <nav className="mobile-tabbar" aria-label="Primary">
      {TABS.map((t) => (
        <NavLink
          key={t.to}
          to={t.to}
          end={t.end}
          className={({ isActive }) => "mtab" + (isActive ? " active" : "")}
        >
          <span className="material-symbols-rounded">{t.icon}</span>
          {t.label}
        </NavLink>
      ))}
    </nav>
  );
}
