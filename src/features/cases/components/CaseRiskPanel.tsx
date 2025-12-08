import { useState } from "react";
import { useCaseRiskObservation } from "../hooks/useCaseRiskObservation";

interface CaseRiskPanelProps {
  caseId: number;
}

/**
 * CaseRiskPanel
 *
 * Displays and manages risk observations for a case in a tabbed interface.
 * Operators can:
 * - View existing observations organized by category
 * - Record new narrative-driven risk assessments
 * - See governance explanations for system decisions
 *
 * The panel follows the Guardian Console's trauma-informed design principles.
 */
export function CaseRiskPanel({ caseId }: CaseRiskPanelProps) {
  const {
    observations,
    state,
    errorMessage,
    governanceExplanation,
    recording,
    recordError,
    recordObservation,
  } = useCaseRiskObservation(caseId);

  const [narrative, setNarrative] = useState("");
  const [riskSignal, setRiskSignal] = useState(3);
  const [activeTab, setActiveTab] = useState<"observations" | "record">(
    "observations",
  );

  async function handleRecordObservation() {
    if (!narrative.trim()) return;

    await recordObservation(narrative, riskSignal);

    if (recordError === null) {
      setNarrative("");
      setRiskSignal(3);
      setActiveTab("observations");
    }
  }

  // Group observations by category
  const observationsByCategory = observations.reduce(
    (acc: Record<string, typeof observations>, obs) => {
      const category = obs.category || "uncategorized";
      if (!acc[category]) acc[category] = [];
      acc[category].push(obs);
      return acc;
    },
    {},
  );

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/50 shadow-sm">
      {/* Header */}
      <div className="border-b border-slate-700 px-6 py-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-200">
          Risk Assessment & Observations
        </h2>
        <p className="mt-1 text-xs text-slate-400">
          Track narrative-driven risk signals and safety assessments.
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-700 px-6">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab("observations")}
            className={`py-3 px-1 text-xs font-medium uppercase tracking-wide transition-colors ${
              activeTab === "observations"
                ? "border-b-2 border-emerald-500 text-emerald-300"
                : "text-slate-400 hover:text-slate-300"
            }`}
          >
            Observations ({observations.length})
          </button>
          <button
            onClick={() => setActiveTab("record")}
            className={`py-3 px-1 text-xs font-medium uppercase tracking-wide transition-colors ${
              activeTab === "record"
                ? "border-b-2 border-emerald-500 text-emerald-300"
                : "text-slate-400 hover:text-slate-300"
            }`}
          >
            Record New
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6 text-sm text-slate-200">
        {/* Observations Tab */}
        {activeTab === "observations" && (
          <div className="space-y-4">
            {state === "loading" && (
              <p className="text-slate-400">Loading observations…</p>
            )}

            {state === "error" && (
              <div className="space-y-2">
                <p className="text-red-400">{errorMessage}</p>
                {governanceExplanation && (
                  <div className="rounded bg-slate-800/50 border border-slate-700 p-3 text-xs text-slate-300">
                    <p className="font-medium text-slate-400 mb-1">
                      System note:
                    </p>
                    <p>{governanceExplanation}</p>
                  </div>
                )}
              </div>
            )}

            {state === "success" && observations.length === 0 && (
              <p className="text-slate-400 italic">
                No observations recorded yet. Start by recording your first
                risk assessment.
              </p>
            )}

            {state === "success" && observations.length > 0 && (
              <div className="space-y-4">
                {Object.entries(observationsByCategory).map(
                  ([category, obs]) => (
                    <div key={category} className="space-y-2">
                      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        {category}
                      </h3>
                      <div className="space-y-2">
                      {obs.map((observation) => (
                        <div
                          key={observation.id}
                          className="rounded border border-slate-700 bg-slate-900/40 p-3"
                        >
                          <div className="flex items-start justify-between gap-3 mb-2">
                            <p className="text-sm text-slate-200">
                              {observation.narrative}
                            </p>
                            <span className="inline-flex items-center rounded-full bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-300 flex-shrink-0">
                              {observation.risk_signal_strength}/5
                            </span>
                          </div>
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-xs text-slate-500">
                                {new Date(
                                  observation.created_at,
                                ).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                              {observation.created_by && (
                                <p className="text-xs text-slate-500">
                                  by {observation.created_by}
                                </p>
                              )}
                            </div>
                            {observation.explanation_for_humans && (
                              <div className="mt-2 rounded bg-slate-800/50 border border-slate-700 p-2 text-xs text-slate-300">
                                <p className="font-medium text-slate-400 mb-1">
                                  Governance note:
                                </p>
                                <p>{observation.explanation_for_humans}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </div>
        )}

        {/* Record Tab */}
        {activeTab === "record" && (
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-400">
                Risk Narrative
              </label>
              <textarea
                value={narrative}
                onChange={(e) => setNarrative(e.target.value)}
                disabled={recording}
                placeholder="Describe the observed risk signal, context, and any safety concerns. Be specific and factual."
                className="w-full rounded border border-slate-700 bg-slate-800/50 px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 disabled:opacity-50"
                rows={5}
              />
              <p className="text-xs text-slate-500">
                Your narrative will be recorded in the case audit trail.
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-medium uppercase tracking-wide text-slate-400">
                Risk Signal Strength
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  min="0"
                  max="5"
                  value={riskSignal}
                  onChange={(e) => setRiskSignal(parseInt(e.target.value))}
                  disabled={recording}
                  className="flex-1"
                />
                <span className="inline-flex items-center rounded-full bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-300 min-w-fit">
                  {riskSignal}/5
                </span>
              </div>
              <p className="text-xs text-slate-500">
                0 = minimal concern · 5 = immediate risk
              </p>
            </div>

            {recordError && (
              <div className="rounded bg-red-900/20 border border-red-800 p-3 text-sm text-red-400">
                <p className="font-medium">Error recording observation:</p>
                <p>{recordError}</p>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleRecordObservation}
                disabled={recording || !narrative.trim()}
                className="inline-flex items-center rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-slate-950 hover:bg-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {recording ? "Recording…" : "Record Observation"}
              </button>
              <button
                onClick={() => {
                  setNarrative("");
                  setRiskSignal(3);
                }}
                disabled={recording}
                className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-900 px-4 py-2 text-sm font-medium text-slate-100 hover:bg-slate-800 disabled:opacity-50"
              >
                Clear
              </button>
            </div>

            <div className="rounded bg-slate-800/30 border border-slate-700 p-3 text-xs text-slate-400 leading-relaxed">
              <p className="font-medium text-slate-300 mb-2">
                Guidelines for recording observations:
              </p>
              <ul className="list-disc space-y-1 pl-5">
                <li>
                  Be specific: describe what you observed, not your
                  interpretation
                </li>
                <li>Include relevant context and timeline</li>
                <li>Note any immediate safety concerns</li>
                <li>
                  All observations are reviewed by supervisors and documented
                  in the audit trail
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
