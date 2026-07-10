import { Routes, Route } from "react-router-dom";
import { Nav } from "./components/Nav";
import { Dashboard } from "./pages/Dashboard";
import { AdminPage } from "./pages/AdminPage";
import { ResourcePage } from "./pages/ResourcePage";
import { MODULES } from "./modules";
import { useAuth } from "./auth/AuthContext";

/**
 * Application shell + routing (REQ-004..013, REQ-016). One route per module,
 * driven by the MODULES config. A lightweight login gate prompts unauthenticated
 * users before showing app content.
 */
function LoginGate() {
  const { login } = useAuth();
  return (
    <section className="login-gate">
      <h1>Welcome to the CRM</h1>
      <p className="muted">Sign in with your organization account to continue.</p>
      <button onClick={login}>Log in</button>
    </section>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  return (
    <div className="app">
      <Nav />
      <main className="content">
        {loading ? (
          <p className="muted">Loading…</p>
        ) : !user ? (
          <LoginGate />
        ) : (
          <Routes>
            <Route path="/" element={<Dashboard />} />
            {Object.values(MODULES).map((cfg) => (
              <Route
                key={cfg.resource}
                path={`/${cfg.resource}`}
                element={<ResourcePage config={cfg} />}
              />
            ))}
            <Route path="/admin" element={<AdminPage />} />
            <Route
              path="*"
              element={
                <section>
                  <h1>Not found</h1>
                </section>
              }
            />
          </Routes>
        )}
      </main>
    </div>
  );
}
