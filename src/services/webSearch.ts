import { Source, SourceType } from '../types/index.ts';
import { geminiService } from './geminiClient.ts';

// Domain classifications for Source Quality
const PRIMARY_DOMAINS = [
  'sec.gov', 'gov', 'edu', 'investor.', 'press.', 'newsroom.', 'annualreport',
  'ir.', 'about.google', 'openai.com/blog', 'anthropic.com/news', 'stripe.com/newsroom',
  'deepmind.google', 'databricks.com/blog', 'warbyparker.com/investors', 'arxiv.org'
];

const REPUTABLE_JOURNALISM = [
  'reuters.com', 'bloomberg.com', 'wsj.com', 'ft.com', 'nytimes.com',
  'apnews.com', 'techcrunch.com', 'cnbc.com', 'bbc.com', 'theverge.com',
  'wired.com', 'forbes.com', 'economist.com'
];

const INDUSTRY_DOMAINS = [
  'pitchbook.com', 'crunchbase.com', 'cbinsights.com', 'venturebeat.com',
  'huggingface.co', 'github.com', 'semianalysis.com', 'statista.com'
];

export interface SearchResultItem {
  title: string;
  url: string;
  snippet: string;
  publicationDate?: string;
}

export class WebSearchEngine {
  private cache: Map<string, Source[]> = new Map();

  /**
   * Determine source type and calculate quality score (0 - 100)
   */
  public evaluateSourceQuality(url: string, title: string): { sourceType: SourceType; score: number } {
    try {
      const parsed = new URL(url);
      const host = parsed.hostname.toLowerCase();
      const path = parsed.pathname.toLowerCase();

      // Check Primary Sources
      for (const p of PRIMARY_DOMAINS) {
        if (host.includes(p) || (host.endsWith('.gov') || host.endsWith('.edu'))) {
          return { sourceType: 'primary', score: 95 };
        }
      }

      // Check Reputable Journalism
      for (const j of REPUTABLE_JOURNALISM) {
        if (host.includes(j)) {
          return { sourceType: 'journalism', score: 85 };
        }
      }

      // Check Industry Trackers
      for (const ind of INDUSTRY_DOMAINS) {
        if (host.includes(ind)) {
          return { sourceType: 'industry', score: 75 };
        }
      }

      // Blog or generic content
      if (host.includes('medium.com') || host.includes('substack.com') || host.includes('wordpress')) {
        return { sourceType: 'secondary', score: 50 };
      }

      return { sourceType: 'secondary', score: 65 };
    } catch {
      return { sourceType: 'unknown', score: 40 };
    }
  }

  /**
   * Deduplicate sources that reference the same article or syndicated wire story
   */
  public deduplicateSources(sources: Source[]): Source[] {
    const seenUrls = new Set<string>();
    const seenTitles = new Map<string, string>(); // normalized title -> source id
    const result: Source[] = [];

    for (const s of sources) {
      // Clean URL: strip query parameters like utm_*, ref, etc.
      let cleanUrl = s.url;
      try {
        const u = new URL(s.url);
        u.search = '';
        cleanUrl = u.toString().toLowerCase();
      } catch {}

      if (seenUrls.has(cleanUrl)) {
        s.isDuplicate = true;
        continue;
      }
      seenUrls.add(cleanUrl);

      // Normalize title for wire syndication detection (e.g., Reuters wire copy-pasted across Yahoo/MSN)
      const normTitle = s.title.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 40);
      if (normTitle.length > 15 && seenTitles.has(normTitle)) {
        s.isDuplicate = true;
        s.clusterId = seenTitles.get(normTitle);
        continue;
      }

      seenTitles.set(normTitle, s.id);
      s.isDuplicate = false;
      result.push(s);
    }

    return result;
  }

  /**
   * Execute real search query via multi-engine fallback (DuckDuckGo Instant / HTML, Wikipedia, or Knowledge Graph)
   */
  public async search(query: string, limit = 5): Promise<Source[]> {
    if (this.cache.has(query)) {
      return this.cache.get(query)!;
    }

    const startTime = Date.now();
    const sources: Source[] = [];

    // 1. Google Search Grounding using gemini-3.5-flash with googleSearch tool
    try {
      const grounded = await geminiService.generateWithGoogleSearch(
        `Search Google for up to date, accurate and verified primary evidence regarding: "${query}". Return factual summaries and authoritative citations.`,
        'You are an authoritative enterprise researcher utilizing real-time Google Search grounding to retrieve current factual sources.',
        'gemini-3.5-flash'
      );

      if (grounded.groundingSources && grounded.groundingSources.length > 0) {
        for (const gs of grounded.groundingSources) {
          if (!sources.some(s => s.url === gs.uri)) {
            const evalQuality = this.evaluateSourceQuality(gs.uri, gs.title);
            sources.push({
              id: `S${sources.length + 1}`,
              url: gs.uri,
              title: gs.title,
              domain: new URL(gs.uri).hostname,
              snippet: grounded.text ? grounded.text.slice(0, 320) : `Google Search Grounded Result for ${query}`,
              fullText: grounded.text || '',
              retrievalDate: new Date().toISOString(),
              sourceType: evalQuality.sourceType,
              qualityScore: Math.max(evalQuality.score, 90), // High authority rating for Google grounded items
              isGoogleGrounded: true,
              fetchStatus: 'fetched',
              fetchLatencyMs: Date.now() - startTime,
            });
          }
        }
      }
    } catch (gErr) {
      console.warn(`Google Search Grounding encountered issue for "${query}", continuing with fallback engines:`, gErr);
    }

    try {
      // 2. DuckDuckGo Instant Search API (secondary / supplement)
      const ddgUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4500);

      const resp = await fetch(ddgUrl, {
        signal: controller.signal,
        headers: { 'User-Agent': 'VeritasAI-ResearchAgent/1.0' },
      });
      clearTimeout(timeout);

      if (resp.ok) {
        const data = await resp.json();

        // Check Abstract / Primary source
        if (data.AbstractURL && data.AbstractText) {
          const evalQuality = this.evaluateSourceQuality(data.AbstractURL, data.Heading || query);
          sources.push({
            id: `S${sources.length + 1}`,
            url: data.AbstractURL,
            title: data.Heading || query,
            domain: new URL(data.AbstractURL).hostname,
            snippet: data.AbstractText,
            fullText: data.AbstractText,
            retrievalDate: new Date().toISOString(),
            sourceType: evalQuality.sourceType,
            qualityScore: evalQuality.score,
            fetchStatus: 'fetched',
            fetchLatencyMs: Date.now() - startTime,
          });
        }

        // Check RelatedTopics
        if (Array.isArray(data.RelatedTopics)) {
          for (const item of data.RelatedTopics.slice(0, limit)) {
            if (item.FirstURL && item.Text && sources.length < limit) {
              const evalQuality = this.evaluateSourceQuality(item.FirstURL, item.Text);
              sources.push({
                id: `S${sources.length + 1}`,
                url: item.FirstURL,
                title: item.Text.split(' - ')[0] || item.Text.slice(0, 60),
                domain: new URL(item.FirstURL).hostname,
                snippet: item.Text,
                fullText: item.Text,
                retrievalDate: new Date().toISOString(),
                sourceType: evalQuality.sourceType,
                qualityScore: evalQuality.score,
                fetchStatus: 'fetched',
                fetchLatencyMs: Date.now() - startTime,
              });
            }
          }
        }
      }
    } catch (err: any) {
      console.warn(`DDG search timed out or failed for query: "${query}". Trying Wikipedia fallback.`);
    }

    // 2. Wikipedia Search API Fallback for authoritative entity information
    if (sources.length < 2) {
      try {
        const wikiSearchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=${limit}&namespace=0&format=json`;
        const wikiResp = await fetch(wikiSearchUrl, { headers: { 'User-Agent': 'VeritasAI/1.0' } });
        if (wikiResp.ok) {
          const wikiData = await wikiResp.json();
          // wikiData format: [search_query, [titles], [descriptions], [urls]]
          const titles = wikiData[1] || [];
          const snippets = wikiData[2] || [];
          const urls = wikiData[3] || [];

          for (let i = 0; i < titles.length && sources.length < limit; i++) {
            if (urls[i] && !sources.some(s => s.url === urls[i])) {
              const evalQuality = this.evaluateSourceQuality(urls[i], titles[i]);
              sources.push({
                id: `S${sources.length + 1}`,
                url: urls[i],
                title: titles[i],
                domain: 'en.wikipedia.org',
                snippet: snippets[i] || `Wikipedia article covering ${titles[i]}`,
                fullText: snippets[i] || '',
                retrievalDate: new Date().toISOString(),
                sourceType: 'secondary',
                qualityScore: 78,
                fetchStatus: 'fetched',
                fetchLatencyMs: Date.now() - startTime,
              });
            }
          }
        }
      } catch (e) {
        console.warn('Wikipedia search fallback failed:', e);
      }
    }

    // Sort by quality score descending
    sources.sort((a, b) => b.qualityScore - a.qualityScore);

    this.cache.set(query, sources);
    return sources;
  }

  /**
   * Execute multiple searches in parallel with concurrency management
   */
  public async searchParallel(queries: string[]): Promise<Map<string, Source[]>> {
    const results = new Map<string, Source[]>();
    const promises = queries.map(async (q) => {
      const sources = await this.search(q);
      results.set(q, sources);
    });

    await Promise.all(promises);
    return results;
  }
}

export const webSearchEngine = new WebSearchEngine();
