import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useCaseRiskObservation } from "./useCaseRiskObservation";
import * as apiModule from "../../../lib/api";

vi.mock("../../../lib/api", () => ({
  api: {
    listCaseRiskObservations: vi.fn(),
    createCaseRiskObservation: vi.fn(),
  },
}));

describe("useCaseRiskObservation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads risk observations on mount", async () => {
    const mockObservations = [
      {
        id: "obs-1",
        case_id: "1",
        narrative: "Test observation",
        risk_level: "MEDIUM" as const,
        signal_strength: 3,
        category: "test",
        created_at: "2025-12-05T10:00:00Z",
      },
    ];

    vi.spyOn(apiModule.api, "listCaseRiskObservations").mockResolvedValue({
      ok: true,
      data: mockObservations,
    } as any);

    const { result } = renderHook(() => useCaseRiskObservation("1"));

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.observations).toEqual(mockObservations);
  });

  it("handles missing case ID", () => {
    const { result } = renderHook(() => useCaseRiskObservation(null));

    // Should not load anything without caseId
    expect(result.current.observations.length).toBe(0);
  });

  it("records a new observation", async () => {
    const newObservation = {
      id: "obs-2",
      case_id: "1",
      narrative: "New observation",
      risk_level: "HIGH" as const,
      signal_strength: 4,
      category: "test",
      created_at: "2025-12-05T11:00:00Z",
    };

    vi.spyOn(apiModule.api, "listCaseRiskObservations").mockResolvedValue({
      ok: true,
      data: [],
    } as any);

    vi.spyOn(apiModule.api, "createCaseRiskObservation").mockResolvedValue({
      ok: true,
      data: newObservation,
    } as any);

    const { result } = renderHook(() => useCaseRiskObservation("1"));

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    await result.current.recordObservation({
      narrative: "New observation",
      risk_level: "HIGH",
      signal_strength: 4,
      category: "test",
    });

    await waitFor(() => {
      expect(result.current.observations.length).toBe(1);
    });

    expect(result.current.observations[0]).toEqual(newObservation);
  });
});

