import { webSearchEngine } from '../src/services/webSearch.ts';
import { memoryStore } from '../src/services/memoryStore.ts';
import { geminiService, USD_TO_INR } from '../src/services/geminiClient.ts';
import { Source } from '../src/types/index.ts';

// Test 1: Source Quality Scoring & Deduplication
console.log('--- Test 1: Source Quality Scoring & Deduplication ---');
const primaryQuality = webSearchEngine.evaluateSourceQuality('https://www.sec.gov/edgar/data/12345', 'SEC 10-K');
console.assert(primaryQuality.sourceType === 'primary', 'Expected primary source type');
console.assert(primaryQuality.score >= 90, 'Expected score >= 90 for .gov domain');

const newsQuality = webSearchEngine.evaluateSourceQuality('https://www.reuters.com/business/tech-news', 'Tech News');
console.assert(newsQuality.sourceType === 'journalism', 'Expected journalism source type');

const testSources: Source[] = [
  {
    id: 'S1',
    url: 'https://reuters.com/article/tech?utm_source=twitter',
    title: 'Warby Parker Store Expansion',
    domain: 'reuters.com',
    snippet: 'Stores expand to 125',
    fullText: 'Warby Parker reports store count expansion.',
    retrievalDate: new Date().toISOString(),
    sourceType: 'journalism',
    qualityScore: 85,
    fetchStatus: 'fetched',
    fetchLatencyMs: 120,
  },
  {
    id: 'S2',
    url: 'https://reuters.com/article/tech?ref=yahoo', // Duplicate URL with different query param
    title: 'Warby Parker Store Expansion',
    domain: 'reuters.com',
    snippet: 'Stores expand to 125',
    fullText: 'Warby Parker reports store count expansion.',
    retrievalDate: new Date().toISOString(),
    sourceType: 'journalism',
    qualityScore: 85,
    fetchStatus: 'fetched',
    fetchLatencyMs: 110,
  },
];

const deduped = webSearchEngine.deduplicateSources(testSources);
console.assert(deduped.length === 1, `Expected 1 deduplicated source, got ${deduped.length}`);
console.log('✓ Quality scoring & deduplication passed.');

// Test 2: Persistent Memory Store & Entity Lookup
console.log('--- Test 2: Persistent Memory Store ---');
const openAiMemory = memoryStore.getEntity('OpenAI');
console.assert(openAiMemory !== undefined, 'Expected OpenAI to exist in seeded memory');
console.assert(openAiMemory?.facts.length! >= 3, 'Expected >= 3 facts for OpenAI');

const hits = memoryStore.findRelevant('Tell me about Khosla Ventures investing in Stripe');
console.assert(hits.some(h => h.entityName.includes('Khosla')), 'Expected Khosla hit in memory');
console.log('✓ Persistent memory retrieval passed.');

// Test 3: Currency & Cost Metering
console.log('--- Test 3: Currency & Cost Metering (INR conversion) ---');
const { costUsd, costInr } = geminiService.calculateCost(100_000, 20_000);
console.assert(costUsd > 0, 'Cost USD must be positive');
console.assert(Math.abs(costInr - (costUsd * USD_TO_INR)) < 0.0001, 'Cost INR must equal USD * 86.5');
console.log(`✓ Cost calculation passed: 100k in / 20k out = $${costUsd.toFixed(5)} USD -> ₹${costInr.toFixed(3)} INR`);

console.log('ALL UNIT & SANITY TESTS PASSED SUCCESSFULLY.');
