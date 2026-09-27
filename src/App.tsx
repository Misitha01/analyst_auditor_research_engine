import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.tsx';
import { ResearchStudio } from './components/ResearchStudio.tsx';
import { ClaimsAuditorView } from './components/ClaimsAuditorView.tsx';
import { SourcesEvidenceView } from './components/SourcesEvidenceView.tsx';
import { MemoryGraphView } from './components/MemoryGraphView.tsx';
import { TraceView } from './components/TraceView.tsx';
import { MetricsDashboard } from './components/MetricsDashboard.tsx';
import { EvaluationSuiteView } from './components/EvaluationSuiteView.tsx';
import { AdversarialResilienceView } from './components/AdversarialResilienceView.tsx';
import { ResearchSession, ResearchMode, EntityMemory, EvalResult } from './types/index.ts';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('studio');
  const [currentSession, setCurrentSession] = useState<ResearchSession | null>(null);
  const [sessions, setSessions] = useState<ResearchSession[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [entities, setEntities] = useState<EntityMemory[]>([]);
  const [evalResults, setEvalResults] = useState<EvalResult[]>([]);
  const [isEvalRunning, setIsEvalRunning] = useState<boolean>(false);

  // Fetch memory entities and existing sessions on mount
  useEffect(() => {
    fetchMemory();
    fetchLatestEvaluation();
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/research');
      if (res.ok) {
        const data = await res.json();
        const list = Array.isArray(data) ? data : [];
        setSessions(list);
        if (!currentSession && list.length > 0) {
          setCurrentSession(list[0]);
        }
      }
    } catch (err) {
      console.warn('Sessions fetch error:', err);
    }
  };

  const fetchMemory = async () => {
    try {
      const res = await fetch('/api/memory');
      if (res.ok) {
        const data = await res.json();
        setEntities(data.entities || []);
      }
    } catch (err) {
      console.warn('Memory fetch error:', err);
    }
  };

  const fetchLatestEvaluation = async () => {
    try {
      const res = await fetch('/api/evaluation');
      if (res.ok) {
        const data = await res.json();
        if (data.latestResults && data.latestResults.length > 0) {
          setEvalResults(data.latestResults);
        }
      }
    } catch (err) {
      console.warn('Evaluation fetch error:', err);
    }
  };

  const handleRunResearch = async (question: string, mode: ResearchMode) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, mode, maxRevisionLoops: 2 }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to execute research');
      }

      const session: ResearchSession = await res.json();
      setCurrentSession(session);
      // Refresh memory entities as new verified facts may have been ingested
      await fetchMemory();
      await fetchSessions();
    } catch (err: any) {
      console.error('Research error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetMemory = async () => {
    try {
      const res = await fetch('/api/memory/reset', { method: 'POST' });
      if (res.ok) {
        await fetchMemory();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleRunEvaluationSuite = async () => {
    setIsEvalRunning(true);
    try {
      const res = await fetch('/api/evaluation/run', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setEvalResults(data.results || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsEvalRunning(false);
    }
  };

  const handleRunAdversarial = async () => {
    const res = await fetch('/api/adversarial/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (!res.ok) throw new Error('Adversarial experiment failed');
    return await res.json();
  };

  const handleRunResilience = async () => {
    const res = await fetch('/api/resilience/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    if (!res.ok) throw new Error('Resilience simulation failed');
    const data = await res.json();
    return data.report;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        entityCount={entities.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'studio' && (
          <ResearchStudio
            session={currentSession}
            sessions={sessions}
            isLoading={isLoading}
            onRunResearch={handleRunResearch}
            onSelectSession={(s) => setCurrentSession(s)}
            onNewSession={() => setCurrentSession(null)}
            onNavigateToTab={setActiveTab}
          />
        )}

        {activeTab === 'claims' && (
          <ClaimsAuditorView
            claims={currentSession?.claims || []}
            sources={currentSession?.sources || []}
            evidence={currentSession?.evidence || []}
          />
        )}

        {activeTab === 'sources' && (
          <SourcesEvidenceView
            sources={currentSession?.sources || []}
            evidence={currentSession?.evidence || []}
          />
        )}

        {activeTab === 'memory' && (
          <MemoryGraphView
            entities={entities}
            onResetMemory={handleResetMemory}
            onRefreshMemory={fetchMemory}
          />
        )}

        {activeTab === 'trace' && (
          <TraceView trace={currentSession?.trace || []} />
        )}

        {activeTab === 'metrics' && (
          <MetricsDashboard metrics={currentSession?.metrics || null} />
        )}

        {activeTab === 'eval' && (
          <EvaluationSuiteView
            questions={[]}
            results={evalResults}
            isRunning={isEvalRunning}
            onRunSuite={handleRunEvaluationSuite}
          />
        )}

        {activeTab === 'adversarial' && (
          <AdversarialResilienceView
            onRunAdversarial={handleRunAdversarial}
            onRunResilience={handleRunResilience}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        VeritasAI Research &amp; Audit Engine • Problem 3 Implementation • Asynchronous Parallel Execution • ₹ INR Cost Metering
      </footer>
    </div>
  );
}
