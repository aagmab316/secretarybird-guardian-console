import React, { useState } from "react";
import { useCaseRiskObservation } from "../hooks/useCaseRiskObservation";
import type { RiskLevel } from "../../../lib/apiTypes";

interface CaseRiskPanelProps {
  caseId: string;
}

const riskOptions: { value: RiskLevel; label: string }[] = [
  { value: "LOW", label: "Low – monitor" },
  { value: "MEDIUM", label: "Medium – pay close attention" },
  { value: "HIGH", label: "High – urgent concern" },
];

export const CaseRiskPanel: React.FC<CaseRiskPanelProps> = ({ caseId }) => {
  const { observations, loading, saving, error, recordObservation } =
    useCaseRiskObservation(caseId);

  const [narrative, setNarrative] = useState("");
  const [riskLevel, setRiskLevel] = useState<RiskLevel>("LOW");
  const [signalStrength, setSignalStrength] = useState(2); // 0–5
  const [category, setCategory] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!narrative.trim()) return;

    await recordObservation({
      narrative: narrative.trim(),
      risk_level: riskLevel,
      signal_strength: signalStrength,
      category: category || undefined,
    });

    // Clear narrative only; keep chosen risk level
    setNarrative("");
  }

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <header className="mb-3 flex items-center justify-between gap-2">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">
            Case Risk – Human-In-The-Loop Signals
          </h2>
          <p className="text-xs text-slate-500">
            Use this space to record your professional judgement in plain
            language. This supports safer, trauma-informed decisions.
          </p>
        </div>
        {loading && (
          <span className="text-[11px] text-slate-500">Loading…</span>
        )}
      </header>

      {error && (
        <div className="mb-3 rounded-lg border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900">
          {error}
        </div>
      )}

      {/* New observation form */}
      <form
        onSubmit={handleSubmit}
        className="mb-4 space-y-3 rounded-lg border border-slate-100 bg-slate-50 p-3"
      >
        <div className="flex flex-col gap-2 md:flex-row">
          <div className="flex-1">
            <label className="mb-1 block text-[11px] font-medium text-slate-700">
              Narrative (what are you noticing?)
            </label>
            <textarea
              className="w-full rounded-md border border-slate-200 bg-white p-2 text-xs text-slate-800 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300"
              rows={3}
              value={narrative}
              onChange={(e) => setNarrative(e.target.value)}
              placeholder="Describe behaviours, messages, or patterns in calm, non-blaming language…"
            />
          </div>

          <div className="w-full space-y-2 md:w-56">
            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-700">
                Risk level
              </label>
              <select
                className="w-full rounded-md border border-slate-200 bg-white p-1.5 text-xs text-slate-800 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300"
                value={riskLevel}
                onChange={(e) => setRiskLevel(e.target.value as RiskLevel)}
              >
                {riskOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-700">
                Signal strength: {signalStrength} / 5
              </label>
              <input
                type="range"
                min={0}
                max={5}
                value={signalStrength}
                onChange={(e) => setSignalStrength(Number(e.target.value))}
                className="w-full"
              />
              <p className="mt-0.5 text-[10px] text-slate-500">
                0 = very weak signal, 5 = very strong, consistent concern.
              </p>
            </div>

            <div>
              <label className="mb-1 block text-[11px] font-medium text-slate-700">
                Category (optional)
              </label>
              <input
                className="w-full rounded-md border border-slate-200 bg-white p-1.5 text-xs text-slate-800 outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-300"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. SCAM, ABUSE, NEGLECT…"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className="text-[10px] text-slate-500">
            Your observations are logged with time and user ID for governance
            and supervision.
          </p>
          <button
            type="submit"
            disabled={saving || !narrative.trim()}
            className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? "Saving…" : "Record observation"}
          </button>
        </div>
      </form>

      {/* Existing observations list */}
      {!loading && observations.length === 0 && (
        <p className="text-xs text-slate-500">
          No risk observations recorded yet. Start by adding your first
          narrative above.
        </p>
      )}

      {!loading && observations.length > 0 && (
        <div className="max-h-64 space-y-2 overflow-y-auto">
          {observations.map((obs) => (
            <article
              key={obs.id}
              className="rounded-lg border border-slate-100 bg-white p-2.5 text-xs"
            >
              <header className="mb-1 flex items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1">
                  {obs.category && (
                    <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-700">
                      {obs.category}
                    </span>
                  )}
                  <span className="text-[10px] text-slate-400">
                    {new Date(obs.created_at).toLocaleString()}
                  </span>
                </div>
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    obs.risk_level === "HIGH"
                      ? "border border-red-200 bg-red-100 text-red-800"
                      : obs.risk_level === "MEDIUM"
                        ? "border border-amber-200 bg-amber-100 text-amber-800"
                        : "border border-emerald-200 bg-emerald-100 text-emerald-800"
                  }`}
                >
                  {obs.risk_level} • {obs.signal_strength}/5
                </span>
              </header>
              <p className="whitespace-pre-wrap text-[11px] text-slate-800">
                {obs.narrative}
              </p>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};
