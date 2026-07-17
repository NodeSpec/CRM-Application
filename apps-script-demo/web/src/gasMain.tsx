import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
// Reuse the EXACT frontend from the core repo (nothing copied/forked).
import App from "@web/App";
import { AuthProvider } from "@web/auth/AuthContext"; // aliased to gasAuth by vite.config
import { applyStoredTheme } from "@web/theme";
import "@web/theme.css";
import "@web/styles.css";

function boot() {
  // localStorage can throw in a sandboxed iframe — never let it blank the page.
  try {
    applyStoredTheme();
  } catch {
    /* ignore */
  }

  // The bundle is inlined into <head> and runs before <body>, so #root may not
  // exist yet — create it if needed.
  let root = document.getElementById("root");
  if (!root) {
    root = document.createElement("div");
    root.id = "root";
    document.body.appendChild(root);
  }

  // HashRouter (not BrowserRouter): the Apps Script web app is served from an
  // opaque googleusercontent.com iframe URL where History API navigation breaks.
  try {
    createRoot(root).render(
      <StrictMode>
        <HashRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </HashRouter>
      </StrictMode>
    );
  } catch (e) {
    root.innerHTML =
      '<pre style="padding:16px;white-space:pre-wrap;font:13px monospace;color:#b00">' +
      "App failed to start:\n" +
      String((e as Error)?.stack || e) +
      "</pre>";
  }
}

// Wait for the DOM (the script executes in <head>, before <body>/#root exist).
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", boot);
} else {
  boot();
}
