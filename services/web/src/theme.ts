/**
 * Theme handling for the 1A design system. Persists the light/dark choice to
 * localStorage['crm-theme'] and reflects it via the data-theme attribute on
 * <html> so the CSS token blocks in theme.css switch.
 */
const STORAGE_KEY = "crm-theme";
export type Theme = "light" | "dark";

export function getStoredTheme(): Theme {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s === "dark" || s === "light") return s;
  } catch {
    /* localStorage unavailable */
  }
  return "light";
}

export function applyTheme(theme: Theme): void {
  document.documentElement.setAttribute("data-theme", theme);
}

/** Call once at startup to apply the persisted theme before first paint. */
export function applyStoredTheme(): Theme {
  const t = getStoredTheme();
  applyTheme(t);
  return t;
}

/** Toggle and persist; returns the new theme. */
export function toggleTheme(): Theme {
  const next: Theme =
    document.documentElement.getAttribute("data-theme") === "dark"
      ? "light"
      : "dark";
  applyTheme(next);
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch {
    /* ignore */
  }
  return next;
}
