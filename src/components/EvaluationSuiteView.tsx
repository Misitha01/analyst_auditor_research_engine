import React, { useState } from 'react';
import {
  ShieldCheck,
  Play,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  IndianRupee,
  Clock,
  Database,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { EvalQuestion, EvalResult } from '../types/index.ts';
import { EVALUATION_QUESTIONS } from '../constants/evaluationQuestions.ts';

interface EvaluationSuiteViewProps {
  questions: EvalQuestion[];
  results: EvalResult[];
  isRunning: boolean;
  onRunSuite: () => Promise<void>;
  onSelectSession?: (sessionId: string) => void;
}

export const EvaluationSuiteView: React.FC<EvaluationSuiteViewProps> = ({
  questions = EVALUATION_QUESTIONS,
  results,
  isRunning,
  onRunSuite,
  onSelectSession,
}) => {
  const [selectedQuestion, setSelectedQuestion] = useState<EvalQuestion | null>(questions[0] || null);

  const totalCostInr = results.reduce((acc, r) => acc + r.costInr, 0);
  const avgLatency = results.length > 0
    ? Math.round(results.reduce((acc, r) => acc + r.latencyMs, 0) / results.length)
    : 0;
  const totalClaims = results.reduce((acc, r) => acc + r.claimsTotal, 0);
  const totalSupported = results.reduce((acc, r) => acc + r.claimsSupported, 0);
  const avgScore = results.length > 0
    ? Math.round(results.reduce((acc, r) => acc + r.score, 0) / results.length)
    : 0;
  const memoryReusedCount = results.filter(r => r.memoryReused).length;

  return (
    <div className="space-y-6">
      {/* Top Banner & Run Button */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-6 h-6 text-indigo-400" />
            <h2 className="text-lg font-bold text-white">8-Question Benchmark Evaluation Suite</h2>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              Rigorous Test Harness
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Evaluates factual accuracy, contradiction detection, persistent memory reuse (Q6 → Q7), source quality, latency, and ₹ INR costs across 8 progressively harder research scenarios.
          </p>
        </div>

        <button
          onClick={onRunSuite}
          disabled={isRunning}
          className="inline-flex items-center justify-center px-5 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 transition-all duration-150 whitespace-nowrap"
        >
          {isRunning ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Executing Evaluation Suite...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 mr-2" />
              Run 8-Question Benchmark
            </>
          )}
        </button>
      </div>

      {/* Aggregate KPI Strip */}
      {results.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
            <span className="text-slate-400 text-xs block mb-1">Average Score</span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-bold text-emerald-400">{avgScore}%</span>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
            <span className="text-slate-400 text-xs block mb-1">Claims Audited</span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-bold text-white">{totalSupported}/{totalClaims}</span>
              <span className="text-xs text-emerald-400">
                {totalClaims > 0 ? Math.round((totalSupported / totalClaims) * 100) : 0}%
              </span>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
            <span className="text-slate-400 text-xs block mb-1">Memory Reused</span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-bold text-cyan-400">{memoryReusedCount} tests</span>
              <span className="text-xs text-slate-500">Q6→Q7</span>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
            <span className="text-slate-400 text-xs block mb-1">Total Benchmark Cost</span>
            <div className="flex items-baseline space-x-1">
              <IndianRupee className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-2xl font-bold text-amber-400">₹{totalCostInr.toFixed(3)}</span>
            </div>
          </div>
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
            <span className="text-slate-400 text-xs block mb-1">Avg Latency</span>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-2xl font-bold text-white">{(avgLatency / 1000).toFixed(1)}s</span>
            </div>
          </div>
        </div>
      )}

      {/* Results Scorecard Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white">Benchmark Execution Scorecard</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-950/80 border-b border-slate-800">
              <tr>
                <th className="py-3 px-3">ID &amp; Category</th>
                <th className="py-3 px-3">Research Question</th>
                <th className="py-3 px-3">Claims (Supp/Total)</th>
                <th className="py-3 px-3">Catches</th>
                <th className="py-3 px-3">Revisions</th>
                <th className="py-3 px-3">Memory Reused</th>
                <th className="py-3 px-3">Cost (₹)</th>
                <th className="py-3 px-3">Latency</th>
                <th className="py-3 px-3">Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {questions.map((q) => {
                const res = results.find(r => r.questionId === q.id);

                return (
                  <tr key={q.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="font-bold text-indigo-400">{q.id}</span>
                      <span className="block text-[10px] text-slate-500 font-sans">{q.category.replace(/_/g, ' ')}</span>
                    </td>
                    <td className="py-3 px-3 font-sans text-slate-200 max-w-xs truncate" title={q.question}>
                      {q.question}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {res ? (
                        <span className="text-emerald-400 font-bold">
                          {res.claimsSupported} / {res.claimsTotal}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {res ? (
                        <span className={res.auditorCatches > 0 ? 'text-amber-400 font-bold' : 'text-slate-500'}>
                          {res.auditorCatches}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {res ? (
                        <span className="text-slate-300">{res.revisions}</span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {res ? (
                        res.memoryReused ? (
                          <span className="px-2 py-0.5 rounded text-[10px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                            YES (Memory Hit)
                          </span>
                        ) : (
                          <span className="text-slate-500 text-[10px]">No (Fresh Web)</span>
                        )
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-amber-400">
                      {res ? `₹${res.costInr.toFixed(3)}` : '—'}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-slate-300">
                      {res ? `${(res.latencyMs / 1000).toFixed(1)}s` : '—'}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {res ? (
                        <span className="font-bold text-emerald-400">{res.score}%</span>
                      ) : (
                        <span className="text-slate-600">Pending</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Explanatory Cards on the Benchmark Design */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1.5">
          <span className="font-bold text-white flex items-center">
            <Database className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
            Deliberate Entity Memory Reuse: Q6 → Q7
          </span>
          <p className="text-slate-400 leading-relaxed">
            Question 6 builds persistent knowledge of OpenAI&apos;s 2015 founding structure and early investors (Khosla Ventures). Question 7 asks which early OpenAI investor also funded Stripe. The memory system retrieves Khosla Ventures without issuing redundant searches, demonstrating measurable speedup and search reduction.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-1.5">
          <span className="font-bold text-white flex items-center">
            <AlertTriangle className="w-3.5 h-3.5 mr-1.5 text-amber-400" />
            Contradiction Resolution Benchmark: Q5 (Warby Parker)
          </span>
          <p className="text-slate-400 leading-relaxed">
            Evaluates detection when multiple sources report conflicting store totals (118 corporate stores vs 125 total footprint). Rather than silently guessing, the system flags the contradiction, inspects reporting periods (Q3 vs year-end), and provides an audited reconciliation.
          </p>
        </div>
      </div>
    </div>
  );
};
