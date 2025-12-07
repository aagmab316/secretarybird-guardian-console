// src/lib/api.ts
import { getApiBaseUrl } from "./config";

export interface ApiErrorPayload {
  message?: string;
  code?: string;
  explanation_for_humans?: string;
  [key: string]: unknown;
}

export type ApiResponse<T> =
  | { ok: true; data: T }
  | {
      ok: false;
      status: number;
      error?: ApiErrorPayload;
      isUnauthorized: boolean;
      isForbidden: boolean;
      isValidationError: boolean;
    };

async function request<T = unknown>(
  path: string,
  init: RequestInit = {},
): Promise<ApiResponse<T>> {
  const base = getApiBaseUrl();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    credentials: "include", // keep if you use cookies; remove if token-based only
    ...init,
  });

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    payload = undefined;
  }

  if (!response.ok) {
    const errorPayload = (payload ?? {}) as ApiErrorPayload;
    return {
      ok: false,
      status: response.status,
      error: errorPayload,
      isUnauthorized: response.status === 401,
      isForbidden: response.status === 403,
      isValidationError: response.status === 400 || response.status === 422,
    };
  }

  return { ok: true, data: payload as T };
}

// ---- Example typed endpoints ----

export interface HealthResponse {
  status: "ok";
  version?: string;
}

export interface GuardianFirewallEvent {
  id: string;
  risk_level: "LOW" | "MEDIUM" | "HIGH";
  category: string;
  subject_type: string;
  source: string;
  created_at: string;
  explanation_for_humans?: string;
}

export const api = {
  health() {
    return request<HealthResponse>("/health");
  },

  listFirewallEventsForHousehold(householdId: string) {
    // adjust path to match your FastAPI route name
    return request<GuardianFirewallEvent[]>(
      `/firewall/households/${householdId}/events`,
    );
  },
};
