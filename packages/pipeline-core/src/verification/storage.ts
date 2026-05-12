/**
 * Verification storage adapter interface — works with D1, SQLite, or Postgres
 */

export interface CitationRecord {
  article_id: string;
  content_hash: string;
  algorithm: string;
  hash_length: number | null;
  computed_at: string;
  verified_count: number;
  last_verified_at: string | null;
}

export function generateDefaultSchema(): string {
  return `
-- Citation hashes for content provenance
CREATE TABLE IF NOT EXISTS citation_hashes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  article_id INTEGER NOT NULL,
  content_hash TEXT NOT NULL,
  algorithm TEXT DEFAULT 'sha256',
  hash_length INTEGER,
  computed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  verified_count INTEGER DEFAULT 0,
  last_verified_at DATETIME,
  UNIQUE(article_id)
);
`;
}
