import { geminiService } from './geminiClient.ts';
import { Source, Evidence, ContradictionDetails, EntityMemory, ResearchMode } from '../types/index.ts';

export interface AnalystResponse {
  answer: string;
  citedSourceIds: string[];
  inputTokens: number;
  outputTokens: number;
}

export class AnalystAgent {
  public async generateAnswer(params: {
    question: string;
    evidence: Evidence[];
    sources: Source[];
    contradictions: ContradictionDetails[];
    memoryHits: EntityMemory[];
    mode: ResearchMode;
    revisionFeedback?: string;
    previousAnswer?: string;
  }): Promise<AnalystResponse> {
    const { question, evidence, sources, contradictions, memoryHits, mode, revisionFeedback, previousAnswer } = params;

    const sourceCatalog = sources.map(s => `[${s.id}] Title: ${s.title} | Domain: ${s.domain} | URL: ${s.url} | Quality: ${s.qualityScore} (${s.sourceType})`).join('\n');

    const evidenceCatalog = evidence.map(e => `Evidence [${e.id}] (from ${e.sourceId}): "${e.exactQuote}" - Context: ${e.context} ${e.temporalValidity ? `[Temporal: ${e.temporalValidity}]` : ''}`).join('\n');

    const memoryCatalog = memoryHits.length > 0
      ? memoryHits.map(m => `Memory for ${m.entityName}: ${m.facts.map(f => `${f.key}=${f.value}`).join('; ')}`).join('\n')
      : 'None';

    const contradictionCatalog = contradictions.length > 0
      ? contradictions.map(c => `Conflict detected between ${c.sourceA.id} ("${c.sourceA.quoteOrValue}") and ${c.sourceB.id} ("${c.sourceB.quoteOrValue}"). Reason: ${c.investigation}. Resolution: ${c.resolution}`).join('\n')
      : 'No conflicting sources detected.';

    // Construct prompt based on mode
    let auditorWarning = '';
    if (mode === 'adversarial_audited') {
      auditorWarning = `
CRITICAL DIRECTIVE: Every single factual sentence you write will be independently audited by a strict, hostile Auditor Agent.
- If you state a number, date, name, or assertion without a direct bracket citation like [S1] or [S2], the claim will be marked UNCITED and failed.
- If you cite a source that does not explicitly state the fact, the claim will be marked UNSUPPORTED and failed.
- If two sources conflict, you MUST acknowledge both and explain the resolution.
- If evidence is absent, you MUST state explicitly: "Evidence for [X] could not be verified in the retrieved sources." DO NOT GUESS OR ESTIMATE.`;
    } else if (mode === 'adversarial_unaware') {
      auditorWarning = `Please answer the user's research question clearly and comprehensively using the provided reference material. Add citations where helpful.`;
    } else {
      // standard mode
      auditorWarning = `Ground every factual assertion in the provided Evidence items. Use bracket citations such as [S1], [S2] corresponding to the source IDs. If evidence is missing, state it clearly. Reconcile any contradictions noted.`;
    }

    let revisionInstruction = '';
    if (revisionFeedback) {
      revisionInstruction = `
REVISION DIRECTIVE (Cycle Feedback):
The independent Auditor rejected your previous draft for the following reasons:
"""
${revisionFeedback}
"""
Previous Draft:
"""
${previousAnswer}
"""
You MUST correct the unsupported, contradicted, or uncited claims identified above. Remove unfounded assertions, adjust claims to match source evidence, and cite properly.`;
    }

    const systemPrompt = `You are the Lead Analyst Agent in an enterprise intelligence research team.
Your mission is to synthesize a structured, thoroughly cited, and definitive research report.
${auditorWarning}
${revisionInstruction}`;

    const userPrompt = `Research Question:
"${question}"

Available Sources:
${sourceCatalog}

Extracted Evidence Items:
${evidenceCatalog}

Persistent Memory Retrieval:
${memoryCatalog}

Contradiction Analysis:
${contradictionCatalog}

Compose your research answer now. Use bracket citations matching the source IDs (e.g. [S1], [S2]).`;

    try {
      const { text, usage } = await geminiService.generateText(userPrompt, systemPrompt, 0.2);

      // Extract cited source IDs
      const matches = text.match(/\[S\d+\]/g) || [];
      const citedIds = Array.from(new Set(matches.map(m => m.replace(/[\[\]]/g, ''))));

      return {
        answer: text,
        citedSourceIds: citedIds,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
      };
    } catch (err: any) {
      console.error('Analyst agent error:', err);
      return {
        answer: `Unable to complete research synthesis due to engine error: ${err.message}`,
        citedSourceIds: [],
        inputTokens: 0,
        outputTokens: 0,
      };
    }
  }
}

export const analystAgent = new AnalystAgent();
