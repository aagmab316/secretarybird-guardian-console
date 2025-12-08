import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, Case } from "../../../lib/api";
import { CaseRiskPanel } from "../components/CaseRiskPanel";

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
 * CaseRiskTabPage
 *
 * Dedicated page for case risk assessment and observations.
 * Useful for:
 * - Escalated events requiring deep risk review
 * - Long-term monitoring dashboards
 * - Risk trend analysis
 *
 * This is the optional enhanced view for cases with higher complexity.
 */
export function CaseRiskTabPage() {
  const { caseId } = useParams<{ caseId: string }>();
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [state, setState] = useState<LoadState>("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [governanceExplanation, setGovernanceExplanation] =
    useState<string | null>(null);

  useEffect(() => {
    if (!caseId) {
      setState("error");
      setErrorMessage("No case ID provided.");
      return;
    }

    const parsedId = parseInt(caseId, 10);
    if (isNaN(parsedId)) {
      setState("error");
      setErrorMessage("Invalid case ID format.");
      return;
    }

    let cancelled = false;

    async function loadCase() {
      setState("loading");
      setErrorMessage(null);
      setGovernanceExplanation(null);

      const res = await api.getCase(parsedId);

      if (cancelled) return;

      if (!res.ok) {
        const fallback =
          "We couldn't load this case. Try again or contact a supervisor.";

        setState("error");
        setErrorMessage(fallback);

        const explanation =
          res.error?.explanation_for_humans ?? res.error?.message ?? null;

        if (explanation) {
          setGovernanceExplanation(explanation);
        }

        return;
      }

      setCaseData(res.data);
      setState("success");
    }

    loadCase();

    return () => {
      cancelled = true;
    };
  }, [caseId]);

  if (state === "loading") {
    return (
      <div className="space-y-4">
        <Link
          to={`/cases/${caseId}`}
          className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm font-medium text-slate-100 hover:bg-slate-800"
        >
          ← Back to case details
        </Link>
        <p className="text-slate-400">Loading case…</p>
      </div>
    );
  }

  if (state === "error" || !caseData) {
    return (
      <div className="space-y-4">
        <Link
          to="/cases"
          className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm font-medium text-slate-100 hover:bg-slate-800"
        >
          ← Back to cases
        </Link>
        <div className="rounded-xl border border-red-800 bg-red-900/20 p-6">
          <h2 className="text-sm font-semibold text-red-300 mb-2">
            Unable to load case
          </h2>
          <p className="text-sm text-red-200">{errorMessage}</p>
          {governanceExplanation && (
            <div className="mt-4 rounded bg-slate-800/50 border border-slate-700 p-3 text-xs text-slate-300">
              <p className="font-medium text-slate-400 mb-1">System note:</p>
              <p>{governanceExplanation}</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const priority = priorityFromRisk(caseData.risk_level);
  const statusLabel = statusLabels[caseData.status] || caseData.status;

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Risk Assessment Tab
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-50">
              {caseData.title}
            </h1>
            <p className="text-sm text-slate-400">
              Case ID <span className="font-mono font-medium">#{caseData.id}</span>
            </p>
          </div>

          <Link
            to={`/cases/${caseData.id}`}
            className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm font-medium text-slate-100 hover:bg-slate-800"
          >
            ← Back to case details
          </Link>
        </div>

        {/* Status badges */}
        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-200">
            {caseData.category}
          </span>
          <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border ${priorityColor(
              caseData.risk_level,
            )}`}
          >
            {priority} Priority
          </span>
          <span className="inline-flex items-center rounded-full bg-emerald-900/30 px-3 py-1 text-xs font-medium text-emerald-300 border border-emerald-800">
            {statusLabel}
          </span>
        </div>
      </header>

      {/* Info panel */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-slate-700 bg-slate-900/50 shadow-sm p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-200 mb-3">
            Case Summary
          </h3>
          <p className="text-sm leading-relaxed text-slate-300">
            {caseData.description ||
              "No summary provided yet. The intake process is in progress."}
          </p>
        </div>

        <div className="rounded-xl border border-slate-700 bg-slate-900/50 shadow-sm p-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-200 mb-3">
            Case Metadata
          </h3>
          <dl className="space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <dt className="text-slate-400">Risk Level</dt>
              <dd className="font-medium text-slate-200">{caseData.risk_level}/5</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-400">Status</dt>
              <dd className="font-medium text-slate-200">{statusLabel}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-400">Created</dt>
              <dd className="font-medium text-slate-200">
                {new Date(caseData.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-400">Updated</dt>
              <dd className="font-medium text-slate-200">
                {new Date(caseData.updated_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Risk Panel - Full Width */}
      {caseId && <CaseRiskPanel caseId={parseInt(caseId, 10)} />}
    </div>
  );
}
