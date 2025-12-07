// src/features/system/hooks/useApiHealth.ts
import { useEffect, useState } from "react";
import { api, type HealthResponse } from "../../../lib/api";

export function useApiHealth() {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorExplanation, setErrorExplanation] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    api
      .health()
      .then((res) => {
        if (cancelled) return;
        if (res.ok) {
          setData(res.data);
          setErrorExplanation(null);
        } else {
          setErrorExplanation(
            "We couldn't reach the Guardian backend right now. You can try again in a moment, or contact a supervisor if this keeps happening.",
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, loading, errorExplanation };
}
