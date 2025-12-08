import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useCaseRiskObservation } from "./useCaseRiskObservation";
import * as apiModule from "../../../lib/api";

vi.mock("../../../lib/api", () => ({
  api: {
    getCaseRiskObservations: vi.fn(),
    recordCaseRiskObservation: vi.fn(),
  },
}));

describe("useCaseRiskObservation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("loads risk observations on mount", async () => {
    const mockObservations = [
      {
        id: 1,
        case_id: 1,
        narrative: "Test observation",
        risk_signal_strength: 3,
        category: "test",
        created_at: "2025-12-05T10:00:00Z",
      },
    ];

    vi.spyOn(apiModule.api, "getCaseRiskObservations").mockResolvedValue({
      ok: true,
      data: mockObservations,
    });

    const { result } = renderHook(() => useCaseRiskObservation(1));

    expect(result.current.state).toBe("loading");

    await waitFor(() => {
      expect(result.current.state).toBe("success");
    });

    expect(result.current.observations).toEqual(mockObservations);
  });

  it("handles invalid case ID", () => {
    const { result } = renderHook(() => useCaseRiskObservation(undefined));

    expect(result.current.state).toBe("error");
    expect(result.current.errorMessage).toBeTruthy();
  });

  it("records a new observation", async () => {
    const newObservation = {
      id: 2,
      case_id: 1,
      narrative: "New observation",
      risk_signal_strength: 4,
      category: "general",
      created_at: "2025-12-05T11:00:00Z",
    };

    vi.spyOn(apiModule.api, "getCaseRiskObservations").mockResolvedValue({
      ok: true,
      data: [],
    });

    vi.spyOn(apiModule.api, "recordCaseRiskObservation").mockResolvedValue({
      ok: true,
      data: newObservation,
    });

    const { result } = renderHook(() => useCaseRiskObservation(1));

    await waitFor(() => {
      expect(result.current.state).toBe("success");
    });

    await result.current.recordObservation("New observation", 4);

    expect(result.current.observations).toContainEqual(newObservation);
  });
});

