import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  AlertCircle,
  Link,
  BookOpen,
  Filter
} from 'lucide-react';
import { Claim, Source, Evidence } from '../types/index.ts';

interface ClaimsAuditorViewProps {
  claims: Claim[];
  sources: Source[];
  evidence: Evidence[];
}

export const ClaimsAuditorView: React.FC<ClaimsAuditorViewProps> = ({ claims, sources, evidence }) => {
  const [filterVerdict, setFilterVerdict] = useState<string>('ALL');
  const [selectedClaim, setSelectedClaim] = useState<Claim | null>(claims[0] || null);

  const filteredClaims = filterVerdict === 'ALL'
    ? claims
    : claims.filter(c => c.verdict === filterVerdict);

  const sourceMap = new Map(sources.map(s => [s.id, s]));
  const evidenceMap = new Map(evidence.map(e => [e.id, e]));

  const getVerdictBadge = (verdict: string) => {
    switch (verdict) {
      case 'SUPPORTED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> SUPPORTED
          </span>
        );
      case 'UNSUPPORTED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5 mr-1" /> UNSUPPORTED
          </span>
        );
      case 'CONTRADICTED':
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5 mr-1" /> CONTRADICTED
          </span>
        );
      case 'UNCITED':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-500/10 text-slate-400 border border-slate-500/20">
            <AlertCircle className="w-3.5 h-3.5 mr-1" /> UNCITED
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center">
            <ShieldCheck className="w-5 h-5 mr-2 text-indigo-400" />
            Independent Claim Verification Console
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Strict CLAIM → EVIDENCE → SOURCE forensic lineage. The Auditor never trusts the Analyst and verifies raw source text.
          </p>
        </div>

        {/* Filter Buttons */}
        <div className="flex items-center space-x-1.5 bg-slate-950 p-1 border border-slate-800 rounded-xl text-xs">
          <span className="text-slate-500 px-2 flex items-center">
            <Filter className="w-3 h-3 mr-1" /> Filter:
          </span>
          {['ALL', 'SUPPORTED', 'UNSUPPORTED', 'CONTRADICTED', 'UNCITED'].map((v) => (
            <button
              key={v}
              onClick={() => setFilterVerdict(v)}
              className={`px-2.5 py-1 rounded-lg transition-colors ${
                filterVerdict === v
                  ? 'bg-indigo-600 text-white font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {claims.length === 0 ? (
        <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 text-sm">
          No claims available yet. Run a research question from the Research Studio first.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Claims List */}
          <div className="lg:col-span-5 space-y-2.5">
            {filteredClaims.map((claim) => {
              const isSelected = selectedClaim?.id === claim.id;
              return (
                <div
                  key={claim.id}
                  onClick={() => setSelectedClaim(claim)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-800/90 border-indigo-500 shadow-md ring-1 ring-indigo-500/30'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="font-mono text-xs font-bold text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {claim.id}
                    </span>
                    {getVerdictBadge(claim.verdict)}
                  </div>
                  <p className="text-xs text-slate-200 line-clamp-3 font-medium leading-relaxed">
                    {claim.text}
                  </p>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/60 pt-2">
                    <span>
                      Citations: {claim.citedSourceIds.map(s => `[${s}]`).join(', ') || 'None'}
                    </span>
                    <span className="text-slate-500 font-mono">
                      Conf: {Math.round(claim.confidence * 100)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Deep Lineage Inspector */}
          <div className="lg:col-span-7">
            {selectedClaim ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 sticky top-24">
                <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                  <div>
                    <span className="font-mono text-xs text-indigo-400 font-semibold block">
                      DEEP FORENSIC CLAIM AUDIT • {selectedClaim.id}
                    </span>
                    <h3 className="text-base font-bold text-white mt-1">
                      {selectedClaim.text}
                    </h3>
                  </div>
                  {getVerdictBadge(selectedClaim.verdict)}
                </div>

                {/* Independent Auditor Assessment */}
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Auditor Agent Independent Rationale:
                  </span>
                  <p className="text-xs text-slate-200 leading-relaxed">
                    {selectedClaim.auditorReasoning || 'Auditor verified factual entailment directly from raw source material.'}
                  </p>
                </div>

                {/* Corroborating Raw Source Quote */}
                {selectedClaim.independentSourceQuote && (
                  <div className="p-4 bg-emerald-950/20 border border-emerald-500/20 rounded-xl space-y-1.5">
                    <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider block">
                      Corroborating Verbatim Source Text:
                    </span>
                    <blockquote className="text-xs text-emerald-200 italic pl-3 border-l-2 border-emerald-500/50">
                      &ldquo;{selectedClaim.independentSourceQuote}&rdquo;
                    </blockquote>
                  </div>
                )}

                {/* Contradiction Analysis Drawer if present */}
                {selectedClaim.contradictionDetails && (
                  <div className="p-4 bg-amber-950/20 border border-amber-500/30 rounded-xl space-y-3">
                    <div className="flex items-center space-x-2 text-amber-400 text-xs font-bold uppercase tracking-wider">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Source Conflict &amp; Resolution Analysis:</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                        <span className="font-mono text-indigo-400 font-semibold">{selectedClaim.contradictionDetails.sourceA.id}:</span>
                        <p className="text-slate-300 mt-1 font-medium">{selectedClaim.contradictionDetails.sourceA.quoteOrValue}</p>
                      </div>
                      <div className="p-2.5 bg-slate-900 rounded-lg border border-slate-800">
                        <span className="font-mono text-indigo-400 font-semibold">{selectedClaim.contradictionDetails.sourceB.id}:</span>
                        <p className="text-slate-300 mt-1 font-medium">{selectedClaim.contradictionDetails.sourceB.quoteOrValue}</p>
                      </div>
                    </div>
                    <div className="text-xs text-slate-300 space-y-1">
                      <p><strong className="text-slate-200">Investigation:</strong> {selectedClaim.contradictionDetails.investigation}</p>
                      <p><strong className="text-emerald-400">Resolution:</strong> {selectedClaim.contradictionDetails.resolution}</p>
                    </div>
                  </div>
                )}

                {/* Evidence & Source Lineage Cards */}
                <div className="space-y-3 pt-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Connected Primary Source Lineage:
                  </span>
                  {selectedClaim.citedSourceIds.map((sid) => {
                    const src = sourceMap.get(sid);
                    if (!src) return null;
                    return (
                      <div key={sid} className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-start justify-between gap-3 text-xs">
                        <div className="space-y-1">
                          <div className="flex items-center space-x-2">
                            <span className="font-mono text-indigo-400 font-bold">[{src.id}]</span>
                            <span className="font-semibold text-slate-200">{src.title}</span>
                          </div>
                          <span className="text-slate-400 block truncate max-w-md">{src.url}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Domain: {src.domain} • Quality: {src.qualityScore}/100 • Type: {src.sourceType}
                          </span>
                        </div>
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs flex items-center flex-shrink-0"
                        >
                          <Link className="w-3 h-3 mr-1" /> View Source
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 text-sm">
                Select a claim on the left to inspect its deep verification lineage.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
