import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
// Reuse the EXACT frontend from the core repo (nothing copied/forked).
import App from "@web/App";
import { AuthProvider } from "@web/auth/AuthContext"; // aliased to gasAuth by vite.config
import { applyStoredTheme } from "@web/theme";
import "@web/theme.css";
import "@web/styles.css";

// localStorage can throw in a sandboxed iframe — never let it blank the page.
try {
  applyStoredTheme();
} catch {
  /* ignore */
}

// HashRouter (not BrowserRouter): the Apps Script web app is served from an
// opaque googleusercontent.com iframe URL where History API navigation breaks.
try {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <HashRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </HashRouter>
    </StrictMode>
  );
} catch (e) {
  // Surface init errors instead of rendering an empty page.
  const el = document.getElementById("root");
  if (el)
    el.innerHTML =
      '<pre style="padding:16px;white-space:pre-wrap;font:13px monospace;color:#b00">' +
      "App failed to start:\n" +
      String((e as Error)?.stack || e) +
      "</pre>";
}
