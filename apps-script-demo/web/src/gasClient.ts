/**
 * Google Apps Script API adapter — a drop-in replacement for
 * `services/web/src/api/client.ts`. Instead of `fetch('/api/v1/...')` it calls
 * the Apps Script server function `apiCall(...)` over `google.script.run`, which
 * is backed by a Google Sheet. The public surface (`api.list/object/get/create/
 * update/patch/remove` + `ApiError`) matches the real client exactly, so every
 * page in the frontend works unchanged.
 */
export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

interface ApiRequest {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string;
  params?: Record<string, string>;
  body?: unknown;
}

// google.script.run is injected by Apps Script into the served iframe.
declare global {
  interface Window {
    google?: { script?: { run?: any } };
  }
}

function bridge<T>(req: ApiRequest): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const gsr = typeof window !== "undefined" && window.google?.script?.run;
    if (!gsr) {
      // Outside Apps Script (e.g. a plain browser preview) there is no backend.
      reject(new ApiError(0, "google.script.run unavailable (run inside the Apps Script web app)"));
      return;
    }
    gsr
      .withSuccessHandler((res: unknown) => {
        const r = res as { __error?: { status: number; message: string } } | T;
        if (r && typeof r === "object" && "__error" in (r as object) && (r as any).__error) {
          const e = (r as any).__error;
          reject(new ApiError(e.status ?? 500, e.message ?? "Request failed"));
        } else {
          resolve(res as T);
        }
      })
      .withFailureHandler((err: Error) => reject(new ApiError(500, err?.message ?? "Server error")))
      // Pass the request as a JSON STRING. google.script.run is strict about
      // object parameters (undefined-valued properties and non-plain objects
      // fail the call); a plain string is always legal and JSON round-tripping
      // drops undefined values. The server parses it back (see apiCall).
      .apiCall(JSON.stringify(req));
  });
}

export const api = {
  list: <T>(resource: string, params?: Record<string, string>) =>
    bridge<T[]>({ method: "GET", path: resource, params }),
  object: <T>(resource: string) => bridge<T>({ method: "GET", path: resource }),
  get: <T>(resource: string, id: string) => bridge<T>({ method: "GET", path: `${resource}/${id}` }),
  create: <T>(resource: string, body: unknown) => bridge<T>({ method: "POST", path: resource, body }),
  update: <T>(resource: string, id: string, body: unknown) =>
    bridge<T>({ method: "PUT", path: `${resource}/${id}`, body }),
  patch: <T>(resource: string, id: string, body: unknown) =>
    bridge<T>({ method: "PATCH", path: `${resource}/${id}`, body }),
  remove: (resource: string, id: string) =>
    bridge<void>({ method: "DELETE", path: `${resource}/${id}` }),
};
