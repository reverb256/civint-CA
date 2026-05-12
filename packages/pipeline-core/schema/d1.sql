-- civint-CA canonical D1 schema
-- Based on Frostbite Gazette D1 schema, generalized for multi-tenant pipeline

-- Curated articles with AI scores
CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  summary TEXT,
  content TEXT,
  url TEXT NOT NULL,
  url_hash TEXT UNIQUE NOT NULL,
  source TEXT NOT NULL,
  source_id INTEGER,
  published_at DATETIME,
  category TEXT,
  curation_score REAL,
  canadian_relevance INTEGER,
  accountability_value INTEGER,
  mission_alignment INTEGER,
  source_quality INTEGER,
  urgency INTEGER,
  curation_reason TEXT,
  is_breaking INTEGER DEFAULT 0,
  votes INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- RSS feed sources
CREATE TABLE IF NOT EXISTS rss_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  url TEXT NOT NULL UNIQUE,
  category TEXT,
  is_active INTEGER DEFAULT 1,
  last_fetched_at DATETIME,
  fetch_count INTEGER DEFAULT 0,
  error_count INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Community voting
CREATE TABLE IF NOT EXISTS votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id INTEGER NOT NULL,
  user_id TEXT,
  ip_address TEXT,
  direction INTEGER NOT NULL CHECK(direction IN (-1, 1)),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (article_id) REFERENCES articles(id)
);

-- Citation hashes for content provenance
CREATE TABLE IF NOT EXISTS citation_hashes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id INTEGER NOT NULL UNIQUE,
  content_hash TEXT NOT NULL,
  algorithm TEXT DEFAULT 'sha256',
  hash_length INTEGER,
  computed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  verified_count INTEGER DEFAULT 0,
  last_verified_at DATETIME,
  FOREIGN KEY (article_id) REFERENCES articles(id)
);

-- Government data releases cache
CREATE TABLE IF NOT EXISTS gov_releases_cache (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  release_date TEXT,
  data_url TEXT,
  jurisdiction TEXT DEFAULT 'federal',
  category TEXT,
  retrieved_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(source, title)
);

-- Quota tracking
CREATE TABLE IF NOT EXISTS quota_usage (
  date TEXT PRIMARY KEY,
  worker_requests INTEGER DEFAULT 0,
  d1_writes INTEGER DEFAULT 0,
  d1_reads INTEGER DEFAULT 0,
  articles_processed INTEGER DEFAULT 0,
  ai_requests INTEGER DEFAULT 0,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Audit log for AI transparency
CREATE TABLE IF NOT EXISTS audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  operation TEXT NOT NULL,
  model TEXT,
  input_snapshot TEXT,
  output_snapshot TEXT,
  confidence REAL,
  user_id TEXT,
  article_id INTEGER,
  FOREIGN KEY (article_id) REFERENCES articles(id)
);

CREATE INDEX IF NOT EXISTS idx_articles_url_hash ON articles(url_hash);
CREATE INDEX IF NOT EXISTS idx_articles_source ON articles(source);
CREATE INDEX IF NOT EXISTS idx_articles_score ON articles(curation_score);
CREATE INDEX IF NOT EXISTS idx_gov_releases_jurisdiction ON gov_releases_cache(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_audit_log_operation ON audit_log(operation);
CREATE INDEX IF NOT EXISTS idx_audit_log_article ON audit_log(article_id);
