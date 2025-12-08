import { useEffect, useState } from "react";
import { api, GuardianFirewallEvent } from "../../../lib/api";

type LoadState = "idle" | "loading" | "success" | "error";

interface UseFirewallEventsResult {
  events: GuardianFirewallEvent[];
  state: LoadState;
  errorMessage: string | null;
  governanceExplanation: string | null;
}

export function useFirewallEvents(
  householdId: string | undefined,
): UseFirewallEventsResult {
  const [events, setEvents] = useState<GuardianFirewallEvent[]>([]);
  const [state, setState] = useState<LoadState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [governanceExplanation, setGovernanceExplanation] =
    useState<string | null>(null);

  useEffect(() => {
    if (!householdId) {
      setState("error");
      setErrorMessage(
        "We couldn't identify which household you're looking at. Please go back and try again.",
      );
      return;
    }

    let cancelled = false;

    async function load() {
      setState("loading");
      setErrorMessage(null);
      setGovernanceExplanation(null);

      const res = await api.listFirewallEventsForHousehold(householdId!);

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

      setEvents(res.data);
      setState("success");
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [householdId]);

  return { events, state, errorMessage, governanceExplanation };
}
