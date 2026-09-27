import React, { useState } from 'react';
import {
  Layers,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Info,
  ChevronDown,
  ChevronRight,
  Filter,
  UserCheck,
  Brain,
  Search,
  Globe,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';
import { TraceEvent } from '../types/index.ts';

interface TraceViewProps {
  trace: TraceEvent[];
}

export const TraceView: React.FC<TraceViewProps> = ({ trace }) => {
  const [filterAgent, setFilterAgent] = useState<string>('ALL');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    const next = new Set(expandedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedIds(next);
  };

  const expandAll = () => {
    setExpandedIds(new Set(trace.map(t => t.id)));
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  const filteredTrace = filterAgent === 'ALL'
    ? trace
    : trace.filter(t => t.agent === filterAgent);

  const getAgentIcon = (agent: string) => {
    switch (agent) {
      case 'Planner':
        return <Brain className="w-4 h-4 text-purple-400" />;
      case 'SearchWorker':
        return <Search className="w-4 h-4 text-cyan-400" />;
      case 'Analyst':
        return <UserCheck className="w-4 h-4 text-blue-400" />;
      case 'Auditor':
        return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      case 'MemorySystem':
        return <Globe className="w-4 h-4 text-amber-400" />;
      case 'Supervisor':
      default:
        return <RotateCcw className="w-4 h-4 text-indigo-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <span className="w-2 h-2 rounded-full bg-emerald-400"></span>;
      case 'warning':
        return <span className="w-2 h-2 rounded-full bg-amber-400"></span>;
      case 'error':
        return <span className="w-2 h-2 rounded-full bg-rose-400"></span>;
      default:
        return <span className="w-2 h-2 rounded-full bg-slate-400"></span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center">
            <Layers className="w-5 h-5 mr-2 text-indigo-400" />
            Full Agent Observability &amp; Execution Trace
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Transparent chronological record of every decision, search dispatch, source parse, claim audit, and revision loop.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={expandAll}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors"
          >
            Collapse All
          </button>
        </div>
      </div>

      {/* Filter by Agent */}
      <div className="flex items-center space-x-1 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-500 mr-2 flex items-center">
          <Filter className="w-3 h-3 mr-1" /> Filter Agent:
        </span>
        {['ALL', 'Planner', 'SearchWorker', 'Analyst', 'Auditor', 'Supervisor', 'MemorySystem'].map((ag) => (
          <button
            key={ag}
            onClick={() => setFilterAgent(ag)}
            className={`px-3 py-1 rounded-lg transition-colors whitespace-nowrap ${
              filterAgent === ag
                ? 'bg-indigo-600 text-white font-medium'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {ag}
          </button>
        ))}
      </div>

      {trace.length === 0 ? (
        <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 text-sm">
          No trace events recorded yet. Run a research query in Research Studio.
        </div>
      ) : (
        <div className="relative pl-6 space-y-4 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-800">
          {filteredTrace.map((event) => {
            const isExpanded = expandedIds.has(event.id);

            return (
              <div key={event.id} className="relative group">
                {/* Node icon */}
                <div className="absolute -left-6 top-3 w-6 h-6 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center -translate-x-1/2 shadow-sm group-hover:border-indigo-500 transition-colors">
                  {getStatusBadge(event.status)}
                </div>

                {/* Event Card */}
                <div className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl p-4 shadow-sm transition-all space-y-2">
                  <div
                    onClick={() => toggleExpand(event.id)}
                    className="flex items-center justify-between cursor-pointer select-none"
                  >
                    <div className="flex items-center space-x-2.5">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                      <div className="flex items-center space-x-2">
                        {getAgentIcon(event.agent)}
                        <span className="font-semibold text-xs text-white">{event.agent}</span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800 uppercase">
                        {event.phase.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center space-x-3 text-xs font-mono text-slate-400">
                      <span className="text-cyan-400">{event.durationMs}ms</span>
                      <span className="text-slate-500 text-[10px]">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-300 font-medium pl-6">
                    {event.title}
                  </p>

                  {/* Expanded JSON Inspector */}
                  {isExpanded && event.details && (
                    <div className="mt-3 pl-6 pt-2 border-t border-slate-800/80">
                      <pre className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] font-mono text-slate-400 overflow-x-auto max-h-64 leading-relaxed">
                        {JSON.stringify(event.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
