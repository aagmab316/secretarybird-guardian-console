import { Link } from "react-router-dom";
import { useApiHealth } from "../system/hooks/useApiHealth";

export function ExamplePage() {
  const { data, loading, errorExplanation } = useApiHealth();

  return (
    <div className="space-y-4">
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

      {/* Firewall Events Demo */}
      <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
        <h2 className="text-sm font-semibold text-slate-200">
          Firewall events (demo)
        </h2>
        <p className="mt-1 text-sm text-slate-400">
          This link opens a demo view of Guardian Firewall decisions for a
          sample household. Once real households are wired in, the IDs here
          will come from the backend.
        </p>
        <div className="mt-3">
          <Link
            to="/households/demo-household/firewall"
            className="inline-flex items-center rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-medium text-slate-950 hover:bg-emerald-400"
          >
            View firewall events for demo household
          </Link>
        </div>
      </section>

      {/* Next Steps */}
      <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4 text-sm text-slate-200">
        <p className="font-medium">Next steps</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-300">
          <li>Wire this dashboard to the Guardian API.</li>
          <li>Add navigation for Cases, Households, and Firewall Events.</li>
          <li>Apply the full Secretarybird branding and layout shell.</li>
        </ul>
      </div>
    </div>
  );
}
