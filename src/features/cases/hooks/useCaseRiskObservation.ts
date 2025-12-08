import { useEffect, useState } from "react";
import {
  api,
  CaseRiskObservation,
  CaseRiskObservationRequest,
} from "../../../lib/api";

type LoadState = "idle" | "loading" | "success" | "error";

interface UseCaseRiskObservationResult {
  observations: CaseRiskObservation[];
  state: LoadState;
  errorMessage: string | null;
  governanceExplanation: string | null;
  recording: boolean;
  recordError: string | null;
  recordObservation: (narrative: string, riskSignal?: number) => Promise<void>;
}

/**
 * Hook for loading and recording risk observations for a case.
 * Handles the narrative-driven risk assessment pattern.
 *
 * @param caseId - The case ID to load observations for
 * @returns Object with observations, loading states, and record function
 */
export function useCaseRiskObservation(
  caseId: number | undefined,
): UseCaseRiskObservationResult {
  const [observations, setObservations] = useState<CaseRiskObservation[]>([]);
  const [state, setState] = useState<LoadState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [governanceExplanation, setGovernanceExplanation] =
    useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [recordError, setRecordError] = useState<string | null>(null);

  // Load observations on mount and when caseId changes
  useEffect(() => {
    if (!caseId || caseId <= 0) {
      setState("error");
      setErrorMessage("Invalid case ID provided.");
      return;
    }

    const validCaseId = caseId as number;
    let cancelled = false;

    async function load() {
      setState("loading");
      setErrorMessage(null);
      setGovernanceExplanation(null);

      const res = await api.getCaseRiskObservations(validCaseId);

      if (cancelled) return;

      if (!res.ok) {
        const fallback =
          "We couldn't load risk observations for this case. Try again or contact a supervisor.";

        setState("error");
        setErrorMessage(fallback);

        const explanation =
          res.error?.explanation_for_humans ?? res.error?.message ?? null;

        if (explanation) {
          setGovernanceExplanation(explanation);
        }

        return;
      }

      setObservations(res.data ?? []);
      setState("success");
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [caseId]);

  /**
   * Record a new risk observation for the case.
   * This captures narrative-driven risk assessments.
   *
   * @param narrative - The narrative description of the observed risk
   * @param riskSignal - Optional risk signal strength (0-5)
   */
  async function recordObservation(
    narrative: string,
    riskSignal?: number,
  ): Promise<void> {
    if (!caseId || caseId <= 0) {
      setRecordError("Invalid case ID.");
      return;
    }

    if (!narrative.trim()) {
      setRecordError("Narrative cannot be empty.");
      return;
    }

    setRecording(true);
    setRecordError(null);

    try {
      const payload: CaseRiskObservationRequest = {
        narrative: narrative.trim(),
      };

      if (riskSignal !== undefined) {
        payload.risk_signal_strength = Math.max(0, Math.min(5, riskSignal));
      }

      const res = await api.recordCaseRiskObservation(caseId, payload);

      if (!res.ok) {
        const fallback =
          "Failed to record the risk observation. Please try again.";
        setRecordError(
          res.error?.explanation_for_humans ??
            res.error?.message ??
            fallback,
        );
        return;
      }

      // Add the new observation to the list
      setObservations((prev) => [res.data, ...prev]);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "An unexpected error occurred while recording.";
      setRecordError(message);
    } finally {
      setRecording(false);
    }
  }

  return {
    observations,
    state,
    errorMessage,
    governanceExplanation,
    recording,
    recordError,
    recordObservation,
  };
}
