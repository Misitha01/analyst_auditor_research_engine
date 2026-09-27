import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || '';
const modelName = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

// USD to INR conversion rate
export const USD_TO_INR = 86.5;

// Pricing per 1M tokens (Gemini 3.8 Flash reference: $0.15 input, $0.60 output)
const COST_PER_1M_INPUT_USD = 0.15;
const COST_PER_1M_OUTPUT_USD = 0.60;

export interface TokenUsageRecord {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  costUsd: number;
  costInr: number;
}

export class GeminiService {
  private ai: GoogleGenAI | null = null;
  public totalInputTokens = 0;
  public totalOutputTokens = 0;

  constructor() {
    if (apiKey) {
      this.ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    } else {
      console.warn('GEMINI_API_KEY not found in environment; mock fallback will be used if needed.');
    }
  }

  public getModelName(): string {
    return modelName;
  }

  public calculateCost(inputTokens: number, outputTokens: number): { costUsd: number; costInr: number } {
    const costUsd = (inputTokens / 1_000_000) * COST_PER_1M_INPUT_USD + (outputTokens / 1_000_000) * COST_PER_1M_OUTPUT_USD;
    const costInr = costUsd * USD_TO_INR;
    return { costUsd, costInr };
  }

  private trackTokens(usage: any): TokenUsageRecord {
    const input = usage?.promptTokenCount || 0;
    const output = usage?.candidatesTokenCount || 0;
    const total = usage?.totalTokenCount || (input + output);

    this.totalInputTokens += input;
    this.totalOutputTokens += output;

    const { costUsd, costInr } = this.calculateCost(input, output);
    return {
      inputTokens: input,
      outputTokens: output,
      totalTokens: total,
      costUsd,
      costInr,
    };
  }

  public async generateText(prompt: string, systemInstruction?: string, temperature = 0.2): Promise<{ text: string; usage: TokenUsageRecord }> {
    if (!this.ai) {
      throw new Error('Gemini AI client is not initialized. Please ensure GEMINI_API_KEY is configured.');
    }

    try {
      const response = await this.ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction,
          temperature,
        },
      });

      const text = response.text || '';
      const usage = this.trackTokens(response.usageMetadata);
      return { text, usage };
    } catch (err: any) {
      console.error('Gemini generateText error:', err?.message || err);
      throw err;
    }
  }

  /**
   * Search Grounding using Google Search tool with gemini-3.5-flash
   */
  public async generateWithGoogleSearch(
    prompt: string,
    systemInstruction?: string,
    model = 'gemini-3.5-flash'
  ): Promise<{
    text: string;
    usage: TokenUsageRecord;
    groundingSources: Array<{ uri: string; title: string }>;
    webSearchQueries: string[];
  }> {
    if (!this.ai) {
      throw new Error('Gemini AI client is not initialized.');
    }

    try {
      const response = await this.ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          systemInstruction,
          temperature: 0.2,
          tools: [{ googleSearch: {} }],
        },
      });

      const text = response.text || '';
      const usage = this.trackTokens(response.usageMetadata);

      const groundingSources: Array<{ uri: string; title: string }> = [];
      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (Array.isArray(chunks)) {
        for (const c of chunks) {
          if (c.web?.uri) {
            groundingSources.push({
              uri: c.web.uri,
              title: c.web.title || new URL(c.web.uri).hostname,
            });
          }
        }
      }

      const webSearchQueries: string[] = response.candidates?.[0]?.groundingMetadata?.webSearchQueries || [];

      return {
        text,
        usage,
        groundingSources,
        webSearchQueries,
      };
    } catch (err: any) {
      if (model !== 'gemini-3.8-flash') {
        console.warn(`Search Grounding failed with ${model}, retrying with gemini-3.8-flash:`, err?.message || err);
        return this.generateWithGoogleSearch(prompt, systemInstruction, 'gemini-3.8-flash');
      }
      console.error('Gemini generateWithGoogleSearch error:', err?.message || err);
      throw err;
    }
  }

  public async generateJson<T>(prompt: string, schema?: any, systemInstruction?: string): Promise<{ data: T; usage: TokenUsageRecord; rawText: string }> {
    if (!this.ai) {
      throw new Error('Gemini AI client is not initialized.');
    }

    try {
      const config: any = {
        systemInstruction,
        temperature: 0.1,
        responseMimeType: 'application/json',
      };
      if (schema) {
        config.responseSchema = schema;
      }

      const response = await this.ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config,
      });

      const rawText = response.text || '{}';
      const usage = this.trackTokens(response.usageMetadata);

      let data: T;
      try {
        data = JSON.parse(rawText) as T;
      } catch (parseErr) {
        // Fallback cleanup if model wrapped in ```json ... ```
        const cleaned = rawText.replace(/```(?:json)?/gi, '').replace(/```/g, '').trim();
        data = JSON.parse(cleaned) as T;
      }

      return { data, usage, rawText };
    } catch (err: any) {
      console.error('Gemini generateJson error:', err?.message || err);
      throw err;
    }
  }
}

export const geminiService = new GeminiService();
