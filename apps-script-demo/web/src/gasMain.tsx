import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
// Reuse the EXACT frontend from the core repo (nothing copied/forked).
import App from "@web/App";
import { AuthProvider } from "@web/auth/AuthContext"; // aliased to gasAuth by vite.config
import { applyStoredTheme } from "@web/theme";
import "@web/theme.css";
import "@web/styles.css";

applyStoredTheme();

// HashRouter (not BrowserRouter): the Apps Script web app is served from an
// opaque googleusercontent.com iframe URL where History API navigation breaks.
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </HashRouter>
  </StrictMode>
);
