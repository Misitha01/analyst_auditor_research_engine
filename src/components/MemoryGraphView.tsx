import React, { useState, useEffect } from 'react';
import {
  Database,
  Search,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Building,
  User,
  DollarSign,
  Globe,
  Tag,
  Share2,
  Calendar
} from 'lucide-react';
import { EntityMemory } from '../types/index.ts';

interface MemoryGraphViewProps {
  entities: EntityMemory[];
  onResetMemory: () => Promise<void>;
  onRefreshMemory: () => Promise<void>;
}

export const MemoryGraphView: React.FC<MemoryGraphViewProps> = ({
  entities,
  onResetMemory,
  onRefreshMemory,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntity, setSelectedEntity] = useState<EntityMemory | null>(entities[0] || null);

  useEffect(() => {
    if (!selectedEntity && entities.length > 0) {
      setSelectedEntity(entities[0]);
    }
  }, [entities, selectedEntity]);

  const filteredEntities = entities.filter(e =>
    e.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.entityType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.facts.some(f => f.key.toLowerCase().includes(searchTerm.toLowerCase()) || f.value.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getEntityTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'company':
      case 'organization':
        return <Building className="w-4 h-4 text-cyan-400" />;
      case 'person':
        return <User className="w-4 h-4 text-purple-400" />;
      case 'investor':
      case 'funding_round':
        return <DollarSign className="w-4 h-4 text-emerald-400" />;
      case 'location':
        return <Globe className="w-4 h-4 text-blue-400" />;
      default:
        return <Tag className="w-4 h-4 text-indigo-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center">
            <Database className="w-5 h-5 mr-2 text-cyan-400" />
            Cross-Session Persistent Entity Memory
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Stores verified entities, structural facts, funding rounds, and relational graphs across sessions to eliminate redundant searches.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onResetMemory}
            className="inline-flex items-center px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-colors"
            title="Reset persistent store to seed state"
          >
            <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Reset to Seed Memory
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Filter entities, facts, or relationships..."
          className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-cyan-500"
        />
      </div>

      {/* Main Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Entity List */}
        <div className="lg:col-span-5 space-y-3">
          {filteredEntities.map((ent) => {
            const isSelected = selectedEntity?.id === ent.id;

            return (
              <div
                key={ent.id}
                onClick={() => setSelectedEntity(ent)}
                className={`p-4 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-slate-800/90 border-cyan-500 shadow-md ring-1 ring-cyan-500/30'
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-850'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center space-x-2">
                    {getEntityTypeIcon(ent.entityType)}
                    <h4 className="text-xs font-bold text-white">{ent.entityName}</h4>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800 uppercase">
                    {ent.entityType}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/60 font-mono">
                  <span>{ent.facts.length} verified facts</span>
                  <span>{ent.relationships.length} relationships</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Entity Knowledge Card */}
        <div className="lg:col-span-7">
          {selectedEntity ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-5 sticky top-24">
              <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    {getEntityTypeIcon(selectedEntity.entityType)}
                    <span className="text-xs font-mono uppercase text-cyan-400 tracking-wider">
                      {selectedEntity.entityType}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white">{selectedEntity.entityName}</h3>
                </div>

                <div className="flex items-center space-x-1.5 text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400 font-semibold">{selectedEntity.auditStatus}</span>
                </div>
              </div>

              {/* Verified Facts */}
              <div className="space-y-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Audited Facts In Store ({selectedEntity.facts.length}):
                </span>
                <div className="space-y-2">
                  {selectedEntity.facts.map((fact, idx) => (
                    <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-300">{fact.key}</span>
                        {fact.date && (
                          <span className="text-[10px] text-slate-500 font-mono flex items-center">
                            <Calendar className="w-3 h-3 mr-1" /> {fact.date}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-200">{fact.value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Knowledge Graph Relationships */}
              {selectedEntity.relationships.length > 0 && (
                <div className="space-y-3 pt-2">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center">
                    <Share2 className="w-3.5 h-3.5 mr-1.5 text-indigo-400" /> Knowledge Graph Connections:
                  </span>
                  <div className="space-y-2">
                    {selectedEntity.relationships.map((rel, idx) => (
                      <div key={idx} className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs flex items-center justify-between">
                        <div>
                          <span className="text-indigo-400 font-semibold">{rel.relation}</span>
                          <span className="mx-2 text-slate-600">→</span>
                          <strong className="text-white">{rel.targetEntity}</strong>
                        </div>
                        {rel.context && (
                          <span className="text-[11px] text-slate-400 italic max-w-xs truncate">{rel.context}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Footnote */}
              <div className="text-[11px] text-slate-500 font-mono pt-3 border-t border-slate-800 flex justify-between">
                <span>Last updated: {new Date(selectedEntity.lastResearched).toLocaleDateString()}</span>
                <span>Sources linked: {selectedEntity.sources.length}</span>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
