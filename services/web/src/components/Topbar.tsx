import { useState } from "react";
import { useLocation } from "react-router-dom";
import { getStoredTheme, toggleTheme, type Theme } from "../theme";
import { MODULES } from "../modules";

/** Derives the page title from the current route. */
function useTitle(): string {
  const { pathname } = useLocation();
  if (pathname === "/") return "Dashboard";
  if (pathname.startsWith("/admin")) return "Admin";
  const key = pathname.replace(/^\//, "").split("/")[0];
  return MODULES[key]?.title ?? "CRM Platform";
}

export function Topbar() {
  const title = useTitle();
  const [theme, setTheme] = useState<Theme>(getStoredTheme());

  return (
    <header className="topbar">
      <div className="topbar-title">{title}</div>
      <div className="topbar-actions">
        <button
          className="icon-btn"
          title="Toggle theme"
          onClick={() => setTheme(toggleTheme())}
        >
          <span className="material-symbols-rounded">
            {theme === "dark" ? "light_mode" : "dark_mode"}
          </span>
        </button>
      </div>
    </header>
  );
}
