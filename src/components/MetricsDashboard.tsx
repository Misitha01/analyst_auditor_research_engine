import React from 'react';
import {
  IndianRupee,
  Clock,
  Cpu,
  Layers,
  Zap,
  BarChart3,
  TrendingDown,
  DollarSign
} from 'lucide-react';
import { ResearchMetrics } from '../types/index.ts';

interface MetricsDashboardProps {
  metrics: ResearchMetrics | null;
}

export const MetricsDashboard: React.FC<MetricsDashboardProps> = ({ metrics }) => {
  if (!metrics) {
    return (
      <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 text-sm">
        No execution metrics recorded yet. Run a research question in Research Studio.
      </div>
    );
  }

  const phaseLatencies = [
    { label: 'Planning & Strategy', ms: metrics.timeSpent.planningMs, color: 'bg-purple-500' },
    { label: 'Search Querying', ms: metrics.timeSpent.searchingMs, color: 'bg-cyan-500' },
    { label: 'Parallel Page Fetching', ms: metrics.timeSpent.fetchingMs, color: 'bg-blue-500' },
    { label: 'Evidence Extraction', ms: metrics.timeSpent.extractingMs, color: 'bg-amber-500' },
    { label: 'Analyst Synthesis', ms: metrics.timeSpent.analystMs, color: 'bg-indigo-500' },
    { label: 'Independent Claim Audit', ms: metrics.timeSpent.auditingMs, color: 'bg-emerald-500' },
    { label: 'Revision Loops', ms: metrics.timeSpent.revisionMs, color: 'bg-rose-500' },
  ];

  const totalTime = Math.max(1, metrics.timeSpent.totalMs);

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <h2 className="text-lg font-bold text-white flex items-center">
          <IndianRupee className="w-5 h-5 mr-2 text-amber-400" />
          Financial &amp; Latency Performance Telemetry
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Detailed token consumption, conversion to Indian Rupees (₹86.5/USD), latency breakdown per pipeline phase, and parallel speedup gains.
        </p>
      </div>

      {/* Main KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cost in Rupees */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2 relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Estimated Cost (INR)</span>
            <IndianRupee className="w-4 h-4 text-amber-400" />
          </div>
          <div className="flex items-baseline space-x-1">
            <span className="text-3xl font-extrabold text-amber-400">₹{metrics.estimatedCostInr.toFixed(4)}</span>
          </div>
          <span className="text-[11px] text-slate-500 block font-mono">
            ${metrics.estimatedCostUsd.toFixed(6)} USD (@ ₹86.5/$)
          </span>
        </div>

        {/* Total Tokens */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Total Tokens Processed</span>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white">
              {metrics.totalTokens.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
            <span>In: {metrics.inputTokens.toLocaleString()}</span>
            <span>Out: {metrics.outputTokens.toLocaleString()}</span>
          </div>
        </div>

        {/* Parallelism Speedup */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Parallelism Speedup</span>
            <Zap className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-emerald-400">
              {metrics.parallelismSpeedupFactor}x
            </span>
            <span className="text-xs text-slate-400">faster than seq</span>
          </div>
          <span className="text-[11px] text-slate-500 block font-mono">
            Async parallel searches &amp; page fetches
          </span>
        </div>

        {/* Total End-to-End Latency */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>End-to-End Wall Clock</span>
            <Clock className="w-4 h-4 text-purple-400" />
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-3xl font-extrabold text-white">
              {(metrics.timeSpent.totalMs / 1000).toFixed(2)}s
            </span>
          </div>
          <span className="text-[11px] text-slate-500 block font-mono">
            Model: {metrics.modelName}
          </span>
        </div>
      </div>

      {/* Latency Waterfall Breakdown */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center">
          <BarChart3 className="w-4 h-4 mr-2 text-indigo-400" />
          Pipeline Phase Latency Distribution (Total: {(metrics.timeSpent.totalMs / 1000).toFixed(2)}s)
        </h3>

        {/* Waterfall Bar */}
        <div className="w-full bg-slate-950 rounded-xl h-4 overflow-hidden flex border border-slate-800">
          {phaseLatencies.map((p, idx) => {
            const pct = Math.max(1, (p.ms / totalTime) * 100);
            return (
              <div
                key={idx}
                style={{ width: `${pct}%` }}
                className={`${p.color} transition-all duration-300`}
                title={`${p.label}: ${p.ms}ms (${pct.toFixed(1)}%)`}
              />
            );
          })}
        </div>

        {/* Legend & Breakdown Table */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
          {phaseLatencies.map((p, idx) => {
            const pct = ((p.ms / totalTime) * 100).toFixed(1);
            return (
              <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${p.color}`}></span>
                  <span className="text-slate-300 font-medium">{p.label}</span>
                </div>
                <div className="text-right font-mono">
                  <span className="text-white font-bold">{p.ms}ms</span>
                  <span className="text-slate-500 ml-1.5 text-[10px]">({pct}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Operations Ledger */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-3">
        <h3 className="text-sm font-bold text-white">System Operations Audit Counter</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-slate-500 text-[10px] block uppercase">Live Search Calls</span>
            <span className="text-lg font-bold text-white mt-0.5 block">{metrics.searchCallsCount}</span>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-slate-500 text-[10px] block uppercase">Web Pages Parsed</span>
            <span className="text-lg font-bold text-white mt-0.5 block">{metrics.pagesFetchedCount}</span>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-slate-500 text-[10px] block uppercase">Claims Evaluated</span>
            <span className="text-lg font-bold text-white mt-0.5 block">{metrics.claimsTotal}</span>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-slate-500 text-[10px] block uppercase">Revision Loops</span>
            <span className="text-lg font-bold text-amber-400 mt-0.5 block">{metrics.revisionCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
