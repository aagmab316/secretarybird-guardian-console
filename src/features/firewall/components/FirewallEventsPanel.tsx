import { useFirewallEventsForHousehold } from "../hooks/useFirewallEventsForHousehold";
import type { RiskLevel } from "../../../lib/apiTypes";

interface FirewallEventsPanelProps {
  householdId: string;
}

function riskLabel(level: RiskLevel): string {
  switch (level) {
    case "HIGH":
      return "High Risk";
    case "MEDIUM":
      return "Medium Risk";
    case "LOW":
    default:
      return "Low Risk";
  }
}

function riskBadgeClass(level: RiskLevel): string {
  switch (level) {
    case "HIGH":
      return "bg-red-900/40 text-red-300 border border-red-800";
    case "MEDIUM":
      return "bg-amber-900/40 text-amber-200 border border-amber-800";
    case "LOW":
    default:
      return "bg-emerald-900/40 text-emerald-300 border border-emerald-800";
  }
}

/**
 * FirewallEventsPanel
 *
 * Displays firewall protection events for a household in a compact panel.
 * Can be embedded in household detail pages or displayed as a standalone log.
 *
 * Features:
 * - Shows up to 5 most recent events with scrolling
 * - Color-coded risk levels (LOW/MEDIUM/HIGH)
 * - Event metadata (timestamp, source)
 * - Governance explanations for each event
 * - Loading and error states
 */
export function FirewallEventsPanel({
  householdId,
}: FirewallEventsPanelProps) {
  const { events, loading, error } =
    useFirewallEventsForHousehold(householdId);

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/50 shadow-sm">
      {/* Header */}
      <div className="border-b border-slate-700 px-6 py-4">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-200">
            Firewall Protection Events
          </h2>
          {loading && (
            <span className="text-xs text-slate-500">Loading events…</span>
          )}
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Smart protection signals from the Guardian Firewall system.
        </p>
      </div>

      {/* Content */}
      <div className="p-6 text-sm text-slate-200">
        {/* Error state */}
        {error && (
          <div className="rounded bg-red-900/20 border border-red-800 p-3 text-xs text-red-400">
            <p className="font-medium">Unable to load events</p>
            <p>{error}</p>
          </div>
        )}

        {/* Empty state */}
        {!loading && !error && events.length === 0 && (
          <p className="text-slate-400 italic">
            No firewall events recorded for this household yet.
          </p>
        )}

        {/* Events list */}
        {!loading && !error && events.length > 0 && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {events.map((ev) => (
              <div
                key={ev.id}
                className="rounded border border-slate-700 bg-slate-800/50 p-3"
              >
                <div className="mb-2 flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="font-medium text-slate-100">
                        {ev.category}
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${riskBadgeClass(
                          ev.risk_level,
                        )}`}
                      >
                        {riskLabel(ev.risk_level)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{ev.description}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500">
                  <span>
                    {new Date(ev.occurred_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                  <span className="text-slate-600">via {ev.source}</span>
                </div>

                {ev.explanation_for_humans && (
                  <div className="mt-2 rounded bg-slate-700/50 border border-slate-700 p-2 text-xs text-slate-300">
                    <p className="font-medium text-slate-400 mb-1">
                      Guardian explanation:
                    </p>
                    <p>{ev.explanation_for_humans}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
