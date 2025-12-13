// src/lib/api.ts
import { getApiBaseUrl } from "./config";
import type {
  FirewallEvent,
  CaseRiskObservation,
  CreateCaseRiskObservationInput,
  SearchRequest,
  SearchResponse,
} from "./apiTypes";

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
      retryAfterSeconds?: number;
      isUnauthorized: boolean;
      isForbidden: boolean;
      isValidationError: boolean;
      isRateLimited: boolean;
    };

function parseRetryAfterSeconds(value: string | null): number | undefined {
  if (!value) return undefined;
  const asInt = Number.parseInt(value, 10);
  if (Number.isFinite(asInt)) return Math.max(0, asInt);

  // Retry-After can also be an HTTP date.
  const asDateMs = Date.parse(value);
  if (Number.isNaN(asDateMs)) return undefined;
  const deltaSeconds = Math.ceil((asDateMs - Date.now()) / 1000);
  return Math.max(0, deltaSeconds);
}

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
    const retryAfterSeconds = parseRetryAfterSeconds(
      response.headers.get("Retry-After"),
    );
    return {
      ok: false,
      status: response.status,
      error: errorPayload,
      retryAfterSeconds,
      isUnauthorized: response.status === 401,
      isForbidden: response.status === 403,
      isValidationError: response.status === 400 || response.status === 422,
      isRateLimited: response.status === 429,
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

// Cases API types
export interface Case {
  id: number;
  title: string;
  description?: string;
  category: string;
  risk_level: number;
  status: string;
  household_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CaseRiskObservationRequest {
  narrative: string;
  risk_level: "LOW" | "MEDIUM" | "HIGH";
  signal_strength: number;
  category?: string;
}

export const api = {
  // Generic HTTP methods
  get<T = unknown>(path: string) {
    return request<T>(path, { method: "GET" });
  },

  post<T = unknown>(path: string, body?: unknown) {
    return request<T>(path, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  put<T = unknown>(path: string, body?: unknown) {
    return request<T>(path, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  delete<T = unknown>(path: string) {
    return request<T>(path, { method: "DELETE" });
  },

  // Specific typed endpoints
  health() {
    return request<HealthResponse>("/health");
  },

  listFirewallEventsForHousehold(householdId: string) {
    return request<FirewallEvent[]>(
      `/firewall/households/${householdId}/events`,
    );
  },

  // Cases endpoints
  getCase(caseId: number | string) {
    return request<Case>(`/cases/${caseId}`);
  },

  listCases() {
    return request<Case[]>("/cases");
  },

  listCaseRiskObservations(caseId: string | number) {
    return request<CaseRiskObservation[]>(
      `/cases/${caseId}/risk-observations`,
    );
  },

  createCaseRiskObservation(
    caseId: string | number,
    input: CreateCaseRiskObservationInput,
  ) {
    return request<CaseRiskObservation>(
      `/cases/${caseId}/risk-observations`,
      {
        method: "POST",
        body: JSON.stringify(input),
      },
    );
  },

  // Darknet Shield RAG Search
  search(input: SearchRequest) {
    return request<SearchResponse>("/search/", {
      method: "POST",
      body: JSON.stringify(input),
    });
  },
};
