import React, { useState } from 'react';
import {
  ExternalLink,
  Award,
  Layers,
  FileText,
  Clock,
  CheckCircle,
  Copy,
  Check
} from 'lucide-react';
import { Source, Evidence } from '../types/index.ts';

interface SourcesEvidenceViewProps {
  sources: Source[];
  evidence: Evidence[];
}

export const SourcesEvidenceView: React.FC<SourcesEvidenceViewProps> = ({ sources, evidence }) => {
  const [selectedSource, setSelectedSource] = useState<Source | null>(sources[0] || null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const getSourceTypeBadge = (type: string) => {
    switch (type) {
      case 'primary':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase">Primary Source</span>;
      case 'journalism':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 uppercase">Reputable News</span>;
      case 'industry':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-400 border border-purple-500/30 uppercase">Industry Tracker</span>;
      case 'secondary':
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500/15 text-slate-400 border border-slate-500/30 uppercase">Secondary Web</span>;
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center">
            <Award className="w-5 h-5 mr-2 text-indigo-400" />
            Live Retrieved Sources &amp; Evidence Repository
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Deduplicated web pages, domain quality ratings, and exact quotes extracted for claim grounding.
          </p>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-300">
            Total Sources: <strong className="text-white">{sources.length}</strong>
          </span>
          <span className="px-3 py-1 bg-slate-950 border border-slate-800 rounded-lg text-slate-300">
            Quotes Extracted: <strong className="text-white">{evidence.length}</strong>
          </span>
        </div>
      </div>

      {sources.length === 0 ? (
        <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-2xl text-slate-500 text-sm">
          No sources retrieved yet. Submit a question in Research Studio.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sources List */}
          <div className="lg:col-span-5 space-y-3">
            {sources.map((src) => {
              const isSelected = selectedSource?.id === src.id;
              const attachedEvidence = evidence.filter(e => e.sourceId === src.id);

              return (
                <div
                  key={src.id}
                  onClick={() => setSelectedSource(src)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-slate-800/90 border-indigo-500 shadow-md ring-1 ring-indigo-500/30'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                        [{src.id}]
                      </span>
                      {getSourceTypeBadge(src.sourceType)}
                      {src.isGoogleGrounded && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-cyan-300 border border-cyan-500/30 uppercase">
                          Google Grounded
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1.5 text-xs font-semibold text-slate-300">
                      <span>Score:</span>
                      <span className={`px-1.5 py-0.5 rounded ${src.qualityScore >= 85 ? 'text-emerald-400 bg-emerald-500/10' : 'text-amber-400 bg-amber-500/10'}`}>
                        {src.qualityScore}/100
                      </span>
                    </div>
                  </div>

                  <h4 className="text-xs font-bold text-white line-clamp-2 mb-1">{src.title}</h4>
                  <p className="text-[11px] text-slate-400 truncate mb-2">{src.url}</p>

                  <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-800/60 pt-2 font-mono">
                    <span>Fetch: {src.fetchLatencyMs}ms ({src.fetchStatus})</span>
                    <span>{attachedEvidence.length} quotes</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Source & Extracted Evidence Details */}
          <div className="lg:col-span-7">
            {selectedSource ? (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 sticky top-24">
                <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-xs text-indigo-400 font-bold">[{selectedSource.id}]</span>
                      {getSourceTypeBadge(selectedSource.sourceType)}
                      <span className="text-xs text-slate-400 font-mono">Domain: {selectedSource.domain}</span>
                    </div>
                    <h3 className="text-base font-bold text-white mt-1">
                      {selectedSource.title}
                    </h3>
                  </div>
                  <a
                    href={selectedSource.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition-colors"
                  >
                    Open URL <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                  </a>
                </div>

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-slate-500 text-[10px] block uppercase">Quality Rating</span>
                    <span className="font-bold text-slate-200 mt-0.5 block">{selectedSource.qualityScore} / 100</span>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-slate-500 text-[10px] block uppercase">Publication Date</span>
                    <span className="font-medium text-slate-200 mt-0.5 block">{selectedSource.publicationDate || 'Undated / Live Web'}</span>
                  </div>
                  <div className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-slate-500 text-[10px] block uppercase">Fetch Latency</span>
                    <span className="font-mono text-cyan-400 mt-0.5 block">{selectedSource.fetchLatencyMs} ms</span>
                  </div>
                </div>

                {/* Extracted Evidence Quotes from this Source */}
                <div className="space-y-3">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                    Extracted Verbatim Evidence ({evidence.filter(e => e.sourceId === selectedSource.id).length}):
                  </span>
                  {evidence.filter(e => e.sourceId === selectedSource.id).length === 0 ? (
                    <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-500">
                      No standalone quotes extracted from this source; used for background context.
                    </div>
                  ) : (
                    evidence.filter(e => e.sourceId === selectedSource.id).map((ev) => (
                      <div key={ev.id} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-mono font-bold text-indigo-400">{ev.id}</span>
                          {ev.temporalValidity && (
                            <span className="text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                              Validity: {ev.temporalValidity}
                            </span>
                          )}
                        </div>
                        <blockquote className="text-xs text-slate-200 italic pl-3 border-l-2 border-indigo-500">
                          &ldquo;{ev.exactQuote}&rdquo;
                        </blockquote>
                        <p className="text-[11px] text-slate-400">
                          <strong className="text-slate-300">Context:</strong> {ev.context}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {/* Raw Content Excerpt */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      Parsed Source Text Excerpt:
                    </span>
                    <button
                      onClick={() => copyToClipboard(selectedSource.fullText, selectedSource.id)}
                      className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center"
                    >
                      {copiedId === selectedSource.id ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
                      Copy Raw Text
                    </button>
                  </div>
                  <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400 font-mono whitespace-pre-wrap max-h-60 overflow-y-auto leading-relaxed">
                    {selectedSource.fullText || selectedSource.snippet || 'No text content available.'}
                  </pre>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
};
