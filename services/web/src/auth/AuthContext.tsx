import {
  createContext,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/**
 * Authentication context (REQ-001, REQ-002). Performs the OIDC login redirect
 * against the pluggable IdP (served at /auth via the reverse proxy) and exposes
 * the current user + role so the UI can hide admin-only functions for Members.
 *
 * NOTE (scaffold): `login` builds and navigates to the OIDC authorize URL — the
 * real seam. Completing the authorization-code callback + session exchange with
 * the API is left as a TODO for the chosen scaffold scope; `user` starts null.
 */
export type Role = "admin" | "member";

export interface User {
  email: string;
  displayName: string;
  role: Role;
}

interface AuthState {
  user: User | null;
  isAdmin: boolean;
  login: () => void;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

const AUTHORITY = import.meta.env.VITE_OIDC_AUTHORITY || "/auth/realms/crm";
const CLIENT_ID = import.meta.env.VITE_OIDC_CLIENT_ID || "crm-web";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  const value = useMemo<AuthState>(
    () => ({
      user,
      isAdmin: user?.role === "admin",
      login: () => {
        // Redirect to the IdP's OIDC authorization endpoint (REQ-001 seam).
        const redirectUri = `${window.location.origin}/callback`;
        const url =
          `${AUTHORITY}/protocol/openid-connect/auth` +
          `?client_id=${encodeURIComponent(CLIENT_ID)}` +
          `&redirect_uri=${encodeURIComponent(redirectUri)}` +
          `&response_type=code&scope=openid%20profile%20email`;
        window.location.assign(url);
      },
      logout: () => {
        setUser(null);
        // TODO(scaffold): call the API logout endpoint to invalidate the
        // server-side session (REQ-003), then redirect to the IdP logout.
      },
    }),
    [user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
