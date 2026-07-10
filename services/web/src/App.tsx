import { Routes, Route } from "react-router-dom";
import { Sidebar } from "./components/Sidebar";
import { Topbar } from "./components/Topbar";
import { Dashboard } from "./pages/Dashboard";
import { AdminPage } from "./pages/AdminPage";
import { ResourcePage } from "./pages/ResourcePage";
import { EventsPage } from "./pages/EventsPage";
import { CategoriesAdmin } from "./pages/admin/CategoriesAdmin";
import { UsersAdmin } from "./pages/admin/UsersAdmin";
import { AuditAdmin } from "./pages/admin/AuditAdmin";
import { MODULES } from "./modules";
import { useAuth } from "./auth/AuthContext";

/** Full-screen login prompt shown before authentication. */
function LoginGate() {
  const { login } = useAuth();
  return (
    <div className="app">
      <div className="main">
        <div className="content">
          <section className="login-gate">
            <h1>Welcome to the CRM</h1>
            <p className="muted">
              Sign in with your organization account to continue.
            </p>
            <button className="btn btn-primary" onClick={login}>
              Log in
            </button>
          </section>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="app">
        <div className="main">
          <div className="content">
            <p className="muted">Loading…</p>
          </div>
        </div>
      </div>
    );
  }
  if (!user) return <LoginGate />;

  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <Topbar />
        <div className="content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            {Object.values(MODULES).map((cfg) =>
              cfg.resource === "events" ? (
                <Route key="events" path="/events" element={<EventsPage />} />
              ) : (
                <Route
                  key={cfg.resource}
                  path={`/${cfg.resource}`}
                  element={<ResourcePage config={cfg} />}
                />
              )
            )}
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/categories" element={<CategoriesAdmin />} />
            <Route path="/admin/users" element={<UsersAdmin />} />
            <Route path="/admin/audit" element={<AuditAdmin />} />
            <Route
              path="*"
              element={
                <section>
                  <h1>Not found</h1>
                </section>
              }
            />
          </Routes>
        </div>
      </div>
    </div>
  );
}
