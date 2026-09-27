import * as cheerio from 'cheerio';
import { Source } from '../types/index.ts';

export interface PageContent {
  title: string;
  extractedText: string;
  publicationDate?: string;
  author?: string;
  canonicalUrl?: string;
  wordCount: number;
}

export class PageFetcher {
  private cache: Map<string, PageContent> = new Map();

  /**
   * Fetch a web page and extract clean article text and metadata
   */
  public async fetchAndParse(url: string, timeoutMs = 6000): Promise<{ content: PageContent; latencyMs: number; status: 'fetched' | 'failed' | 'timeout' }> {
    if (this.cache.has(url)) {
      return { content: this.cache.get(url)!, latencyMs: 0, status: 'fetched' };
    }

    const start = Date.now();
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 VeritasAI/1.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
      });
      clearTimeout(timeout);

      if (!response.ok) {
        return {
          content: {
            title: 'HTTP Error',
            extractedText: `Source returned HTTP status ${response.status} (${response.statusText}).`,
            wordCount: 0,
          },
          latencyMs: Date.now() - start,
          status: 'failed',
        };
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Remove unwanted elements
      $('script, style, noscript, nav, footer, iframe, header, svg, form, ads, .cookie-banner, .advertisement').remove();

      const title = $('meta[property="og:title"]').attr('content') || $('title').text().trim() || 'Untitled Document';
      const publicationDate = 
        $('meta[property="article:published_time"]').attr('content') ||
        $('meta[name="date"]').attr('content') ||
        $('time').attr('datetime') ||
        $('time').text().trim() ||
        undefined;

      const author = $('meta[name="author"]').attr('content') || $('meta[property="article:author"]').attr('content');
      const canonicalUrl = $('link[rel="canonical"]').attr('href') || url;

      // Prefer article or main content if available
      let mainText = $('article, main, .post-content, .entry-content, #content').text();
      if (!mainText || mainText.trim().length < 200) {
        mainText = $('body').text();
      }

      // Clean excessive whitespace
      const cleaned = mainText.replace(/\s+/g, ' ').replace(/\n+/g, ' ').trim();
      // Cap at 15,000 characters to prevent prompt bloat while retaining high information density
      const truncated = cleaned.slice(0, 15000);

      const content: PageContent = {
        title,
        extractedText: truncated,
        publicationDate,
        author,
        canonicalUrl,
        wordCount: truncated.split(' ').length,
      };

      this.cache.set(url, content);
      return {
        content,
        latencyMs: Date.now() - start,
        status: 'fetched',
      };
    } catch (err: any) {
      clearTimeout(timeout);
      const isTimeout = err.name === 'AbortError' || err.message?.includes('abort');
      return {
        content: {
          title: 'Fetch Failed',
          extractedText: isTimeout ? 'Request timed out while connecting to source.' : `Connection error: ${err.message}`,
          wordCount: 0,
        },
        latencyMs: Date.now() - start,
        status: isTimeout ? 'timeout' : 'failed',
      };
    }
  }

  /**
   * Fetch multiple sources concurrently with latency measurement
   */
  public async fetchSourcesParallel(sources: Source[]): Promise<{ updatedSources: Source[]; totalLatencyMs: number; sequentialEquivalentMs: number }> {
    const startTime = Date.now();
    let sequentialEquivalentMs = 0;

    const promises = sources.map(async (src) => {
      // If already has adequate fullText (e.g. from Wikipedia API / DDG Abstract), enrich only if empty
      if (src.fullText && src.fullText.length > 500) {
        return src;
      }

      const res = await this.fetchAndParse(src.url);
      sequentialEquivalentMs += res.latencyMs;

      return {
        ...src,
        title: res.content.title && res.content.title !== 'Untitled Document' ? res.content.title : src.title,
        fullText: res.content.extractedText && res.content.extractedText.length > src.fullText.length ? res.content.extractedText : src.fullText,
        publicationDate: res.content.publicationDate || src.publicationDate,
        fetchStatus: res.status,
        fetchLatencyMs: res.latencyMs,
      };
    });

    const updatedSources = await Promise.all(promises);
    const totalLatencyMs = Date.now() - startTime;

    return {
      updatedSources,
      totalLatencyMs,
      sequentialEquivalentMs,
    };
  }
}

export const pageFetcher = new PageFetcher();
