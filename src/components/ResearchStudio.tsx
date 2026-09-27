import React, { useState, useEffect } from 'react';
import {
  Search,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Clock,
  IndianRupee,
  RefreshCw,
  ExternalLink,
  BookOpen,
  CheckCircle2,
  XCircle,
  AlertCircle,
  History,
  ChevronDown,
  Plus,
  PanelLeftOpen,
  PanelLeftClose,
  Calendar
} from 'lucide-react';
import { ResearchSession, ResearchMode } from '../types/index.ts';
import { EVALUATION_QUESTIONS } from '../constants/evaluationQuestions.ts';

interface ResearchStudioProps {
  session: ResearchSession | null;
  sessions?: ResearchSession[];
  isLoading: boolean;
  onRunResearch: (question: string, mode: ResearchMode) => Promise<void>;
  onSelectSession?: (session: ResearchSession) => void;
  onNewSession?: () => void;
  onSelectClaim?: (claimId: string) => void;
  onNavigateToTab: (tab: string) => void;
}

export const ResearchStudio: React.FC<ResearchStudioProps> = ({
  session,
  sessions = [],
  isLoading,
  onRunResearch,
  onSelectSession,
  onNewSession,
  onNavigateToTab,
}) => {
  const [question, setQuestion] = useState(session?.question || '');
  const [mode, setMode] = useState<ResearchMode>(session?.mode || 'standard');
  const [activeVersion, setActiveVersion] = useState<'final' | 'initial' | number>('final');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Sync question and mode when active session changes
  useEffect(() => {
    if (session) {
      setQuestion(session.question);
      setMode(session.mode);
      setActiveVersion('final');
    }
  }, [session?.id]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;
    onRunResearch(question.trim(), mode);
  };

  const selectPreset = (q: string) => {
    setQuestion(q);
  };

  const handleSelectSession = (s: ResearchSession) => {
    if (onSelectSession) {
      onSelectSession(s);
    }
    setQuestion(s.question);
    setMode(s.mode);
    setIsDropdownOpen(false);
  };

  const handleNewSession = () => {
    if (onNewSession) {
      onNewSession();
    }
    setQuestion('');
    setIsDropdownOpen(false);
  };

  const getVerdictBadge = (verdict: string) => {
    switch (verdict) {
      case 'SUPPORTED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3 mr-1" /> SUPPORTED
          </span>
        );
      case 'UNSUPPORTED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3 h-3 mr-1" /> UNSUPPORTED
          </span>
        );
      case 'CONTRADICTED':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3 h-3 mr-1" /> CONTRADICTED
          </span>
        );
      case 'UNCITED':
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            <AlertCircle className="w-3 h-3 mr-1" /> UNCITED
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Session Navigation & Quick Switcher Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 shadow-sm">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
              isSidebarOpen
                ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
            }`}
            title="Toggle Sessions History Sidebar"
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="w-3.5 h-3.5 mr-1.5" />
            ) : (
              <PanelLeftOpen className="w-3.5 h-3.5 mr-1.5" />
            )}
            <span>History ({sessions.length})</span>
          </button>

          {/* Sessions Dropdown Switcher */}
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="inline-flex items-center px-3 py-1.5 bg-slate-950 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors"
            >
              <History className="w-3.5 h-3.5 mr-1.5 text-cyan-400" />
              <span className="max-w-[240px] sm:max-w-xs truncate">
                {session ? session.question : 'Select past research session...'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 ml-1.5 text-slate-400" />
            </button>

            {isDropdownOpen && (
              <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl py-2 z-50 max-h-80 overflow-y-auto">
                <div className="px-3 py-1.5 border-b border-slate-800 flex items-center justify-between text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                  <span>Recent Research Sessions ({sessions.length})</span>
                  <button
                    onClick={handleNewSession}
                    className="text-indigo-400 hover:text-indigo-300 flex items-center normal-case font-normal"
                  >
                    <Plus className="w-3 h-3 mr-0.5" /> New Question
                  </button>
                </div>

                {sessions.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    No stored research sessions yet.
                  </div>
                ) : (
                  sessions.map((s) => {
                    const isCurrent = session?.id === s.id;
                    const passRate = s.claims.length > 0
                      ? Math.round((s.metrics.claimsSupported / s.claims.length) * 100)
                      : 100;

                    return (
                      <button
                        key={s.id}
                        onClick={() => handleSelectSession(s)}
                        className={`w-full text-left px-3.5 py-2.5 hover:bg-slate-800/80 border-b border-slate-800/40 transition-colors flex flex-col space-y-1 ${
                          isCurrent ? 'bg-indigo-950/40 border-l-2 border-indigo-500' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-200 truncate pr-2" title={s.question}>
                            {s.question}
                          </span>
                          <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20 whitespace-nowrap">
                            {passRate}% pass
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <span>
                            {new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • ₹{s.metrics.estimatedCostInr.toFixed(3)}
                          </span>
                          <span className="text-slate-500">
                            {s.claims.length} claims • {s.sources.length} sources
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        {/* Action Button: Clear/New Session */}
        <button
          onClick={handleNewSession}
          className="inline-flex items-center px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors"
        >
          <Plus className="w-3.5 h-3.5 mr-1 text-emerald-400" />
          <span>New Research</span>
        </button>
      </div>

      {/* Main Grid: Sidebar + Research Content */}
      <div className={`grid grid-cols-1 ${isSidebarOpen ? 'lg:grid-cols-12 gap-6' : ''}`}>
        {/* Left Sidebar of Stored Sessions */}
        {isSidebarOpen && (
          <aside className="lg:col-span-4 space-y-3 bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl h-fit max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <History className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  Stored Research Sessions
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                {sessions.length} items
              </span>
            </div>

            {sessions.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No past sessions stored yet.
              </div>
            ) : (
              <div className="space-y-2">
                {sessions.map((s) => {
                  const isCurrent = session?.id === s.id;
                  const passRate = s.claims.length > 0
                    ? Math.round((s.metrics.claimsSupported / s.claims.length) * 100)
                    : 100;

                  return (
                    <div
                      key={s.id}
                      onClick={() => handleSelectSession(s)}
                      className={`p-3 rounded-xl border cursor-pointer transition-all space-y-1.5 ${
                        isCurrent
                          ? 'bg-slate-800/90 border-indigo-500 shadow-md ring-1 ring-indigo-500/30'
                          : 'bg-slate-950 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1.5">
                        <h4 className="text-xs font-semibold text-slate-200 line-clamp-2" title={s.question}>
                          {s.question}
                        </h4>
                        <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20 whitespace-nowrap">
                          {passRate}%
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-800/50">
                        <span>₹{s.metrics.estimatedCostInr.toFixed(3)} INR</span>
                        <span>{(s.metrics.timeSpent.totalMs / 1000).toFixed(1)}s</span>
                      </div>

                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span className="capitalize">{s.mode.replace('_', ' ')}</span>
                        <span>{new Date(s.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </aside>
        )}

        {/* Right Main Panel */}
        <div className={`space-y-6 ${isSidebarOpen ? 'lg:col-span-8' : 'w-full'}`}>
          {/* Search Input Box & Mode Select */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Search className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    placeholder="Ask an open-ended research question (e.g. Warby Parker store counts, Stripe 2021 vs 2023 valuation...)"
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all"
                    disabled={isLoading}
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading || !question.trim()}
                  className="inline-flex items-center justify-center px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-xl shadow-lg shadow-indigo-600/30 transition-all duration-150 whitespace-nowrap"
                >
                  {isLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Orchestrating Agents...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Investigate &amp; Audit
                    </>
                  )}
                </button>
              </div>

              {/* Mode Selector */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
                <div className="flex items-center space-x-2">
                  <span className="text-slate-400 font-medium">Research Mode:</span>
                  <div className="inline-flex p-1 bg-slate-950 border border-slate-800 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setMode('standard')}
                      className={`px-3 py-1 rounded-md transition-all ${
                        mode === 'standard'
                          ? 'bg-indigo-600 text-white font-medium shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Standard Dual-Agent
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('adversarial_unaware')}
                      className={`px-3 py-1 rounded-md transition-all ${
                        mode === 'adversarial_unaware'
                          ? 'bg-indigo-600 text-white font-medium shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Condition 1: Analyst has no knowledge that an Auditor will inspect its work"
                    >
                      Adversarial: Unaware
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('adversarial_audited')}
                      className={`px-3 py-1 rounded-md transition-all ${
                        mode === 'adversarial_audited'
                          ? 'bg-indigo-600 text-white font-medium shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Condition 2: Analyst is explicitly warned that every claim is audited"
                    >
                      Adversarial: Hostile Audit
                    </button>
                  </div>
                </div>

                <div className="text-slate-500">
                  Auto-revises up to 2 loops on audit failure
                </div>
              </div>
            </form>

            {/* Benchmark Quick Pick Badges */}
            <div className="mt-5 pt-4 border-t border-slate-800/60">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center justify-between">
                <span>Benchmark Preset Questions:</span>
                <button
                  onClick={() => onNavigateToTab('eval')}
                  className="text-indigo-400 hover:text-indigo-300 font-normal lowercase flex items-center"
                >
                  view all 8 benchmark tests <ArrowRight className="w-3 h-3 ml-1" />
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {EVALUATION_QUESTIONS.slice(0, 5).map((q) => (
                  <button
                    key={q.id}
                    onClick={() => selectPreset(q.question)}
                    className="text-left px-2.5 py-1 bg-slate-950/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-lg text-xs transition-colors truncate max-w-xs"
                    title={q.question}
                  >
                    <span className="text-indigo-400 font-mono mr-1">[{q.category.replace('_', ' ')}]</span>
                    {q.question}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Loading State Banner */}
          {isLoading && (
            <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-xl space-y-4 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 rounded-full bg-indigo-500 animate-ping"></div>
                  <h3 className="text-base font-semibold text-white">Autonomous Agents at Work...</h3>
                </div>
                <span className="text-xs font-mono text-indigo-400">Executing Parallel Retrieval &amp; Independent Verification</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                <div className="bg-gradient-to-r from-indigo-500 via-cyan-400 to-emerald-400 h-2 w-3/4 rounded-full animate-[shimmer_2s_infinite]"></div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-slate-400 pt-2">
                <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">1. Strategic Planning</div>
                <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">2. Parallel Search &amp; Fetch</div>
                <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">3. Analyst Synthesis</div>
                <div className="p-2 bg-slate-950 rounded-lg border border-slate-800">4. Independent Claim Audit</div>
              </div>
            </div>
          )}

          {/* Results View */}
          {session && !isLoading && (
            <div className="space-y-6">
              {/* Executive Metrics Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
                  <span className="text-slate-400 text-xs block mb-1">Audit Score</span>
                  <div className="flex items-baseline space-x-1.5">
                    <span className="text-xl font-bold text-emerald-400">
                      {session.claims.length > 0
                        ? Math.round((session.metrics.claimsSupported / session.claims.length) * 100)
                        : 100}%
                    </span>
                    <span className="text-xs text-slate-500">pass rate</span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
                  <span className="text-slate-400 text-xs block mb-1">Claims Audited</span>
                  <div className="flex items-baseline space-x-1.5">
                    <span className="text-xl font-bold text-white">{session.claims.length}</span>
                    <span className="text-xs text-emerald-400">{session.metrics.claimsSupported} supp.</span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
                  <span className="text-slate-400 text-xs block mb-1">Auditor Catches</span>
                  <div className="flex items-baseline space-x-1.5">
                    <span className={`text-xl font-bold ${session.metrics.auditorCatchesCount > 0 ? 'text-amber-400' : 'text-slate-400'}`}>
                      {session.metrics.auditorCatchesCount}
                    </span>
                    <span className="text-xs text-slate-500">{session.metrics.revisionCount} revisions</span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
                  <span className="text-slate-400 text-xs block mb-1">Total Cost (INR)</span>
                  <div className="flex items-baseline space-x-1">
                    <IndianRupee className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-xl font-bold text-amber-400">
                      {session.metrics.estimatedCostInr.toFixed(3)}
                    </span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
                  <span className="text-slate-400 text-xs block mb-1">Latency</span>
                  <div className="flex items-baseline space-x-1.5">
                    <span className="text-xl font-bold text-white">
                      {(session.metrics.timeSpent.totalMs / 1000).toFixed(1)}s
                    </span>
                    <span className="text-xs text-cyan-400">{session.metrics.parallelismSpeedupFactor}x speedup</span>
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5">
                  <span className="text-slate-400 text-xs block mb-1">Sources Retrieved</span>
                  <div className="flex items-baseline space-x-1.5">
                    <span className="text-xl font-bold text-white">{session.sources.length}</span>
                    <span className="text-xs text-slate-500">{session.metrics.memoryHitsCount} mem hits</span>
                  </div>
                </div>
              </div>

              {/* Research Plan & Memory Hits Drawer */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-slate-200 flex items-center">
                    <BookOpen className="w-4 h-4 mr-2 text-indigo-400" /> Research Strategy &amp; Entity Decomposition
                  </h3>
                  <span className="text-xs text-slate-400">
                    Strategy: <strong className="text-slate-300">{session.plan.searchStrategy}</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <span className="font-semibold text-slate-400 block uppercase tracking-wider text-[10px]">Target Entities</span>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {session.plan.targetEntities.map((ent, i) => (
                        <span key={i} className="px-2 py-0.5 bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 rounded">
                          {ent.name} <span className="text-slate-500 text-[10px]">({ent.type})</span>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <span className="font-semibold text-slate-400 block uppercase tracking-wider text-[10px]">Parallel Queries</span>
                    <ul className="list-disc list-inside text-slate-300 space-y-0.5 pt-1">
                      {session.plan.queries.map((q, i) => (
                        <li key={i} className="truncate" title={q}>{q}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                    <span className="font-semibold text-slate-400 block uppercase tracking-wider text-[10px]">Persistent Memory Reused</span>
                    {session.plan.memoryHits && session.plan.memoryHits.length > 0 ? (
                      <div className="space-y-1 pt-1">
                        {session.plan.memoryHits.map((m, i) => (
                          <span key={i} className="block text-emerald-400 font-medium truncate">
                            • {m.entityName} ({m.matchedFacts?.length || 0} prior facts retrieved)
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-slate-500 pt-1 italic">No prior memory used; fresh web retrieval required.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Main Analyst Answer & Revision View */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
                  <div>
                    <h2 className="text-lg font-bold text-white flex items-center">
                      <ShieldCheck className="w-5 h-5 mr-2 text-indigo-400" />
                      Analyst Synthesized Research Report
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Verified against {session.sources.length} sources • Grounded with {session.evidence.length} evidence quotes
                    </p>
                  </div>

                  {/* Revision history selector if revisions occurred */}
                  {session.revisions.length > 0 && (
                    <div className="flex items-center space-x-1 bg-slate-950 p-1 border border-slate-800 rounded-lg text-xs">
                      <button
                        onClick={() => setActiveVersion('initial')}
                        className={`px-2.5 py-1 rounded transition-colors ${
                          activeVersion === 'initial' ? 'bg-amber-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Draft 1 (Pre-Audit)
                      </button>
                      <button
                        onClick={() => setActiveVersion('final')}
                        className={`px-2.5 py-1 rounded transition-colors ${
                          activeVersion === 'final' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        Final Report (Rev {session.revisions.length})
                      </button>
                    </div>
                  )}
                </div>

                {/* Revision Alert Banner if revised */}
                {session.revisions.length > 0 && activeVersion === 'final' && (
                  <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-xs text-indigo-300 flex items-start space-x-2">
                    <RefreshCw className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <strong>Auditor Auto-Revision Applied:</strong> The Auditor identified{' '}
                      {session.metrics.auditorCatchesCount} claim discrepancies in initial draft. The Analyst executed targeted delta research, corrected unsupported assertions, and passed re-audit.
                    </div>
                  </div>
                )}

                {/* Report Content */}
                <div className="prose prose-invert max-w-none text-slate-200 text-sm leading-relaxed whitespace-pre-line bg-slate-950/60 p-5 rounded-xl border border-slate-800/80 font-sans">
                  {activeVersion === 'initial' ? session.analystAnswer : session.finalAnswer}
                </div>

                {/* Cited Sources Quick Strip */}
                <div className="pt-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                    Referenced Primary &amp; Verified Sources:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {session.sources.map((s) => (
                      <a
                        key={s.id}
                        href={s.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center px-3 py-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-lg text-xs text-slate-300 hover:text-white transition-colors group"
                      >
                        <span className="font-mono text-indigo-400 font-semibold mr-1.5">[{s.id}]</span>
                        <span className="truncate max-w-[200px]">{s.title}</span>
                        <ExternalLink className="w-3 h-3 ml-1.5 text-slate-500 group-hover:text-indigo-400" />
                      </a>
                    ))}
                  </div>
                </div>
              </div>

              {/* Atomic Claims Audit Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-base font-bold text-white flex items-center">
                      <ShieldCheck className="w-4.5 h-4.5 mr-2 text-emerald-400" />
                      Claim-by-Claim Forensic Audit (CLAIM → EVIDENCE → SOURCE)
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Every factual claim evaluated against raw source text by the independent Auditor Agent
                    </p>
                  </div>
                  <button
                    onClick={() => onNavigateToTab('claims')}
                    className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center font-medium"
                  >
                    Deep audit breakdown <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </button>
                </div>

                <div className="divide-y divide-slate-800/80">
                  {session.claims.map((claim) => (
                    <div key={claim.id} className="py-3.5 space-y-2">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                        <div className="flex items-start space-x-2">
                          <span className="font-mono text-xs font-semibold text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded">
                            {claim.id}
                          </span>
                          <p className="text-xs font-medium text-slate-100">{claim.text}</p>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          {claim.citedSourceIds.map((sid) => (
                            <span key={sid} className="px-1.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded font-mono text-[10px]">
                              [{sid}]
                            </span>
                          ))}
                          {getVerdictBadge(claim.verdict)}
                        </div>
                      </div>

                      {/* Independent Source Corroboration Quote */}
                      {claim.independentSourceQuote && (
                        <div className="pl-6 border-l-2 border-slate-700 text-[11px] text-slate-400 italic">
                          Corroborating Source Quote: &ldquo;{claim.independentSourceQuote}&rdquo;
                        </div>
                      )}

                      {/* Auditor Reasoning */}
                      <div className="pl-6 text-[11px] text-slate-400">
                        <strong className="text-slate-300">Auditor Assessment:</strong> {claim.auditorReasoning}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
