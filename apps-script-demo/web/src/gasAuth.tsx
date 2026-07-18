import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "./gasClient";

/**
 * Auth for the Google Sheets app — a drop-in replacement for
 * `services/web/src/auth/AuthContext.tsx`. Identity comes from Google itself:
 * the server's `whoami` endpoint reads the signed-in Google account and checks
 * it against the `users` tab (the allowlist + role source).
 *
 * States:
 * - authorized: the app renders with that user's real role (admin | member).
 * - denied: a full-screen explanation replaces the app (who you are signed in
 *   as, and that an admin must approve you).
 * - demo mode / old server: falls back to the original static Demo Admin so
 *   anonymous demo deployments keep working unchanged.
 */
export type Role = "admin" | "member";

export interface User {
  userId: string;
  email: string;
  displayName: string;
  role: Role;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  login: () => void;
  logout: () => void;
}

interface WhoAmI {
  authorized: boolean;
  mode: "demo" | "enforced";
  email: string;
  role: Role | null;
  display_name: string;
  reason: string | null;
}

const DEMO_USER: User = {
  userId: "demo",
  email: "demo@sheets.local",
  displayName: "Demo User",
  role: "admin",
};

const AuthContext = createContext<AuthState | null>(null);

function DeniedScreen({ email, reason }: { email: string; reason: string | null }) {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--bg)", padding: 20 }}>
      <div style={{ maxWidth: 460, background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "28px 26px", textAlign: "center" }}>
        <span className="material-symbols-rounded" style={{ fontSize: 40, color: "var(--warn)" }}>lock_person</span>
        <h2 style={{ margin: "10px 0 6px", fontSize: 19 }}>Access not approved yet</h2>
        {email && (
          <p style={{ margin: "0 0 10px", color: "var(--text-2)", fontSize: 14 }}>
            You are signed in as <b>{email}</b>.
          </p>
        )}
        <p style={{ margin: 0, color: "var(--text-2)", fontSize: 13.5, lineHeight: 1.55 }}>
          {reason || "An admin needs to approve your account before you can use this CRM."}
        </p>
      </div>
    </div>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState<{ email: string; reason: string | null } | null>(null);

  useEffect(() => {
    let active = true;
    api
      .object<WhoAmI>("whoami")
      .then((me) => {
        if (!active) return;
        if (me.authorized) {
          setUser({
            userId: me.email || "demo",
            email: me.email,
            displayName: me.display_name || me.email || "User",
            role: (me.role as Role) || "member",
          });
        } else {
          setDenied({ email: me.email, reason: me.reason });
        }
      })
      // Old server without whoami, or plain-browser preview: keep the original
      // demo behavior instead of bricking the page. Writes are still enforced
      // server-side, so this fallback cannot grant real access.
      .catch(() => active && setUser(DEMO_USER))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const value: AuthState = {
    user,
    loading,
    isAdmin: user?.role === "admin",
    login: () => {},
    logout: () => {},
  };

  if (!loading && denied) return <DeniedScreen email={denied.email} reason={denied.reason} />;
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
