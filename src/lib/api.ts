// Lightweight typed API client with governance-aware handling
import { API_BASE } from "./config";

type ApiResponse<T> = { ok: true; data: T } | { ok: false; status: number; error?: any; explanation_for_humans?: string };

async function request<T>(path: string, init: RequestInit = {}): Promise<ApiResponse<T>> {
  const url = `${API_BASE.replace(/\/$/, "")}${path.startsWith("/") ? "" : "/"}${path}`;
  const res = await fetch(url, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    ...init,
  });

  const contentType = res.headers.get("content-type") || "";
  let body: any = null;
  if (contentType.includes("application/json")) {
    body = await res.json();
  } else {
    body = await res.text();
  }

  if (res.ok) {
    return { ok: true, data: body as T };
  }

  // Governance-aware handling: backend may return explanation_for_humans
  const explanation = body?.explanation_for_humans || body?.message || undefined;

  return { ok: false, status: res.status, error: body, explanation_for_humans: explanation };
}

/**
 * Example API surface. Expand this according to your backend endpoints.
 */
export const api = {
  cases: {
    list: async () => request<any[]>("/cases"),
    get: async (id: string) => request<any>(`/cases/${encodeURIComponent(id)}`),
    update: async (id: string, payload: any) =>
      request<any>(`/cases/${encodeURIComponent(id)}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      }),
  },
  auth: {
    me: async () => request<any>("/auth/me"),
    login: async (payload: { username: string; password: string }) =>
      request<any>("/auth/login", { method: "POST", body: JSON.stringify(payload) }),
    logout: async () => request<void>("/auth/logout", { method: "POST" }),
  },
};

export type Api = typeof api;
