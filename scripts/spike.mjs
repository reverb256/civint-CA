#!/usr/bin/env node
/**
 * civint-CA vertical slice — federal Canada
 *
 * Fetches CBC Politics RSS → curates via Carnice 3090 MoE → scores → hashes → SQLite
 *
 * Run: node --experimental-sqlite dist/scripts/spike.mjs
 * Requires: npm run build first
 */
import { runPipeline, DEFAULT_SOURCES } from '../packages/pipeline-core/dist/pipeline.js';
import { DatabaseSync } from 'node:sqlite';

const CARNICE = process.env.CARNICE || 'http://127.0.0.1:12370/v1';
const MODEL = 'Carnice-Qwen3.6-MoE-35B-A3B.IQ4_XS.gguf';

async function main() {
  console.log(`civint-CA · Federal Canada spike`);
  console.log(`AI: ${MODEL} @ ${CARNICE}`);
  console.log(`Source: CBC Politics RSS\n`);

  const results = await runPipeline({
    ai: { endpoint: CARNICE, model: MODEL, apiKey: '', temperature: 0.3, maxTokens: 4096 },
    sources: DEFAULT_SOURCES,
  });

  const db = new DatabaseSync('civint-spike.db');
  db.exec(`CREATE TABLE IF NOT EXISTS articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT, url TEXT UNIQUE, source TEXT,
    published_at TEXT, category TEXT, curation_score INTEGER,
    canadian_relevance INTEGER, accountability_value INTEGER, mission_alignment INTEGER,
    source_quality INTEGER, urgency INTEGER, curation_reason TEXT,
    should_reject INTEGER, is_breaking INTEGER, citation_hash TEXT,
    trust_score INTEGER, created_at TEXT DEFAULT (datetime('now'))
  ); CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT, timestamp TEXT DEFAULT (datetime('now')),
    operation TEXT, model TEXT, article_title TEXT, confidence REAL, details TEXT
  );`);
  console.log('DB: civint-spike.db\n');

  for (const r of results) {
    const curation = r.curation;
    const hash = r.citationHash;
    db.prepare(`INSERT OR IGNORE INTO articles
      (title, url, source, published_at, category, curation_score,
       canadian_relevance, accountability_value, mission_alignment,
       source_quality, urgency, curation_reason, should_reject,
       is_breaking, citation_hash, trust_score)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(r.article.title, r.article.url, r.article.source, r.article.publishedAt,
        curation.category, curation.totalScore, curation.canadianRelevance,
        curation.accountabilityValue, curation.missionAlignment, curation.sourceQuality,
        curation.urgency, curation.reason, curation.shouldReject ? 1 : 0,
        curation.isBreaking ? 1 : 0, hash, r.trustScore);

    db.prepare(`INSERT INTO audit_log (operation, model, article_title, confidence, details)
      VALUES (?, ?, ?, ?, ?)`)
      .run('pipeline.curate', MODEL, r.article.title, r.trustScore,
        JSON.stringify({ reason: curation.reason, hash }));

    const status = curation.shouldReject ? '✗' : '✓';
    console.log(`  ${status} ${curation.totalScore}/100 · ${curation.reason.slice(0, 80)}`);
    console.log(`     ${r.article.title.slice(0, 70)}`);
    console.log(`     hash: ${hash}`);
    console.log();
  }

  const count = db.prepare('SELECT COUNT(*) as c FROM articles').get();
  const passed = db.prepare('SELECT COUNT(*) as c FROM articles WHERE should_reject = 0').get();
  console.log(`Stored: ${count.c} · Passed curation: ${passed.c}`);
  db.close();
}

main().catch(e => { console.error('FAILED:', e.message); process.exit(1); });
