import pytest
from datetime import datetime

def test_evidence_model():
    """Verify CLAIM -> EVIDENCE -> SOURCE lineage and types."""
    from backend.models import Source, Evidence, Claim

    source = Source(
        id="S1",
        url="https://sec.gov/edgar",
        title="SEC Form 10-K",
        domain="sec.gov",
        snippet="Official annual report.",
        fullText="Audited retail footprint discloses 118 corporate retail stores as of end of Q3 2023.",
        retrievalDate=datetime.utcnow().isoformat(),
        sourceType="primary",
        qualityScore=95,
        fetchStatus="fetched",
        fetchLatencyMs=85
    )

    evidence = Evidence(
        id="E1",
        sourceId="S1",
        exactQuote="118 corporate retail stores as of end of Q3 2023",
        context="Corporate store count",
        temporalValidity="As of Q3 2023",
        confidence=0.99
    )

    claim = Claim(
        id="C1",
        text="Warby Parker operated 118 corporate retail stores at the close of Q3 2023.",
        citedSourceIds=["S1"],
        evidenceIds=["E1"],
        verdict="SUPPORTED",
        confidence=0.98,
        auditorReasoning="Direct verbatim match against SEC 10-K filing excerpt.",
        independentSourceQuote="118 corporate retail stores as of end of Q3 2023",
        status="passed"
    )

    assert claim.verdict == "SUPPORTED"
    assert claim.citedSourceIds == ["S1"]
    assert evidence.sourceId == "S1"
    assert source.qualityScore == 95

def test_contradiction_detection():
    """Verify contradiction schema and reconciliation."""
    from backend.models import ContradictionDetails

    conflict = ContradictionDetails(
        sourceA={"id": "S1", "url": "https://sec.gov", "title": "SEC 10-Q", "quoteOrValue": "118 stores"},
        sourceB={"id": "S2", "url": "https://retailwire.com", "title": "Retail Wire", "quoteOrValue": "125 stores"},
        conflictType="numerical",
        investigation="S1 reports corporate-owned stores through September 30, 2023. S2 reports total physical footprint including 7 holiday pop-up lease openings in November 2023.",
        resolution="Reconciled: 118 permanent corporate locations + 7 seasonal openings = 125 total footprint."
    )

    assert conflict.conflictType == "numerical"
    assert "118" in conflict.sourceA["quoteOrValue"]
    assert "125" in conflict.sourceB["quoteOrValue"]

def test_persistent_memory_schema():
    """Verify persistent entity structure."""
    from backend.models import EntityMemory, EntityFact, EntityRelationship

    entity = EntityMemory(
        id="ent_khosla",
        entityName="Khosla Ventures",
        entityType="investor",
        facts=[
            EntityFact(key="Founder", value="Vinod Khosla", verified=True),
            EntityFact(key="Investment in OpenAI", value="Backed 2019 LP formation", verified=True)
        ],
        relationships=[
            EntityRelationship(relation="Early Investor", targetEntity="OpenAI"),
            EntityRelationship(relation="Early Investor", targetEntity="Stripe")
        ],
        sources=["https://khoslaventures.com"],
        lastResearched=datetime.utcnow().isoformat(),
        auditStatus="AUDITED_CLEAN"
    )

    assert entity.entityName == "Khosla Ventures"
    assert len(entity.facts) == 2
    assert len(entity.relationships) == 2
    assert entity.auditStatus == "AUDITED_CLEAN"
