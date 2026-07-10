/**
 * Typed API client targeting the versioned backend through the reverse proxy
 * (REQ-016). Sends the session cookie with every request (credentials:
 * "include") and surfaces 401s so the app can redirect to login (REQ-003).
 */
const BASE = import.meta.env.VITE_API_BASE_URL || "/api/v1";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string
  ) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
  });
  if (res.status === 401) {
    // Session expired/absent — let the caller trigger the login redirect.
    throw new ApiError(401, "Unauthorized");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.error ?? res.statusText);
  }
  return (await res.json()) as T;
}

export const api = {
  list: <T>(resource: string, params?: Record<string, string>) => {
    const qs = params ? `?${new URLSearchParams(params)}` : "";
    return request<T[]>(`/${resource}${qs}`);
  },
  /** GET a resource that returns a single object (e.g. the dashboard summary). */
  object: <T>(resource: string) => request<T>(`/${resource}`),
  get: <T>(resource: string, id: string) => request<T>(`/${resource}/${id}`),
  create: <T>(resource: string, body: unknown) =>
    request<T>(`/${resource}`, { method: "POST", body: JSON.stringify(body) }),
  update: <T>(resource: string, id: string, body: unknown) =>
    request<T>(`/${resource}/${id}`, {
      method: "PUT",
      body: JSON.stringify(body),
    }),
  patch: <T>(resource: string, id: string, body: unknown) =>
    request<T>(`/${resource}/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  remove: (resource: string, id: string) =>
    request<void>(`/${resource}/${id}`, { method: "DELETE" }),
};
