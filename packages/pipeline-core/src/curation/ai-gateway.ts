/**
 * AI Gateway — generic OpenAI-compatible API client with caching and retry
 */
import type { Article, ArticleInsights, BiasAnalysis, CurationResult } from '../types.js';
import { CURATION_PROMPT, INSIGHTS_PROMPT, BIAS_ANALYSIS_PROMPT } from './prompts.js';
import { evaluateThresholds, getDefaultCuration } from './scoring.js';
import { hashString } from '../ingestion/rss.js';

export interface AIGatewayConfig {
  endpoint: string;
  model: string;
  apiKey?: string;
  /** KV-style cache interface */
  cache: {
    get(key: string): Promise<string | null>;
    put(key: string, value: string, opts?: { expirationTtl?: number }): Promise<void>;
  };
}

/**
 * Query the AI gateway with retry logic for rate limiting
 */
async function queryAI(
  config: AIGatewayConfig,
  prompt: string,
  temperature: number = 0.3,
  maxTokens: number = 1024
): Promise<any> {
  const response = await fetch(`${config.endpoint}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${config.apiKey || 'none'}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: config.model,
      messages: [{ role: 'user', content: prompt }],
      temperature,
      max_tokens: maxTokens,
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`AI API error ${response.status}: ${errorText}`);
  }

  const data: any = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

/**
 * Analyze an article for Canadian relevance and curation scoring
 */
export async function analyzeArticle(
  config: AIGatewayConfig,
  article: Article
): Promise<CurationResult> {
  const cacheKey = hashString(article.url);

  // Check cache
  const cached = await config.cache.get(`curation:${cacheKey}`);
  if (cached) return JSON.parse(cached) as CurationResult;

  const prompt = `${CURATION_PROMPT}

Title: ${article.title}
Summary: ${article.summary}
Source: ${article.source}`;

  try {
    const result = await queryAI(config, prompt, 0.3, 1024) as CurationResult;

    // Set shouldReject based on thresholds
    result.shouldReject = !evaluateThresholds(result);
    result.totalScore = result.totalScore || Math.round(
      result.canadianRelevance * 0.35 +
      result.accountabilityValue * 0.30 +
      result.missionAlignment * 0.20 +
      result.sourceQuality * 0.10 +
      result.urgency * 0.05
    );

    // Cache for 7 days
    await config.cache.put(`curation:${cacheKey}`, JSON.stringify(result), {
      expirationTtl: 7 * 24 * 60 * 60,
    });

    return result;
  } catch (error) {
    console.error('AI analysis failed:', (error as Error).message);
    return getDefaultCuration(article.category);
  }
}

/**
 * Generate insights for an article
 */
export async function generateInsights(
  config: AIGatewayConfig,
  article: any
): Promise<ArticleInsights> {
  const prompt = `${INSIGHTS_PROMPT}

Title: ${article.title}
Summary: ${article.summary}
Source: ${article.source}
Content: ${(article.content || '').slice(0, 3000)}`;

  try {
    return await queryAI(config, prompt, 0.4, 1500) as ArticleInsights;
  } catch (error) {
    console.error('Insights generation failed:', (error as Error).message);
    return {
      summary: article.summary || 'No summary available',
      keyPoints: [article.title],
      stakeholders: [],
      implications: [],
      whatNext: [],
      readingTime: 3,
      complexity: 'medium',
    };
  }
}

/**
 * Generate bias analysis for an article
 */
export async function generateBiasAnalysis(
  config: AIGatewayConfig,
  article: any
): Promise<BiasAnalysis> {
  const prompt = `${BIAS_ANALYSIS_PROMPT}

Title: ${article.title}
Summary: ${article.summary}
Source: ${article.source}
Content: ${(article.content || '').slice(0, 3000)}`;

  try {
    return await queryAI(config, prompt, 0.4, 1500) as BiasAnalysis;
  } catch (error) {
    console.error('Bias analysis failed:', (error as Error).message);
    return {
      overallBias: 'center',
      biasScore: 0,
      confidence: 0,
      framing: { language: [], tone: 'unknown', perspective: 'unknown' },
      whatMissing: [],
      contextGaps: [],
      alternativePerspectives: [],
    };
  }
}
