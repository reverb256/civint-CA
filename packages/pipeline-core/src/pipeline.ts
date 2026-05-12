/**
 * Pipeline orchestrator — ties ingestion, curation, verification, and storage together
 */

import { fetchRSS } from './ingestion/rss.js';
import { fetchCKANPackages } from './ingestion/gov-api.js';
import { queryAI, getResponseText, type AIGatewayConfig } from './curation/ai-gateway.js';
import { CURATION_PROMPT, THRESHOLDS, calculateTrustScore, evaluateThresholds } from './curation/scoring.js';
import { hashString } from './verification/hashing.js';
import { createAuditEntry } from './audit/logger.js';
import type { Article, CurationResult, RSSSource } from './types.js';

export interface PipelineConfig {
  ai: AIGatewayConfig;
  sources: RSSSource[];
}

export interface PipelineResult {
  article: Article;
  curation: CurationResult;
  trustScore: number;
  citationHash: string;
  auditEntry: ReturnType<typeof createAuditEntry>;
}

/**
 * Default sources — start with CBC Politics for the federal Canada spike
 */
export const DEFAULT_SOURCES: RSSSource[] = [
  { name: 'CBC Politics', url: 'https://www.cbc.ca/webfeed/rss/rss-politics', category: 'politics' },
  { name: 'CBC News Top Stories', url: 'https://www.cbc.ca/webfeed/rss/rss-topstories', category: 'news' },
];

/**
 * Run the full pipeline: fetch from one RSS source → AI curate → score → hash → audit
 */
export async function runPipeline(
  config: PipelineConfig,
  sourceUrl?: string
): Promise<PipelineResult[]> {
  const source = config.sources.find(s => s.url === sourceUrl) || config.sources[0];
  if (!source) throw new Error('No RSS source configured');

  console.log(`[pipeline] Fetching: ${source.name} (${source.url})`);
  const { items } = await fetchRSS(source.url);

  const results: PipelineResult[] = [];

  for (const item of items.slice(0, 3)) {
    const article: Article = {
      title: item.title || 'Untitled',
      summary: item.contentSnippet || item.content || '',
      content: item.content || '',
      url: item.link || item.guid || '',
      source: source.name,
      publishedAt: item.pubDate || new Date().toISOString(),
      category: source.category,
    };

    console.log(`  → Curation: "${article.title.slice(0, 60)}..."`);
    const curation = await curateArticle(config.ai, article);

    // Scoring
    curation.totalScore = calculateTrustScore(curation);
    const threshold = evaluateThresholds(curation);

    // Citation hash
    const citationHash = hashString(article.url);

    // Audit
    const auditEntry = createAuditEntry({
      operation: 'pipeline.curate',
      model: config.ai.model,
      input: article.title,
      output: JSON.stringify(curation),
      confidence: curation.totalScore,
      articleId: citationHash,
    });

    results.push({
      article,
      curation,
      trustScore: curation.totalScore,
      citationHash,
      auditEntry,
    });

    console.log(`    Score: ${curation.totalScore}/100 | Reject: ${curation.shouldReject || !threshold.passed} | Reason: ${curation.reason}`);
  }

  return results;
}

/**
 * Curate a single article via AI gateway
 */
async function curateArticle(
  aiConfig: AIGatewayConfig,
  article: Article
): Promise<CurationResult> {
  const prompt = `${CURATION_PROMPT}\n\nTitle: ${article.title}\nSummary: ${article.summary}\nSource: ${article.source}`;

  try {
    const response = await queryAI(
      aiConfig,
      [{ role: 'user', content: prompt }],
      { responseFormat: { type: 'json_object' } }
    );

    const parsed = JSON.parse(getResponseText(response)) as CurationResult;
    return {
      ...parsed,
      totalScore: parsed.totalScore || calculateTrustScore(parsed),
    };
  } catch (err: any) {
    console.error(`    AI curation failed: ${err.message}`);
    return {
      canadianRelevance: 0,
      accountabilityValue: 0,
      missionAlignment: 0,
      sourceQuality: 50,
      urgency: 0,
      totalScore: 0,
      reason: `AI curation failed: ${err.message}`,
      shouldReject: true,
      isBreaking: false,
      category: article.category,
    };
  }
}
