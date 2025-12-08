import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, Case } from "../../../lib/api";

type LoadState = "idle" | "loading" | "success" | "error";

const statusLabels: Record<string, string> = {
  open: "Open",
  in_review: "In Review",
  active: "Active",
  closed: "Closed",
};

const priorityFromRisk = (risk: number): string => {
  if (risk >= 4) return "High";
  if (risk >= 2) return "Medium";
  return "Low";
};

const priorityColor = (risk: number): string => {
  if (risk >= 4) return "bg-red-900/40 text-red-300 border-red-800";
  if (risk >= 2) return "bg-yellow-900/40 text-yellow-300 border-yellow-800";
  return "bg-emerald-900/40 text-emerald-300 border-emerald-800";
};

/**
 * CasesListPage
 *
 * Displays a table of all cases with key metadata:
 * - Case title and ID
 * - Priority and risk level
 * - Status
 * - Creation date
 *
 * Operators can click any case to view full details and manage risk observations.
 */
export function CasesListPage() {
  const [cases, setCases] = useState<Case[]>([]);
  const [state, setState] = useState<LoadState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [governanceExplanation, setGovernanceExplanation] =
    useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadCases() {
      setState("loading");
      setErrorMessage(null);
      setGovernanceExplanation(null);

      const res = await api.listCases();

      if (cancelled) return;

      if (!res.ok) {
        const fallback =
          "We couldn't load the case list. Try again or contact a supervisor.";

        setState("error");
        setErrorMessage(fallback);

        const explanation =
          res.error?.explanation_for_humans ?? res.error?.message ?? null;

        if (explanation) {
          setGovernanceExplanation(explanation);
        }

        return;
      }

      setCases(res.data ?? []);
      setState("success");
    }

    loadCases();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="space-y-2">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
            Care Cases
          </h1>
          <p className="text-sm text-slate-400">
            Live view of active and historic child protection cases.
          </p>
        </div>
      </header>

      {/* Loading state */}
      {state === "loading" && (
        <div className="text-sm text-slate-400">Loading cases…</div>
      )}

      {/* Error state */}
      {state === "error" && (
        <div className="rounded-xl border border-red-800 bg-red-900/20 p-6">
          <h2 className="text-sm font-semibold text-red-300 mb-2">
            Unable to load cases
          </h2>
          <p className="text-sm text-red-200">{errorMessage}</p>
          {governanceExplanation && (
            <div className="mt-4 rounded bg-slate-800/50 border border-slate-700 p-3 text-xs text-slate-300">
              <p className="font-medium text-slate-400 mb-1">System note:</p>
              <p>{governanceExplanation}</p>
            </div>
          )}
        </div>
      )}

      {/* Cases table */}
      {state === "success" && (
        <div className="rounded-xl border border-slate-700 bg-slate-900/50 shadow-sm overflow-hidden">
          {cases.length === 0 ? (
            <div className="p-6 text-center text-slate-400">
              <p className="text-sm">
                No cases found yet. Cases will appear here as they are created.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-700 bg-slate-800/40">
                  <tr>
                    <th className="px-6 py-3 text-left font-medium text-slate-400">
                      Title
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-slate-400">
                      Case ID
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-slate-400">
                      Priority
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-slate-400">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left font-medium text-slate-400">
                      Created
                    </th>
                    <th className="px-6 py-3 text-right font-medium text-slate-400">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {cases.map((c) => {
                    const statusLabel = statusLabels[c.status] || c.status;
                    const priority = priorityFromRisk(c.risk_level);
                    const priorityClass = priorityColor(c.risk_level);

                    return (
                      <tr
                        key={c.id}
                        className="border-b border-slate-700 last:border-b-0 hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="px-6 py-4 font-medium text-slate-100">
                          {c.title}
                        </td>
                        <td className="px-6 py-4 text-slate-400 font-mono text-xs">
                          #{c.id}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium border ${priorityClass}`}
                          >
                            {priority}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-300">
                          {statusLabel}
                        </td>
                        <td className="px-6 py-4 text-slate-400 text-xs">
                          {new Date(c.created_at).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            to={`/cases/${c.id}`}
                            className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-slate-800"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
