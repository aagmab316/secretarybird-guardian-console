import { Link } from "react-router-dom";
import { useApiHealth } from "../system/hooks/useApiHealth";
import { FirewallEventsPanel } from "../firewall/components/FirewallEventsPanel";

export function ExamplePage() {
  const { data, loading, errorExplanation } = useApiHealth();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-slate-50">
        Guardian Operator Dashboard
      </h1>
      <p className="text-sm text-slate-300 max-w-xl">
        This is a placeholder screen for the Secretarybird Guardian Console.
        From here we&apos;ll add case lists, firewall events, and escalation
        tools for operators. Everything should stay calm, clear, and
        trauma-informed.
      </p>

      {/* API Health Check */}
      <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <h2 className="text-sm font-semibold text-slate-200">
          Guardian API status
        </h2>

        {loading && (
          <p className="mt-2 text-sm text-slate-400">
            Checking connection to the Guardian backend…
          </p>
        )}

        {!loading && data && (
          <p className="mt-2 text-sm text-emerald-300">
            ✓ Connected · status: {data.status}
            {data.version ? ` · v${data.version}` : null}
          </p>
        )}

        {!loading && errorExplanation && (
          <p className="mt-2 text-sm text-amber-300">{errorExplanation}</p>
        )}
      </section>

      {/* Firewall Events Demo Panel */}
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <h2 className="mb-3 text-sm font-semibold text-slate-200">
            Demo Household Protection Events
          </h2>
          <FirewallEventsPanel householdId="demo-household" />
          <div className="mt-4">
            <Link
              to="/households/demo-household/firewall"
              className="text-xs text-emerald-400 hover:text-emerald-300 underline"
            >
              View full protection log →
            </Link>
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <h2 className="text-sm font-semibold text-slate-200 mb-3">
              Cases Overview
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              Active cases requiring attention and monitoring.
            </p>
            <Link
              to="/cases"
              className="inline-flex items-center rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-medium text-slate-950 hover:bg-emerald-400"
            >
              View all cases
            </Link>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <p className="text-xs font-medium text-slate-200 mb-2">
              Next steps
            </p>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-[11px] text-slate-300">
              <li>Monitor firewall protection events for households</li>
              <li>Review and manage open cases</li>
              <li>Record risk observations and assessments</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

