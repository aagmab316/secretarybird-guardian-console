import { useEffect, useState } from "react";
import { api } from "../../../lib/api";
import type { FirewallEvent } from "../../../lib/apiTypes";

type LoadState = "idle" | "loading" | "success" | "error";

interface UseFirewallEventsResult {
  events: FirewallEvent[];
  state: LoadState;
  errorMessage: string | null;
  governanceExplanation: string | null;
}

export function useFirewallEvents(
  householdId: string | undefined,
): UseFirewallEventsResult {
  const [events, setEvents] = useState<FirewallEvent[]>([]);
  const [state, setState] = useState<LoadState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [governanceExplanation, setGovernanceExplanation] =
    useState<string | null>(null);

  // Validate householdId at render time (not in effect) to avoid set-state-in-effect lint error
  const validationError = !householdId
    ? "We couldn't identify which household you're looking at. Please go back and try again."
    : null;

  useEffect(() => {
    if (validationError || !householdId) {
      return; // Skip fetch if validation fails
    }

    // TypeScript doesn't narrow householdId inside async closure, so capture it
    const validHouseholdId = householdId;
    let cancelled = false;

    async function load() {
      setState("loading");
      setErrorMessage(null);
      setGovernanceExplanation(null);

      const res = await api.listFirewallEventsForHousehold(validHouseholdId);

      if (cancelled) return;

      if (!res.ok) {
        const fallback =
          "We couldn't load firewall events for this household right now. You can try again in a moment, or contact a supervisor if this keeps happening.";

        setState("error");
        setErrorMessage(fallback);

        const explanation =
          res.error?.explanation_for_humans ?? res.error?.message ?? null;

        if (explanation) {
          setGovernanceExplanation(explanation);
        }

        return;
      }

      setEvents(res.data ?? []);
      setState("success");
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [householdId, validationError]);

  // Return validation error state when householdId is missing
  if (validationError) {
    return {
      events: [],
      state: "error",
      errorMessage: validationError,
      governanceExplanation: null,
    };
  }

  return { events, state, errorMessage, governanceExplanation };
}
