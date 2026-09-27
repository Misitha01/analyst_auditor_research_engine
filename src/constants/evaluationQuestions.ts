import { EvalQuestion } from '../types/index.ts';

export const EVALUATION_QUESTIONS: EvalQuestion[] = [
  {
    id: 'EVAL_1',
    category: 'simple_factual',
    question: 'Who is the current CEO of Google DeepMind, in what year did they assume office, and where did they complete their undergraduate degree?',
    description: 'Direct factual verification of executive leadership, appointment dates, and university degree credentials.',
    expectedEntities: ['Google DeepMind', 'Demis Hassabis', 'University of Cambridge'],
  },
  {
    id: 'EVAL_2',
    category: 'multi_source',
    question: 'What is the valuation and total capital raised by Databricks as of their latest official Series I funding round?',
    description: 'Requires reconciling multiple financial reports, press releases, and funding announcements.',
    expectedEntities: ['Databricks', 'Series I', 'Valuation'],
  },
  {
    id: 'EVAL_3',
    category: 'multi_entity',
    question: 'Compare the founding years, headquarters locations, and primary open-source foundation models released by Mistral AI and Anthropic.',
    description: 'Cross-entity comparative analysis across two competing frontier AI laboratories.',
    expectedEntities: ['Mistral AI', 'Anthropic', 'Mixtral', 'Claude'],
  },
  {
    id: 'EVAL_4',
    category: 'temporal',
    question: 'What was Stripe\'s peak valuation in early 2021 compared to its valuation in early 2023, and what key macroeconomic factors caused this adjustment?',
    description: 'Temporal tracking of private market tech valuations across fluctuating interest rate regimes.',
    expectedEntities: ['Stripe', '2021 Valuation', '2023 Valuation'],
  },
  {
    id: 'EVAL_5',
    category: 'conflicting_sources',
    question: 'How many physical retail stores did Warby Parker operate worldwide as of late 2023 according to financial reports?',
    description: 'Discrepancy benchmark: tests detection of 118 vs 125 store counts due to reporting period end dates and franchise/corporate definitions.',
    expectedEntities: ['Warby Parker', 'Store count', 'SEC 10-Q'],
  },
  {
    id: 'EVAL_6',
    category: 'memory_reuse_1',
    question: 'Provide an entity profile of OpenAI\'s founding structure in 2015 and its key early venture backers including Khosla Ventures.',
    description: 'Initial knowledge acquisition for persistent memory store (populates non-profit charter and Khosla Ventures linkage).',
    expectedEntities: ['OpenAI', 'Khosla Ventures', 'Non-profit 501(c)(3)'],
  },
  {
    id: 'EVAL_7',
    category: 'memory_reuse_2',
    question: 'Which of OpenAI\'s early investors also participated in early funding rounds for Stripe, and what was OpenAI\'s original profit cap multiplier?',
    description: 'Memory reuse benchmark: specifically relies on prior persistent entity memory from EVAL_6 and EVAL_4 to avoid redundant searches.',
    expectedEntities: ['OpenAI', 'Khosla Ventures', 'Stripe', '100x profit cap'],
    reuseEntityFromId: 'EVAL_6',
  },
  {
    id: 'EVAL_8',
    category: 'difficult_multi_evidence',
    question: 'Analyze the conflicting benchmark claims, reported parameter counts, and release timeline differences between Meta\'s Llama 3 70B and Anthropic\'s Claude 3.5 Sonnet on HumanEval coding evaluations.',
    description: 'Complex multi-evidence synthesis requiring technical report cross-checking and rigorous citation auditing.',
    expectedEntities: ['Meta Llama 3', 'Claude 3.5 Sonnet', 'HumanEval', 'Parameter count'],
  },
];

export interface AdversarialComparison {
  question: string;
  unaware: {
    sessionId: string;
    claimsTotal: number;
    claimsSupported: number;
    claimsUnsupported: number;
    claimsUncited: number;
    citationsPer100Words: number;
    avgSourceQuality: number;
    costInr: number;
    latencyMs: number;
    auditorCatches: number;
  };
  audited: {
    sessionId: string;
    claimsTotal: number;
    claimsSupported: number;
    claimsUnsupported: number;
    claimsUncited: number;
    citationsPer100Words: number;
    avgSourceQuality: number;
    costInr: number;
    latencyMs: number;
    auditorCatches: number;
  };
  delta: {
    unsupportedReduction: number;
    citationDensityIncrease: number;
    costDifferenceInr: number;
  };
}

export interface ResilienceReportItem {
  testName: string;
  injectedFailure: string;
  behavior: string;
  systemRecovered: boolean;
  errorLogged: boolean;
  auditorIntervention: boolean;
  recoveryTrace: string;
}
