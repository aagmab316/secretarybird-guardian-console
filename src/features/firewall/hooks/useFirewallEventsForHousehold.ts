import { useEffect, useState } from "react";
import { api } from "../../../lib/api";
import type { FirewallEvent } from "../../../lib/apiTypes";

interface UseFirewallEventsResult {
  events: FirewallEvent[];
  loading: boolean;
  error: string | null;
}

/**
 * Hook to fetch firewall events for a household
 *
 * Handles loading and error states for displaying protection events.
 * Returns an empty array and loading state if householdId is not provided.
 *
 * @param householdId - The household ID to fetch events for
 * @returns Object with events array, loading state, and error message
 */
export function useFirewallEventsForHousehold(
  householdId: string | null | undefined,
): UseFirewallEventsResult {
  const [events, setEvents] = useState<FirewallEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!householdId) return;

    const validHouseholdId = householdId as string;
    let cancelled = false;
    setLoading(true);
    setError(null);

    async function load() {
      try {
        const res = await api.listFirewallEventsForHousehold(validHouseholdId);

        if (cancelled) return;

        if (res.ok && res.data) {
          setEvents(res.data);
        } else if (!res.ok) {
          const msg =
            res.error?.explanation_for_humans ||
            res.error?.message ||
            "Something went wrong while loading firewall events.";
          setError(msg);
        }
      } catch (err: unknown) {
        if (cancelled) return;
        const msg =
          err instanceof Error
            ? err.message
            : "Network error while loading firewall events.";
        setError(msg);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [householdId]);

  return { events, loading, error };
}
