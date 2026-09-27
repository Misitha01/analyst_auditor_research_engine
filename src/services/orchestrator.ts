import { plannerAgent } from './plannerAgent.ts';
import { webSearchEngine } from './webSearch.ts';
import { pageFetcher } from './pageFetcher.ts';
import { evidenceExtractor } from './evidenceExtractor.ts';
import { analystAgent } from './analystAgent.ts';
import { auditorAgent } from './auditorAgent.ts';
import { memoryStore } from './memoryStore.ts';
import { geminiService, USD_TO_INR } from './geminiClient.ts';
import {
  ResearchSession,
  ResearchMode,
  TraceEvent,
  Source,
  Evidence,
  Claim,
  RevisionHistoryItem,
  EntityMemory,
  ResearchPlan,
} from '../types/index.ts';

export class ResearchOrchestrator {
  private sessions: Map<string, ResearchSession> = new Map();

  public getSession(id: string): ResearchSession | undefined {
    return this.sessions.get(id);
  }

  public getAllSessions(): ResearchSession[] {
    return Array.from(this.sessions.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public async runResearch(
    question: string,
    mode: ResearchMode = 'standard',
    maxRevisionLoops = 2
  ): Promise<ResearchSession> {
    const sessionId = `res_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const trace: TraceEvent[] = [];
    const startTime = Date.now();

    const timeSpent = {
      planningMs: 0,
      searchingMs: 0,
      fetchingMs: 0,
      extractingMs: 0,
      analystMs: 0,
      auditingMs: 0,
      revisionMs: 0,
      totalMs: 0,
    };

    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let searchCallsCount = 0;
    let pagesFetchedCount = 0;

    const addTrace = (
      phase: TraceEvent['phase'],
      agent: TraceEvent['agent'],
      title: string,
      details: any,
      durationMs: number,
      status: TraceEvent['status'] = 'info'
    ) => {
      trace.push({
        id: `tr_${trace.length + 1}`,
        timestamp: new Date().toISOString(),
        phase,
        agent,
        title,
        details,
        durationMs,
        status,
      });
    };

    addTrace('planning', 'Supervisor', `Research session initiated: "${question}"`, { mode, maxRevisionLoops }, 0, 'info');

    // -------------------------------------------------------------
    // PHASE 1: Planning & Strategy Formulation
    // -------------------------------------------------------------
    const tPlanStart = Date.now();
    const { plan, memoryHits, inputTokens: pIn, outputTokens: pOut } = await plannerAgent.plan(question);
    timeSpent.planningMs = Date.now() - tPlanStart;
    totalInputTokens += pIn;
    totalOutputTokens += pOut;

    addTrace(
      'planning',
      'Planner',
      `Strategy formulated with ${plan.queries.length} queries and ${plan.subQuestions.length} sub-questions`,
      { plan, memoryHitsCount: memoryHits.length },
      timeSpent.planningMs,
      'success'
    );

    // -------------------------------------------------------------
    // PHASE 2: Persistent Memory Retrieval
    // -------------------------------------------------------------
    const tMemStart = Date.now();
    addTrace(
      'memory_lookup',
      'MemorySystem',
      `Retrieved ${memoryHits.length} relevant entity profiles from persistent memory`,
      {
        matchedEntities: memoryHits.map(m => ({
          name: m.entityName,
          factsCount: m.facts.length,
          lastResearched: m.lastResearched,
        })),
      },
      Date.now() - tMemStart,
      memoryHits.length > 0 ? 'success' : 'info'
    );

    // -------------------------------------------------------------
    // PHASE 3: Parallel Web Search & Deduplication
    // -------------------------------------------------------------
    const tSearchStart = Date.now();
    searchCallsCount += plan.queries.length;
    const searchMap = await webSearchEngine.searchParallel(plan.queries);

    let rawSources: Source[] = [];
    for (const [q, srcList] of searchMap.entries()) {
      rawSources.push(...srcList);
    }

    // Deduplicate sources across queries
    const deduplicatedSources = webSearchEngine.deduplicateSources(rawSources);
    // Renumber IDs sequentially S1, S2, ...
    const sources: Source[] = deduplicatedSources.map((s, idx) => ({
      ...s,
      id: `S${idx + 1}`,
    }));

    timeSpent.searchingMs = Date.now() - tSearchStart;
    addTrace(
      'search',
      'SearchWorker',
      `Executed ${plan.queries.length} parallel searches; retrieved ${rawSources.length} sources, deduplicated to ${sources.length}`,
      {
        queries: plan.queries,
        sources: sources.map(s => ({ id: s.id, title: s.title, url: s.url, qualityScore: s.qualityScore, type: s.sourceType })),
      },
      timeSpent.searchingMs,
      'success'
    );

    // -------------------------------------------------------------
    // PHASE 4: Asynchronous Parallel Page Fetching & HTML Parsing
    // -------------------------------------------------------------
    const tFetchStart = Date.now();
    pagesFetchedCount += sources.length;
    const { updatedSources, totalLatencyMs: fetchLatency, sequentialEquivalentMs } = await pageFetcher.fetchSourcesParallel(sources);
    timeSpent.fetchingMs = Date.now() - tFetchStart;

    const parallelismSpeedup = sequentialEquivalentMs > 0 ? Number((sequentialEquivalentMs / Math.max(1, fetchLatency)).toFixed(2)) : 1.0;

    addTrace(
      'fetch',
      'SearchWorker',
      `Fetched and parsed ${updatedSources.length} sources asynchronously (Speedup: ${parallelismSpeedup}x)`,
      {
        totalFetchLatencyMs: fetchLatency,
        sequentialEquivalentMs,
        speedup: `${parallelismSpeedup}x`,
      },
      timeSpent.fetchingMs,
      'success'
    );

    // -------------------------------------------------------------
    // PHASE 5: Evidence Extraction & Contradiction Detection
    // -------------------------------------------------------------
    const tExtractStart = Date.now();
    const { evidence, detectedContradictions, inputTokens: eIn, outputTokens: eOut } = await evidenceExtractor.extractEvidence(
      question,
      updatedSources
    );
    timeSpent.extractingMs = Date.now() - tExtractStart;
    totalInputTokens += eIn;
    totalOutputTokens += eOut;

    addTrace(
      'evidence_extraction',
      'Analyst',
      `Extracted ${evidence.length} evidence items and detected ${detectedContradictions.length} potential contradictions`,
      {
        evidenceCount: evidence.length,
        contradictions: detectedContradictions,
      },
      timeSpent.extractingMs,
      detectedContradictions.length > 0 ? 'warning' : 'success'
    );

    // -------------------------------------------------------------
    // PHASE 6: Analyst Agent Synthesis (Draft 1)
    // -------------------------------------------------------------
    const tAnalystStart = Date.now();
    const analystDraft = await analystAgent.generateAnswer({
      question,
      evidence,
      sources: updatedSources,
      contradictions: detectedContradictions,
      memoryHits,
      mode,
    });
    timeSpent.analystMs = Date.now() - tAnalystStart;
    totalInputTokens += analystDraft.inputTokens;
    totalOutputTokens += analystDraft.outputTokens;

    addTrace(
      'analyst_draft',
      'Analyst',
      `Synthesized draft answer (${analystDraft.answer.length} chars, cited sources: ${analystDraft.citedSourceIds.join(', ') || 'None'})`,
      { citedSourceIds: analystDraft.citedSourceIds, draftLength: analystDraft.answer.length },
      timeSpent.analystMs,
      'success'
    );

    // -------------------------------------------------------------
    // PHASE 7: Claim Decomposition
    // -------------------------------------------------------------
    const tDecompStart = Date.now();
    const { claims: rawClaims, inputTokens: cdIn, outputTokens: cdOut } = await auditorAgent.extractClaims(analystDraft.answer);
    totalInputTokens += cdIn;
    totalOutputTokens += cdOut;

    addTrace(
      'claim_extraction',
      'Auditor',
      `Decomposed draft answer into ${rawClaims.length} atomic factual claims`,
      { claimsCount: rawClaims.length },
      Date.now() - tDecompStart,
      'info'
    );

    // -------------------------------------------------------------
    // PHASE 8: Independent Auditor Verification (Pass 1)
    // -------------------------------------------------------------
    const tAuditStart = Date.now();
    let auditResult = await auditorAgent.auditAllClaims(rawClaims, updatedSources, evidence);
    timeSpent.auditingMs = Date.now() - tAuditStart;
    totalInputTokens += auditResult.inputTokens;
    totalOutputTokens += auditResult.outputTokens;

    addTrace(
      'auditing',
      'Auditor',
      `Independent audit complete: ${auditResult.claimsSupported}/${auditResult.claimsTotal} SUPPORTED, ${auditResult.claimsUnsupported} UNSUPPORTED, ${auditResult.claimsContradicted} CONTRADICTED, ${auditResult.claimsUncited} UNCITED`,
      {
        passed: auditResult.passed,
        supported: auditResult.claimsSupported,
        unsupported: auditResult.claimsUnsupported,
        contradicted: auditResult.claimsContradicted,
        uncited: auditResult.claimsUncited,
        revisionFeedback: auditResult.revisionFeedback,
      },
      timeSpent.auditingMs,
      auditResult.passed ? 'success' : 'warning'
    );

    // -------------------------------------------------------------
    // PHASE 9: Automatic Feedback & Revision Loops (up to maxRevisionLoops)
    // -------------------------------------------------------------
    const revisions: RevisionHistoryItem[] = [];
    let currentAnswer = analystDraft.answer;
    let currentClaims = auditResult.claims;
    let loopCount = 0;

    while (!auditResult.passed && loopCount < maxRevisionLoops && auditResult.revisionFeedback) {
      loopCount++;
      const tRevStart = Date.now();
      addTrace(
        'revision',
        'Supervisor',
        `Initiating automated revision loop ${loopCount}/${maxRevisionLoops} based on Auditor findings`,
        { feedback: auditResult.revisionFeedback },
        0,
        'warning'
      );

      // Targeted delta search if unsupported claims need fresh evidence
      const deltaQuery = `${question} official facts verification`;
      searchCallsCount++;
      const deltaSources = await webSearchEngine.search(deltaQuery, 3);
      for (const ds of deltaSources) {
        if (!updatedSources.some(s => s.url === ds.url)) {
          ds.id = `S${updatedSources.length + 1}`;
          updatedSources.push(ds);
        }
      }

      // Re-extract evidence with new sources if added
      const deltaEvidence = await evidenceExtractor.extractEvidence(question, updatedSources);
      totalInputTokens += deltaEvidence.inputTokens;
      totalOutputTokens += deltaEvidence.outputTokens;

      // Analyst revisions
      const revisedDraft = await analystAgent.generateAnswer({
        question,
        evidence: [...evidence, ...deltaEvidence.evidence],
        sources: updatedSources,
        contradictions: detectedContradictions,
        memoryHits,
        mode,
        revisionFeedback: auditResult.revisionFeedback,
        previousAnswer: currentAnswer,
      });

      totalInputTokens += revisedDraft.inputTokens;
      totalOutputTokens += revisedDraft.outputTokens;

      // Re-extract claims from revised answer
      const revisedClaimsRes = await auditorAgent.extractClaims(revisedDraft.answer);
      totalInputTokens += revisedClaimsRes.inputTokens;
      totalOutputTokens += revisedClaimsRes.outputTokens;

      // Re-run independent auditor
      const reAuditResult = await auditorAgent.auditAllClaims(revisedClaimsRes.claims, updatedSources, [
        ...evidence,
        ...deltaEvidence.evidence,
      ]);
      totalInputTokens += reAuditResult.inputTokens;
      totalOutputTokens += reAuditResult.outputTokens;

      const durationMs = Date.now() - tRevStart;
      timeSpent.revisionMs += durationMs;

      revisions.push({
        iteration: loopCount,
        feedback: auditResult.revisionFeedback,
        previousAnswer: currentAnswer,
        newAnswer: revisedDraft.answer,
        deltaSearches: [deltaQuery],
        fixedClaimsCount: Math.max(0, reAuditResult.claimsSupported - auditResult.claimsSupported),
        timestamp: new Date().toISOString(),
      });

      addTrace(
        'revision',
        'Analyst',
        `Revision ${loopCount} produced revised answer: ${reAuditResult.claimsSupported}/${reAuditResult.claimsTotal} claims now SUPPORTED`,
        {
          supportedBefore: auditResult.claimsSupported,
          supportedAfter: reAuditResult.claimsSupported,
          unsupportedAfter: reAuditResult.claimsUnsupported,
          contradictedAfter: reAuditResult.claimsContradicted,
        },
        durationMs,
        reAuditResult.passed ? 'success' : 'info'
      );

      currentAnswer = revisedDraft.answer;
      currentClaims = reAuditResult.claims;
      auditResult = reAuditResult;
    }

    // -------------------------------------------------------------
    // PHASE 10: Ingest Verified Research into Persistent Entity Memory
    // -------------------------------------------------------------
    const tMemStoreStart = Date.now();
    try {
      const supportedClaims = currentClaims.filter(c => c.verdict === 'SUPPORTED');
      for (const ent of plan.targetEntities) {
        const entFacts = supportedClaims.slice(0, 5).map(c => ({
          key: c.text.slice(0, 50),
          value: c.text,
          date: new Date().toISOString().split('T')[0],
          sourceUrl: updatedSources.find(s => c.citedSourceIds.includes(s.id))?.url,
          verified: true,
        }));

        const newMemoryItem: EntityMemory = {
          id: `ent_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          entityName: ent.name,
          entityType: (ent.type as any) || 'organization',
          facts: entFacts,
          relationships: [],
          sources: updatedSources.map(s => s.url),
          lastResearched: new Date().toISOString(),
          auditStatus: auditResult.passed ? 'AUDITED_CLEAN' : 'HAS_WARNINGS',
        };

        memoryStore.saveEntity(newMemoryItem);
      }

      addTrace(
        'memory_store',
        'MemorySystem',
        `Persisted ${plan.targetEntities.length} entities with ${supportedClaims.length} verified facts into persistent memory`,
        { entitiesSaved: plan.targetEntities.map(e => e.name) },
        Date.now() - tMemStoreStart,
        'success'
      );
    } catch (e) {
      console.warn('Failed to persist memory:', e);
    }

    // -------------------------------------------------------------
    // Finalize Metrics & Session
    // -------------------------------------------------------------
    timeSpent.totalMs = Date.now() - startTime;
    const { costUsd, costInr } = geminiService.calculateCost(totalInputTokens, totalOutputTokens);

    const session: ResearchSession = {
      id: sessionId,
      question,
      mode,
      plan,
      analystAnswer: analystDraft.answer,
      finalAnswer: currentAnswer,
      sources: updatedSources,
      evidence,
      claims: currentClaims,
      revisions,
      metrics: {
        modelName: geminiService.getModelName(),
        inputTokens: totalInputTokens,
        outputTokens: totalOutputTokens,
        totalTokens: totalInputTokens + totalOutputTokens,
        estimatedCostUsd: Number(costUsd.toFixed(6)),
        estimatedCostInr: Number(costInr.toFixed(4)),
        searchCallsCount,
        pagesFetchedCount,
        claimsTotal: currentClaims.length,
        claimsSupported: auditResult.claimsSupported,
        claimsUnsupported: auditResult.claimsUnsupported,
        claimsContradicted: auditResult.claimsContradicted,
        claimsUncited: auditResult.claimsUncited,
        auditorCatchesCount: auditResult.claimsUnsupported + auditResult.claimsContradicted + auditResult.claimsUncited,
        revisionCount: revisions.length,
        memoryHitsCount: memoryHits.length,
        timeSpent,
        parallelismSpeedupFactor: parallelismSpeedup,
      },
      trace,
      createdAt: new Date(startTime).toISOString(),
      completedAt: new Date().toISOString(),
      status: 'completed',
    };

    addTrace(
      'complete',
      'Supervisor',
      `Research complete in ${(timeSpent.totalMs / 1000).toFixed(2)}s | ₹${costInr.toFixed(2)} INR | ${currentClaims.length} claims verified`,
      { metrics: session.metrics },
      0,
      'success'
    );

    this.sessions.set(sessionId, session);
    return session;
  }
}

export const researchOrchestrator = new ResearchOrchestrator();
