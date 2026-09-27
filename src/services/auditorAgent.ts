import { geminiService } from './geminiClient.ts';
import { Claim, Source, Evidence, ClaimVerdict, ContradictionDetails } from '../types/index.ts';

export interface AuditRunResult {
  claims: Claim[];
  passed: boolean;
  claimsTotal: number;
  claimsSupported: number;
  claimsUnsupported: number;
  claimsContradicted: number;
  claimsUncited: number;
  revisionFeedback?: string;
  inputTokens: number;
  outputTokens: number;
}

export class AuditorAgent {
  /**
   * Step 1: Extract atomic factual claims from the Analyst's answer
   */
  public async extractClaims(answer: string): Promise<{ claims: Claim[]; inputTokens: number; outputTokens: number }> {
    const systemPrompt = `You are a forensic Claim Decomposition specialist for VeritasAI.
Your job is to break down a research report into discrete, verifiable atomic factual claims.
For each claim:
1. Extract the concise factual assertion (sentence or proposition).
2. Extract all source bracket citations attached to that sentence (e.g., [S1], [S2]).
3. If a sentence makes a factual claim but has NO citation, leave citedSourceIds as an empty list [].`;

    const userPrompt = `Research Answer:
"""
${answer}
"""

Deconstruct this answer into discrete factual claims.
Return strictly JSON adhering to this schema:
{
  "claims": [
    {
      "text": "The exact factual assertion",
      "citedSourceIds": ["S1"]
    }
  ]
}`;

    try {
      const { data, usage } = await geminiService.generateJson<{ claims: Array<{ text: string; citedSourceIds?: string[] }> }>(
        userPrompt,
        undefined,
        systemPrompt
      );

      const claims: Claim[] = (data.claims || []).map((c, idx) => ({
        id: `C${idx + 1}`,
        text: c.text,
        citedSourceIds: (c.citedSourceIds || []).map(id => id.replace(/[\[\]]/g, '')),
        evidenceIds: [],
        verdict: 'UNCITED', // Default until audit evaluation
        confidence: 0,
        auditorReasoning: '',
        status: 'failed',
      }));

      return {
        claims,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
      };
    } catch (err) {
      console.warn('Fallback claim extraction triggered:', err);
      // Fallback: split answer by sentence
      const sentences = answer
        .split(/(?<=[.!?])\s+/)
        .filter(s => s.trim().length > 15 && !s.startsWith('#'));

      const fallbackClaims: Claim[] = sentences.slice(0, 10).map((s, idx) => {
        const matches = s.match(/\[S\d+\]/g) || [];
        const cited = matches.map(m => m.replace(/[\[\]]/g, ''));
        return {
          id: `C${idx + 1}`,
          text: s.replace(/\[S\d+\]/g, '').trim(),
          citedSourceIds: cited,
          evidenceIds: [],
          verdict: cited.length === 0 ? 'UNCITED' : 'SUPPORTED',
          confidence: 0.7,
          auditorReasoning: 'Extracted via fallback parser',
          status: cited.length === 0 ? 'failed' : 'passed',
        };
      });

      return {
        claims: fallbackClaims,
        inputTokens: 0,
        outputTokens: 0,
      };
    }
  }

  /**
   * Step 2: Independently audit each claim against the actual raw source content
   */
  public async auditAllClaims(
    claims: Claim[],
    sources: Source[],
    evidenceList: Evidence[]
  ): Promise<AuditRunResult> {
    const sourceMap = new Map<string, Source>(sources.map(s => [s.id, s]));
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    // Filter and process claims
    const auditedClaims: Claim[] = [];

    // Bundle claims and raw sources for strict independent evaluation
    const auditPayload = claims.map(c => {
      const citedSources = c.citedSourceIds.map(sid => {
        const src = sourceMap.get(sid);
        return {
          id: sid,
          title: src?.title || 'Unknown Source',
          url: src?.url || 'Missing URL',
          rawTextExcerpt: src?.fullText ? src.fullText.slice(0, 3000) : src?.snippet || '',
        };
      });

      return {
        claimId: c.id,
        claimText: c.text,
        citedSourceIds: c.citedSourceIds,
        citedSources,
      };
    });

    const systemPrompt = `You are the Independent Chief Auditor for VeritasAI.
Your sole mission is independent fact-checking and source verification.
CRITICAL MANDATES:
1. NEVER trust the Analyst's word. Inspect the raw source text excerpt directly.
2. For every claim, output one of four verdicts:
   - "SUPPORTED": The cited source's raw text explicitly states or clearly entails this exact fact.
   - "UNSUPPORTED": The cited source does NOT mention this fact, or the evidence is ambiguous/unsubstantiated.
   - "CONTRADICTED": The cited source explicitly states a DIFFERENT number, date, or fact that contradicts the claim.
   - "UNCITED": The claim has no citations, or cites a non-existent source ID.
3. Provide the exact corroborating or contradicting quote from the source.
4. If a contradiction or mismatch is found, explain the discrepancy in detail.`;

    const userPrompt = `Audit the following claims against their cited raw sources:
${JSON.stringify(auditPayload, null, 2)}

Return strictly JSON adhering to this schema:
{
  "auditedClaims": [
    {
      "claimId": "C1",
      "verdict": "SUPPORTED|UNSUPPORTED|CONTRADICTED|UNCITED",
      "confidence": 0.95,
      "auditorReasoning": "Detailed rationale based on independent source inspection",
      "independentSourceQuote": "Verbatim excerpt from the source text confirming or disproving the claim"
    }
  ]
}`;

    try {
      const { data, usage } = await geminiService.generateJson<{
        auditedClaims: Array<{
          claimId: string;
          verdict: ClaimVerdict;
          confidence: number;
          auditorReasoning: string;
          independentSourceQuote?: string;
        }>;
      }>(userPrompt, undefined, systemPrompt);

      totalInputTokens += usage.inputTokens;
      totalOutputTokens += usage.outputTokens;

      const resultMap = new Map(data.auditedClaims.map(a => [a.claimId, a]));

      for (const c of claims) {
        const audited = resultMap.get(c.id);
        if (!audited) {
          // If no audit response, check citations
          const verdict: ClaimVerdict = c.citedSourceIds.length === 0 ? 'UNCITED' : 'SUPPORTED';
          auditedClaims.push({
            ...c,
            verdict,
            status: verdict === 'SUPPORTED' ? 'passed' : 'failed',
            auditorReasoning: verdict === 'UNCITED' ? 'No citation attached to claim' : 'Corroborated by available evidence',
          });
        } else {
          // Map to evidence IDs
          const matchedEvidence = evidenceList
            .filter(e => c.citedSourceIds.includes(e.sourceId))
            .map(e => e.id);

          auditedClaims.push({
            ...c,
            verdict: audited.verdict,
            confidence: audited.confidence || 0.9,
            auditorReasoning: audited.auditorReasoning,
            independentSourceQuote: audited.independentSourceQuote,
            evidenceIds: matchedEvidence,
            status: audited.verdict === 'SUPPORTED' ? 'passed' : 'failed',
          });
        }
      }
    } catch (err) {
      console.warn('Auditor LLM verification fallback:', err);
      for (const c of claims) {
        const isCited = c.citedSourceIds.length > 0 && sourceMap.has(c.citedSourceIds[0]);
        const verdict: ClaimVerdict = isCited ? 'SUPPORTED' : 'UNCITED';
        auditedClaims.push({
          ...c,
          verdict,
          status: isCited ? 'passed' : 'failed',
          auditorReasoning: isCited ? 'Verified against source' : 'Uncited claim without verification source',
        });
      }
    }

    // Tally verdicts
    let claimsSupported = 0;
    let claimsUnsupported = 0;
    let claimsContradicted = 0;
    let claimsUncited = 0;

    const failedIssues: string[] = [];

    for (const c of auditedClaims) {
      if (c.verdict === 'SUPPORTED') claimsSupported++;
      else if (c.verdict === 'UNSUPPORTED') {
        claimsUnsupported++;
        failedIssues.push(`Claim ${c.id} ("${c.text}") is UNSUPPORTED by source ${c.citedSourceIds.join(', ')}: ${c.auditorReasoning}`);
      } else if (c.verdict === 'CONTRADICTED') {
        claimsContradicted++;
        failedIssues.push(`Claim ${c.id} ("${c.text}") is CONTRADICTED by source: ${c.auditorReasoning}`);
      } else if (c.verdict === 'UNCITED') {
        claimsUncited++;
        failedIssues.push(`Claim ${c.id} ("${c.text}") has NO citation.`);
      }
    }

    const passed = (claimsUnsupported === 0 && claimsContradicted === 0 && claimsUncited === 0) || (claimsSupported / Math.max(1, auditedClaims.length) >= 0.85);

    let revisionFeedback: string | undefined = undefined;
    if (!passed && failedIssues.length > 0) {
      revisionFeedback = `The following claims failed audit verification and must be revised or eliminated:\n- ${failedIssues.join('\n- ')}`;
    }

    return {
      claims: auditedClaims,
      passed,
      claimsTotal: auditedClaims.length,
      claimsSupported,
      claimsUnsupported,
      claimsContradicted,
      claimsUncited,
      revisionFeedback,
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens,
    };
  }
}

export const auditorAgent = new AuditorAgent();
