/** Shared types for the civint-CA pipeline */

export interface Article {
  title: string;
  summary: string;
  content?: string;
  url: string;
  source: string;
  publishedAt: string;
  category: string;
}

export interface RSSItem {
  title?: string;
  link?: string;
  guid?: string;
  contentSnippet?: string;
  content?: string;
  pubDate?: string;
}

export interface RSSFeed {
  items?: RSSItem[];
}

export interface RSSSource {
  name: string;
  url: string;
  category: string;
}

export interface CurationResult {
  canadianRelevance: number;
  accountabilityValue: number;
  missionAlignment: number;
  sourceQuality: number;
  urgency: number;
  totalScore: number;
  reason: string;
  shouldReject: boolean;
  isBreaking: boolean;
  category: string;
}

export interface ArticleInsights {
  summary: string;
  keyPoints: string[];
  stakeholders: string[];
  implications: string[];
  whatNext: string[];
  readingTime: number;
  complexity: 'low' | 'medium' | 'high';
}

export interface BiasAnalysis {
  overallBias: 'left' | 'center-left' | 'center' | 'center-right' | 'right';
  biasScore: number;
  confidence: number;
  framing: {
    language: string[];
    tone: string;
    perspective: string;
  };
  whatMissing: string[];
  contextGaps: string[];
  alternativePerspectives: string[];
}

export interface AuditEntry {
  timestamp: string;
  operation: string;
  model?: string;
  input?: string;
  output?: string;
  confidence?: number;
  userId?: string;
  articleId?: string;
}

export interface StorageAdapter {
  // Articles
  getArticles(category?: string, limit?: number, minScore?: number): Promise<any[]>;
  getArticle(id: string): Promise<any>;
  insertArticle(article: Article, curation: CurationResult, urlHash: string): Promise<void>;
  articleExists(urlHash: string): Promise<boolean>;

  // Citations
  getCitation(articleId: string): Promise<any>;
  storeHash(articleId: string, hash: string, algorithm?: string, hashLength?: number): Promise<void>;
  incrementVerify(articleId: string): Promise<number>;

  // Gov data
  syncReleases(releases: any[]): Promise<{ inserted: number; skipped: number }>;
  getReleases(jurisdiction?: string, category?: string, limit?: number, offset?: number): Promise<any>;

  // Quota
  getQuota(date: string): Promise<any>;
  trackQuota(date: string, metric: string, increment: number): Promise<void>;

  // Audit
  logAudit(entry: AuditEntry): Promise<void>;
  getAuditTrail(articleId?: string, operation?: string): Promise<AuditEntry[]>;
}
