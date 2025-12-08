import { useCallback, useEffect, useState } from "react";
import { api } from "../../../lib/api";
import type {
  CaseRiskObservation,
  CreateCaseRiskObservationInput,
  RiskLevel,
} from "../../../lib/apiTypes";

interface UseCaseRiskObservationResult {
  observations: CaseRiskObservation[];
  loading: boolean;
  saving: boolean;
  error: string | null;
  /** Record a new human-in-the-loop risk observation for this case */
  recordObservation: (input: {
    narrative: string;
    risk_level: RiskLevel;
    signal_strength: number;
    category?: string;
  }) => Promise<void>;
}

export function useCaseRiskObservation(
  caseId: string | null | undefined
): UseCaseRiskObservationResult {
  const [observations, setObservations] = useState<CaseRiskObservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing observations when caseId changes
  useEffect(() => {
    if (!caseId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    api
      .listCaseRiskObservations(caseId)
      .then((res) => {
        if (cancelled) return;

        if (res.ok && res.data) {
          setObservations(res.data);
        } else if (!res.ok) {
          const msg =
            (res as any).error?.explanation_for_humans ||
            (res as any).error?.message ||
            "Something went wrong while loading case risk observations.";
          setError(msg);
        }
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        const msg =
          err instanceof Error
            ? err.message
            : "Network error while loading case risk observations.";
        setError(msg);
      })
      .finally(() => {
        if (cancelled) return;
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [caseId]);

  const recordObservation: UseCaseRiskObservationResult["recordObservation"] =
    useCallback(
      async ({ narrative, risk_level, signal_strength, category }) => {
        if (!caseId) {
          setError("Cannot record observation – caseId is missing.");
          return;
        }

        setSaving(true);
        setError(null);

        const payload: CreateCaseRiskObservationInput = {
          narrative,
          risk_level,
          signal_strength,
          category,
        };

        try {
          const res = await api.createCaseRiskObservation(caseId, payload);

          if (res.ok && res.data) {
            // Prepend new observation
            setObservations((prev) => [res.data!, ...prev]);
          } else if (!res.ok) {
            const msg =
              (res as any).error?.explanation_for_humans ||
              (res as any).error?.message ||
              "Something went wrong while saving the risk observation.";
            setError(msg);
          }
        } catch (err) {
          const msg =
            err instanceof Error
              ? err.message
              : "Network error while saving the risk observation.";
          setError(msg);
        } finally {
          setSaving(false);
        }
      },
      [caseId]
    );

  return {
    observations,
    loading,
    saving,
    error,
    recordObservation,
  };
}
