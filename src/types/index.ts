/**
 * Core type definitions for VeritasAI Analyst & Auditor System
 */

export type SourceType = 'primary' | 'journalism' | 'industry' | 'secondary' | 'unknown';

export type FetchStatus = 'fetched' | 'failed' | 'cached' | 'timeout';

export interface Source {
  id: string; // e.g., "S1", "S2"
  url: string;
  title: string;
  domain: string;
  snippet: string;
  fullText: string;
  publicationDate?: string;
  retrievalDate: string;
  sourceType: SourceType;
  qualityScore: number; // 0 to 100
  isDuplicate?: boolean;
  clusterId?: string;
  fetchStatus: FetchStatus;
  fetchLatencyMs: number;
  isGoogleGrounded?: boolean;
}

export interface Evidence {
  id: string; // e.g., "E1", "E2"
  sourceId: string;
  claimId?: string;
  exactQuote: string;
  context: string;
  temporalValidity?: string;
  confidence: number;
}

export type ClaimVerdict = 'SUPPORTED' | 'UNSUPPORTED' | 'CONTRADICTED' | 'UNCITED';

export interface ContradictionDetails {
  sourceA: { id: string; url: string; title: string; quoteOrValue: string };
  sourceB: { id: string; url: string; title: string; quoteOrValue: string };
  conflictType: 'numerical' | 'temporal' | 'definitional' | 'factual';
  investigation: string;
  resolution: string;
}

export interface Claim {
  id: string; // e.g., "C1", "C2"
  text: string;
  citedSourceIds: string[];
  evidenceIds: string[];
  verdict: ClaimVerdict;
  confidence: number;
  auditorReasoning: string;
  independentSourceQuote?: string;
  contradictionDetails?: ContradictionDetails;
  revisionNotes?: string;
  status: 'passed' | 'failed' | 'revised';
}

export interface EntityFact {
  key: string;
  value: string;
  date?: string;
  sourceUrl?: string;
  verified: boolean;
}

export interface EntityRelationship {
  relation: string;
  targetEntity: string;
  context?: string;
}

export interface EntityMemory {
  id: string;
  entityName: string;
  entityType: 'company' | 'person' | 'investor' | 'organization' | 'product' | 'location' | 'funding_round' | 'event';
  facts: EntityFact[];
  relationships: EntityRelationship[];
  sources: string[];
  lastResearched: string;
  auditStatus: 'AUDITED_CLEAN' | 'HAS_WARNINGS' | 'UNVERIFIED';
}

export interface ResearchPlan {
  targetEntities: Array<{ name: string; type: string; knownFactsCount: number }>;
  subQuestions: string[];
  hypotheses: string[];
  searchStrategy: string;
  queries: string[];
  memoryHits: Array<{ entityName: string; matchedFacts: string[] }>;
}

export type TracePhase =
  | 'planning'
  | 'memory_lookup'
  | 'search'
  | 'fetch'
  | 'evidence_extraction'
  | 'analyst_draft'
  | 'claim_extraction'
  | 'auditing'
  | 'contradiction_resolution'
  | 'revision'
  | 'memory_store'
  | 'complete';

export type AgentRole = 'Planner' | 'MemorySystem' | 'SearchWorker' | 'Analyst' | 'Auditor' | 'Supervisor';

export interface TraceEvent {
  id: string;
  timestamp: string;
  phase: TracePhase;
  agent: AgentRole;
  title: string;
  details: any;
  durationMs: number;
  status: 'success' | 'warning' | 'error' | 'info';
}

export interface RevisionHistoryItem {
  iteration: number;
  feedback: string;
  previousAnswer: string;
  newAnswer: string;
  deltaSearches: string[];
  fixedClaimsCount: number;
  timestamp: string;
}

export interface ResearchMetrics {
  modelName: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  estimatedCostUsd: number;
  estimatedCostInr: number; // ₹ INR
  searchCallsCount: number;
  pagesFetchedCount: number;
  claimsTotal: number;
  claimsSupported: number;
  claimsUnsupported: number;
  claimsContradicted: number;
  claimsUncited: number;
  auditorCatchesCount: number;
  revisionCount: number;
  memoryHitsCount: number;
  timeSpent: {
    planningMs: number;
    searchingMs: number;
    fetchingMs: number;
    extractingMs: number;
    analystMs: number;
    auditingMs: number;
    revisionMs: number;
    totalMs: number;
  };
  parallelismSpeedupFactor: number;
}

export type ResearchMode = 'standard' | 'adversarial_unaware' | 'adversarial_audited';

export interface ResearchSession {
  id: string;
  question: string;
  mode: ResearchMode;
  plan: ResearchPlan;
  analystAnswer: string;
  finalAnswer: string;
  sources: Source[];
  evidence: Evidence[];
  claims: Claim[];
  revisions: RevisionHistoryItem[];
  metrics: ResearchMetrics;
  trace: TraceEvent[];
  createdAt: string;
  completedAt: string;
  status: 'running' | 'completed' | 'failed';
  error?: string;
}

export interface EvalQuestion {
  id: string;
  category: 'simple_factual' | 'multi_source' | 'multi_entity' | 'temporal' | 'conflicting_sources' | 'memory_reuse_1' | 'memory_reuse_2' | 'difficult_multi_evidence';
  question: string;
  description: string;
  expectedEntities: string[];
  reuseEntityFromId?: string;
}

export interface EvalResult {
  questionId: string;
  question: string;
  category: string;
  sessionId: string;
  claimsTotal: number;
  claimsSupported: number;
  claimsUnsupported: number;
  claimsContradicted: number;
  claimsUncited: number;
  auditorCatches: number;
  revisions: number;
  searches: number;
  sources: number;
  totalTokens: number;
  costInr: number;
  latencyMs: number;
  memoryReused: boolean;
  score: number; // 0 - 100
}
