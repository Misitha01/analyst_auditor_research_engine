import React from 'react';
import { ShieldCheck, Cpu, Database, IndianRupee, Layers } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  entityCount: number;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, entityCount }) => {
  const tabs = [
    { id: 'studio', label: 'Research Studio', icon: Layers },
    { id: 'claims', label: 'Claim Auditor', icon: ShieldCheck },
    { id: 'sources', label: 'Evidence & Sources', icon: Cpu },
    { id: 'memory', label: 'Persistent Memory', icon: Database, badge: entityCount },
    { id: 'trace', label: 'Trace & Observability', icon: Layers },
    { id: 'metrics', label: 'Cost & Latency (₹)', icon: IndianRupee },
    { id: 'eval', label: '8-Question Benchmark', icon: ShieldCheck },
    { id: 'adversarial', label: 'Adversarial & Resilience', icon: ShieldCheck },
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Subtitle */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl font-bold tracking-tight text-white">VeritasAI</span>
                <span className="px-2 py-0.5 text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded">
                  Analyst &amp; Auditor v1.0
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Independent Claim Verification • Entity Memory • Contradiction Resolution
              </p>
            </div>
          </div>

          {/* Quick Badges */}
          <div className="hidden lg:flex items-center space-x-2.5 text-xs">
            <div className="flex items-center space-x-1.5 px-3 py-1 bg-blue-500/10 border border-blue-500/30 rounded-full text-blue-300">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span>Google Search Grounding: <strong className="text-white">gemini-3.5-flash</strong></span>
            </div>
            <div className="flex items-center space-x-1.5 px-3 py-1 bg-slate-800/80 border border-slate-700/60 rounded-full text-slate-300">
              <Database className="w-3.5 h-3.5 text-cyan-400" />
              <span>Memory: <strong className="text-slate-100">{entityCount} Entities</strong></span>
            </div>
            <div className="flex items-center space-x-1.5 px-3 py-1 bg-slate-800/80 border border-slate-700/60 rounded-full text-slate-300">
              <IndianRupee className="w-3.5 h-3.5 text-amber-400" />
              <span>INR (₹86.5/$)</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 overflow-x-auto py-2 scrollbar-none border-t border-slate-800/50">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-150 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${isActive ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-800 text-slate-400'}`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
