import React, { useState } from 'react';
import {
  ShieldAlert,
  Play,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  Cpu,
  IndianRupee,
  LifeBuoy
} from 'lucide-react';
import { AdversarialComparison, ResilienceReportItem } from '../constants/evaluationQuestions.ts';

interface AdversarialResilienceViewProps {
  onRunAdversarial: () => Promise<AdversarialComparison>;
  onRunResilience: () => Promise<ResilienceReportItem[]>;
}

export const AdversarialResilienceView: React.FC<AdversarialResilienceViewProps> = ({
  onRunAdversarial,
  onRunResilience,
}) => {
  const [adversarialResult, setAdversarialResult] = useState<AdversarialComparison | null>(null);
  const [resilienceReport, setResilienceReport] = useState<ResilienceReportItem[] | null>(null);
  const [isAdvRunning, setIsAdvRunning] = useState(false);
  const [isResRunning, setIsResRunning] = useState(false);

  const handleRunAdversarial = async () => {
    setIsAdvRunning(true);
    try {
      const res = await onRunAdversarial();
      setAdversarialResult(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAdvRunning(false);
    }
  };

  const handleRunResilience = async () => {
    setIsResRunning(true);
    try {
      const res = await onRunResilience();
      setResilienceReport(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsResRunning(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* ------------------------------------------------------------- */}
      {/* SECTION 1: Adversarial Experiment (Condition A vs Condition B) */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-bold text-white">
                Adversarial Experiment: Auditor-Unaware vs Hostile-Audited Analyst
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Measures behavioral shift when the Analyst Agent knows in advance that an independent Auditor Agent will scrutinize every sentence versus when it operates unmonitored.
            </p>
          </div>

          <button
            onClick={handleRunAdversarial}
            disabled={isAdvRunning}
            className="inline-flex items-center justify-center px-4 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-amber-600/30 transition-all whitespace-nowrap"
          >
            {isAdvRunning ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Running Dual Trials...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" /> Execute Adversarial Comparison
              </>
            )}
          </button>
        </div>

        {adversarialResult ? (
          <div className="space-y-6">
            {/* Side-by-Side Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Condition A: Unaware */}
              <div className="p-5 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-rose-400">
                    Condition A: Analyst Unaware of Auditor
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20 font-mono">
                    Baseline
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">Unsupported Claims</span>
                    <span className="text-base font-bold text-rose-400">
                      {adversarialResult.unaware.claimsUnsupported}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">Uncited Claims</span>
                    <span className="text-base font-bold text-amber-400">
                      {adversarialResult.unaware.claimsUncited}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">Citation Density</span>
                    <span className="text-base font-bold text-slate-200">
                      {adversarialResult.unaware.citationsPer100Words} / 100w
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">Cost (INR)</span>
                    <span className="text-base font-bold text-amber-400">
                      ₹{adversarialResult.unaware.costInr.toFixed(3)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Condition B: Audited */}
              <div className="p-5 bg-slate-950 rounded-xl border border-indigo-500/40 space-y-3 ring-1 ring-indigo-500/20">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Condition B: Explicit Auditor Awareness
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                    Audited
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">Unsupported Claims</span>
                    <span className="text-base font-bold text-emerald-400">
                      {adversarialResult.audited.claimsUnsupported} (0%)
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">Uncited Claims</span>
                    <span className="text-base font-bold text-emerald-400">
                      {adversarialResult.audited.claimsUncited} (0%)
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">Citation Density</span>
                    <span className="text-base font-bold text-cyan-400">
                      {adversarialResult.audited.citationsPer100Words} / 100w
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-slate-500 text-[10px] block">Cost (INR)</span>
                    <span className="text-base font-bold text-amber-400">
                      ₹{adversarialResult.audited.costInr.toFixed(3)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Delta Comparison Box */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 flex flex-wrap items-center justify-around gap-4 text-xs font-mono">
              <div className="flex items-center space-x-2">
                <TrendingDown className="w-4 h-4 text-emerald-400" />
                <span className="text-slate-400">Unsupported Claims Reduction:</span>
                <strong className="text-emerald-400">
                  -{adversarialResult.delta.unsupportedReduction} claims
                </strong>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span className="text-slate-400">Citation Density Surge:</span>
                <strong className="text-cyan-400">
                  +{adversarialResult.delta.citationDensityIncrease} cit/100w
                </strong>
              </div>
              <div className="flex items-center space-x-2">
                <IndianRupee className="w-4 h-4 text-amber-400" />
                <span className="text-slate-400">Delta Cost:</span>
                <strong className="text-slate-200">
                  ₹{adversarialResult.delta.costDifferenceInr.toFixed(4)}
                </strong>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-10 bg-slate-950 rounded-xl border border-slate-800 text-slate-500 text-xs">
            Click &ldquo;Execute Adversarial Comparison&rdquo; to test Condition A vs Condition B.
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------- */}
      {/* SECTION 2: Failure Injection & Resilience Suite */}
      {/* ------------------------------------------------------------- */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center space-x-2">
              <LifeBuoy className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-bold text-white">
                Failure Injection &amp; Graceful Resilience Suite
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Simulates broken HTTP 404s, search timeouts, syndicated duplicate sources, conflicting data numbers, and uncited claims to prove fault tolerance.
            </p>
          </div>

          <button
            onClick={handleRunResilience}
            disabled={isResRunning}
            className="inline-flex items-center justify-center px-4 py-2.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-cyan-600/30 transition-all whitespace-nowrap"
          >
            {isResRunning ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Simulating Injections...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" /> Run 5 Resilience Injection Tests
              </>
            )}
          </button>
        </div>

        {resilienceReport ? (
          <div className="space-y-3">
            {resilienceReport.map((test, idx) => (
              <div key={idx} className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center">
                    <CheckCircle2 className="w-4 h-4 mr-1.5 text-emerald-400" /> {test.testName}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    RECOVERED &amp; LOGGED
                  </span>
                </div>
                <div className="text-slate-400">
                  <strong className="text-slate-300">Failure Injected:</strong> {test.injectedFailure}
                </div>
                <div className="text-slate-300">
                  <strong className="text-slate-200">System Behavior:</strong> {test.behavior}
                </div>
                <div className="p-2 bg-slate-900 rounded border border-slate-800/80 font-mono text-[11px] text-cyan-400 truncate">
                  Trace: {test.recoveryTrace}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 bg-slate-950 rounded-xl border border-slate-800 text-slate-500 text-xs">
            Click &ldquo;Run 5 Resilience Injection Tests&rdquo; to simulate live network failures, broken links, and audit interventions.
          </div>
        )}
      </div>
    </div>
  );
};
