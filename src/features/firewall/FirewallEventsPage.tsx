import { Link, useParams } from "react-router-dom";
import { useFirewallEvents } from "./hooks/useFirewallEvents";

function riskBadgeClasses(level: string): string {
  switch (level) {
    case "HIGH":
      return "inline-flex items-center rounded-full bg-red-900/40 px-2 py-0.5 text-xs font-semibold text-red-300 border border-red-400/40";
    case "MEDIUM":
      return "inline-flex items-center rounded-full bg-amber-900/40 px-2 py-0.5 text-xs font-semibold text-amber-200 border border-amber-300/40";
    default:
      return "inline-flex items-center rounded-full bg-emerald-900/30 px-2 py-0.5 text-xs font-semibold text-emerald-200 border border-emerald-300/40";
  }
}

export function FirewallEventsPage() {
  const { householdId } = useParams<{ householdId: string }>();
  const { events, state, errorMessage, governanceExplanation } =
    useFirewallEvents(householdId);

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6 text-slate-100">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">
            Guardian Firewall events
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Household ID:{" "}
            <span className="font-mono text-slate-200">
              {householdId ?? "—"}
            </span>
          </p>
        </div>

        <Link
          to="/dashboard"
          className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm font-medium text-slate-100 hover:bg-slate-800"
        >
          ← Back to dashboard
        </Link>
      </header>

      {/* Status / messages */}
      {state === "loading" && (
        <p className="text-sm text-slate-300">
          Loading firewall events for this household…
        </p>
      )}

      {state === "error" && (
        <div className="rounded-xl border border-amber-400/40 bg-amber-900/30 p-4">
          <p className="text-sm text-amber-100">{errorMessage}</p>
          {governanceExplanation && (
            <p className="mt-2 text-sm text-amber-200">
              {governanceExplanation}
            </p>
          )}
        </div>
      )}

      {state === "success" && events.length === 0 && (
        <p className="rounded-xl border border-slate-700 bg-slate-900 p-4 text-sm text-slate-300">
          There are no recorded firewall events for this household yet.
          If you believe something is missing, you can refresh this page
          in a moment or contact a supervisor for support.
        </p>
      )}

      {state === "success" && events.length > 0 && (
        <section className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
          <h2 className="text-sm font-semibold text-slate-200">
            Recent firewall decisions
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            These entries show how the Guardian Firewall evaluated
            online activity for this household.
          </p>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-400">
                  <th scope="col" className="px-3 py-2">
                    Time
                  </th>
                  <th scope="col" className="px-3 py-2">
                    Risk
                  </th>
                  <th scope="col" className="px-3 py-2">
                    Category
                  </th>
                  <th scope="col" className="px-3 py-2">
                    Subject
                  </th>
                  <th scope="col" className="px-3 py-2">
                    Source
                  </th>
                  <th scope="col" className="px-3 py-2">
                    Explanation
                  </th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr
                    key={event.id}
                    className="border-b border-slate-900/80 last:border-none"
                  >
                    <td className="whitespace-nowrap px-3 py-2 text-xs text-slate-300">
                      {new Date(event.created_at).toLocaleString()}
                    </td>
                    <td className="px-3 py-2">
                      <span className={riskBadgeClasses(event.risk_level)}>
                        <span className="sr-only">Risk level:</span>
                        {event.risk_level}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-200">
                      {event.category}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-200">
                      {event.subject_type}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-300">
                      {event.source}
                    </td>
                    <td className="px-3 py-2 text-xs text-slate-200">
                      {event.explanation_for_humans ?? (
                        <span className="text-slate-500">
                          No additional explanation was provided.
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </main>
  );
}
