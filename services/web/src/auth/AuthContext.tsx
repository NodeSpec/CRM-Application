import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Authentication context (REQ-001, REQ-002). Login is backend-driven (BFF):
 * the SPA navigates to the API's /auth/login, which redirects to the IdP; after
 * the callback the API sets a session cookie and the SPA reads the current user
 * from /auth/me. Role is exposed so the UI hides admin-only functions (REQ-002).
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

const AuthContext = createContext<AuthState | null>(null);
const BASE = import.meta.env.VITE_API_BASE_URL || "/api/v1";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetch(`${BASE}/auth/me`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (active) setUser(data?.user ?? null);
      })
      .catch(() => active && setUser(null))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      user,
      loading,
      isAdmin: user?.role === "admin",
      login: () => {
        // Full-page navigation to the backend login route (starts OIDC).
        window.location.assign(`${BASE}/auth/login`);
      },
      logout: async () => {
        try {
          await fetch(`${BASE}/auth/logout`, {
            method: "POST",
            credentials: "include",
          });
        } finally {
          setUser(null);
          window.location.assign("/");
        }
      },
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
