import { createContext, useContext, type ReactNode } from "react";

/**
 * Static auth for the Google Sheets demo — a drop-in replacement for
 * `services/web/src/auth/AuthContext.tsx`. The demo has no login page: it runs
 * as a fixed Admin "demo user" so every screen (including admin-only UI) is
 * visible. Exports mirror the real module so the frontend imports it unchanged.
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

const DEMO_USER: User = {
  userId: "demo",
  email: "demo@sheets.local",
  displayName: "Demo User",
  role: "admin",
};

const value: AuthState = {
  user: DEMO_USER,
  loading: false,
  isAdmin: true,
  login: () => {},
  logout: () => {},
};

const AuthContext = createContext<AuthState>(value);

export function AuthProvider({ children }: { children: ReactNode }) {
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
