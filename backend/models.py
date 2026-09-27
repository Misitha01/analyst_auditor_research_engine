from typing import List, Optional, Literal, Dict, Any
from pydantic import BaseModel, Field

SourceType = Literal['primary', 'journalism', 'industry', 'secondary', 'unknown']
FetchStatus = Literal['fetched', 'failed', 'cached', 'timeout']
ClaimVerdict = Literal['SUPPORTED', 'UNSUPPORTED', 'CONTRADICTED', 'UNCITED']
ResearchMode = Literal['standard', 'adversarial_unaware', 'adversarial_audited']

class Source(BaseModel):
    id: str
    url: str
    title: str
    domain: str
    snippet: str
    fullText: str
    publicationDate: Optional[str] = None
    retrievalDate: str
    sourceType: SourceType
    qualityScore: int
    isDuplicate: bool = False
    clusterId: Optional[str] = None
    fetchStatus: FetchStatus
    fetchLatencyMs: int

class Evidence(BaseModel):
    id: str
    sourceId: str
    claimId: Optional[str] = None
    exactQuote: str
    context: str
    temporalValidity: Optional[str] = None
    confidence: float

class ContradictionDetails(BaseModel):
    sourceA: Dict[str, str]
    sourceB: Dict[str, str]
    conflictType: Literal['numerical', 'temporal', 'definitional', 'factual']
    investigation: str
    resolution: str

class Claim(BaseModel):
    id: str
    text: str
    citedSourceIds: List[str]
    evidenceIds: List[str] = []
    verdict: ClaimVerdict
    confidence: float
    auditorReasoning: str
    independentSourceQuote: Optional[str] = None
    contradictionDetails: Optional[ContradictionDetails] = None
    status: Literal['passed', 'failed', 'revised']

class EntityFact(BaseModel):
    key: str
    value: str
    date: Optional[str] = None
    sourceUrl: Optional[str] = None
    verified: bool = True

class EntityRelationship(BaseModel):
    relation: str
    targetEntity: str
    context: Optional[str] = None

class EntityMemory(BaseModel):
    id: str
    entityName: str
    entityType: str
    facts: List[EntityFact]
    relationships: List[EntityRelationship]
    sources: List[str]
    lastResearched: str
    auditStatus: Literal['AUDITED_CLEAN', 'HAS_WARNINGS', 'UNVERIFIED']

class ResearchPlan(BaseModel):
    targetEntities: List[Dict[str, Any]]
    subQuestions: List[str]
    hypotheses: List[str]
    searchStrategy: str
    queries: List[str]
    memoryHits: List[Dict[str, Any]]

class TraceEvent(BaseModel):
    id: str
    timestamp: str
    phase: str
    agent: str
    title: str
    details: Any
    durationMs: int
    status: Literal['success', 'warning', 'error', 'info']

class ResearchMetrics(BaseModel):
    modelName: str
    inputTokens: int
    outputTokens: int
    totalTokens: int
    estimatedCostUsd: float
    estimatedCostInr: float
    searchCallsCount: int
    pagesFetchedCount: int
    claimsTotal: int
    claimsSupported: int
    claimsUnsupported: int
    claimsContradicted: int
    claimsUncited: int
    auditorCatchesCount: int
    revisionCount: int
    memoryHitsCount: int
    timeSpent: Dict[str, int]
    parallelismSpeedupFactor: float

class ResearchSession(BaseModel):
    id: str
    question: str
    mode: ResearchMode
    plan: ResearchPlan
    analystAnswer: str
    finalAnswer: str
    sources: List[Source]
    evidence: List[Evidence]
    claims: List[Claim]
    revisions: List[Dict[str, Any]] = []
    metrics: ResearchMetrics
    trace: List[TraceEvent]
    createdAt: str
    completedAt: str
    status: Literal['running', 'completed', 'failed']
