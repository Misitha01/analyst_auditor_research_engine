import { geminiService } from './geminiClient.ts';
import { Source, Evidence, ContradictionDetails } from '../types/index.ts';

export interface ExtractionResult {
  evidence: Evidence[];
  detectedContradictions: ContradictionDetails[];
  inputTokens: number;
  outputTokens: number;
}

export class EvidenceExtractor {
  public async extractEvidence(
    question: string,
    sources: Source[]
  ): Promise<ExtractionResult> {
    if (sources.length === 0) {
      return {
        evidence: [],
        detectedContradictions: [],
        inputTokens: 0,
        outputTokens: 0,
      };
    }

    // Prepare source text payload (truncated appropriately to fit context)
    const sourcesPayload = sources.map(s => ({
      id: s.id,
      title: s.title,
      url: s.url,
      sourceType: s.sourceType,
      qualityScore: s.qualityScore,
      publicationDate: s.publicationDate || 'Unknown',
      textSample: s.fullText.slice(0, 2500),
    }));

    const systemPrompt = `You are the Senior Evidence Extraction Specialist for VeritasAI.
Your role is to strictly extract verified, verbatim evidence items from the provided web sources to answer the user's research question.
CRITICAL RULES:
1. Every evidence item MUST be an exact or near-verbatim quote from the source text. Never invent quotes.
2. Link every evidence item to its specific source ID (e.g., S1, S2).
3. Identify any factual, numerical, or temporal CONTRADICTIONS between sources (e.g., different store counts, different valuations, differing dates).
4. For any contradiction, explain the root cause (e.g., different reporting dates, franchise vs company-owned definition, preliminary vs revised filing).`;

    const userPrompt = `Research Question: "${question}"

Sources Provided:
${JSON.stringify(sourcesPayload, null, 2)}

Extract the key evidence items and identify any source contradictions.
Return strictly JSON adhering to this schema:
{
  "evidence": [
    {
      "sourceId": "S1",
      "exactQuote": "verbatim text excerpt from source",
      "context": "what factual point this quote supports",
      "temporalValidity": "e.g. As of Q4 2023, Current 2025, Historical 2021",
      "confidence": 0.95
    }
  ],
  "contradictions": [
    {
      "sourceA": { "id": "S1", "url": "URL", "title": "Title", "quoteOrValue": "e.g., 125 stores" },
      "sourceB": { "id": "S2", "url": "URL", "title": "Title", "quoteOrValue": "e.g., 118 stores" },
      "conflictType": "numerical|temporal|definitional|factual",
      "investigation": "investigation into why they differ",
      "resolution": "how to reconcile (e.g. 118 was company-owned as of Sep 2023, 125 was total footprint including new openings in Nov 2023)"
    }
  ]
}`;

    try {
      const { data, usage } = await geminiService.generateJson<{
        evidence: Array<Omit<Evidence, 'id'>>;
        contradictions: ContradictionDetails[];
      }>(userPrompt, undefined, systemPrompt);

      const evidenceList: Evidence[] = (data.evidence || []).map((e, idx) => ({
        id: `E${idx + 1}`,
        sourceId: e.sourceId || (sources[0]?.id ?? 'S1'),
        exactQuote: e.exactQuote || '',
        context: e.context || '',
        temporalValidity: e.temporalValidity,
        confidence: e.confidence || 0.9,
      }));

      return {
        evidence: evidenceList,
        detectedContradictions: data.contradictions || [],
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
      };
    } catch (err) {
      console.warn('Evidence extractor fallback heuristic:', err);
      // Fallback extraction from snippet/fullText
      const fallbackEvidence: Evidence[] = sources.slice(0, 3).map((s, idx) => ({
        id: `E${idx + 1}`,
        sourceId: s.id,
        exactQuote: s.snippet || s.fullText.slice(0, 200),
        context: `Relevant context from ${s.title}`,
        confidence: 0.8,
      }));

      return {
        evidence: fallbackEvidence,
        detectedContradictions: [],
        inputTokens: 0,
        outputTokens: 0,
      };
    }
  }
}

export const evidenceExtractor = new EvidenceExtractor();
