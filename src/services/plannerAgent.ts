import { geminiService } from './geminiClient.ts';
import { memoryStore } from './memoryStore.ts';
import { ResearchPlan, EntityMemory } from '../types/index.ts';

export class PlannerAgent {
  public async plan(question: string): Promise<{ plan: ResearchPlan; memoryHits: EntityMemory[]; inputTokens: number; outputTokens: number }> {
    // 1. Initial quick memory retrieval based on question tokens
    const preliminaryMemoryHits = memoryStore.findRelevant(question);

    const memoryContext = preliminaryMemoryHits.map(m => ({
      entityName: m.entityName,
      type: m.entityType,
      facts: m.facts.map(f => `${f.key}: ${f.value} (${f.date || 'verified'})`),
      relationships: m.relationships.map(r => `${r.relation} -> ${r.targetEntity}`),
    }));

    const systemPrompt = `You are the Lead Research Strategist for VeritasAI.
Your job is to decompose an open-ended research question into an rigorous execution plan.
You have access to persistent entity memory from prior research sessions.
Identify entities mentioned, decompose into sub-questions, formulate hypotheses, and generate 2 to 4 targeted, search-friendly queries.
Distinguish between what is already established in memory versus what needs fresh live web verification.`;

    const userPrompt = `Research Question: "${question}"

Existing Persistent Memory Context:
${JSON.stringify(memoryContext, null, 2)}

Create a detailed research plan. Return strictly JSON with this schema:
{
  "targetEntities": [
    { "name": "string", "type": "company|person|investor|organization|product|location|funding_round|event", "knownFactsCount": number }
  ],
  "subQuestions": ["string", "string"],
  "hypotheses": ["string"],
  "searchStrategy": "string (strategy description, priority sources: official reports, filings, primary docs)",
  "queries": ["string (concise query 1)", "string (concise query 2)"],
  "memoryHits": [
    { "entityName": "string", "matchedFacts": ["string"] }
  ]
}`;

    try {
      const { data, usage } = await geminiService.generateJson<ResearchPlan>(userPrompt, undefined, systemPrompt);

      // Verify and merge memory hits
      const finalMemoryHits = memoryStore.findRelevant(
        question,
        data.targetEntities?.map(e => e.name) || []
      );

      return {
        plan: {
          targetEntities: data.targetEntities || [],
          subQuestions: data.subQuestions || [question],
          hypotheses: data.hypotheses || [],
          searchStrategy: data.searchStrategy || 'Direct primary source and authoritative retrieval',
          queries: data.queries && data.queries.length > 0 ? data.queries : [question],
          memoryHits: finalMemoryHits.map(m => ({
            entityName: m.entityName,
            matchedFacts: m.facts.map(f => `${f.key}: ${f.value}`),
          })),
        },
        memoryHits: finalMemoryHits,
        inputTokens: usage.inputTokens,
        outputTokens: usage.outputTokens,
      };
    } catch (err) {
      console.warn('Planner agent fallback triggered:', err);
      // Fallback heuristic plan
      return {
        plan: {
          targetEntities: [{ name: question.split(' ')[0] || 'Target', type: 'organization', knownFactsCount: 0 }],
          subQuestions: [question],
          hypotheses: ['Direct factual evidence is available in primary documentation.'],
          searchStrategy: 'Search official web resources and cross-verify with reputable reporting.',
          queries: [question, `${question} official report`],
          memoryHits: preliminaryMemoryHits.map(m => ({
            entityName: m.entityName,
            matchedFacts: m.facts.map(f => `${f.key}: ${f.value}`),
          })),
        },
        memoryHits: preliminaryMemoryHits,
        inputTokens: 0,
        outputTokens: 0,
      };
    }
  }
}

export const plannerAgent = new PlannerAgent();
