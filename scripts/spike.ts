/**
 * Pipeline entry point — vertical spike for federal Canada
 *
 * Run with: npx tsx scripts/spike.ts
 *
 * Fetches CBC Politics RSS → curates via Carnice 3090 MoE → scores → hashes → stores in SQLite
 */

import { runPipeline, type PipelineConfig, DEFAULT_SOURCES } from '../packages/pipeline-core/src/pipeline.js';
import { DatabaseSync } from 'node:sqlite';

const CARINICE_ENDPOINT = process.env.CARNICE_ENDPOINT || 'http://127.0.0.1:12370/v1';
const CARNICE_MODEL = process.env.CARNICE_MODEL || 'Carnice-Qwen3.6-MoE-35B-A3B.IQ4_XS.gguf';

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('  civint-CA — Vertical Slice: Federal Canada');
  console.log('  AI: Carnice 3090 MoE via llama.cpp');
  console.log('  Source: CBC Politics RSS');
  console.log('  Store: local SQLite (node:sqlite)');
  console.log('═══════════════════════════════════════════\n');

  const config: PipelineConfig = {
    ai: {
      endpoint: CARINICE_ENDPOINT,
      model: CARNICE_MODEL,
      apiKey: '',
      temperature: 0.3,
      maxTokens: 1024,
    },
    sources: DEFAULT_SOURCES,
  };

  // Open SQLite database
  const db = new DatabaseSync('./civint-spike.db');
  db.exec(`
    CREATE TABLE IF NOT EXISTS articles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      url TEXT NOT NULL UNIQUE,
      source TEXT NOT NULL,
      published_at TEXT,
      category TEXT,
      curation_score INTEGER,
      canadian_relevance INTEGER,
      accountability_value INTEGER,
      mission_alignment INTEGER,
      source_quality INTEGER,
      urgency INTEGER,
      curation_reason TEXT,
      should_reject INTEGER DEFAULT 1,
      is_breaking INTEGER DEFAULT 0,
      citation_hash TEXT,
      trust_score INTEGER,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp TEXT DEFAULT (datetime('now')),
      operation TEXT NOT NULL,
      model TEXT,
      article_title TEXT,
      confidence REAL,
      details TEXT
    );
  `);
  console.log('[store] SQLite database ready: civint-spike.db\n');

  // Run CBC Politics
  console.log('─── Pipeline Run ───\n');
  const results = await runPipeline(config, DEFAULT_SOURCES[0].url);

  // Store results
  console.log('\n─── Storage ───\n');
  const insert = db.prepare(`
    INSERT OR IGNORE INTO articles
      (title, url, source, published_at, category, curation_score,
       canadian_relevance, accountability_value, mission_alignment,
       source_quality, urgency, curation_reason, should_reject,
       is_breaking, citation_hash, trust_score)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const auditInsert = db.prepare(`
    INSERT INTO audit_log (operation, model, article_title, confidence, details)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const r of results) {
    insert.run(
      r.article.title, r.article.url, r.article.source,
      r.article.publishedAt, r.curation.category, r.curation.totalScore,
      r.curation.canadianRelevance, r.curation.accountabilityValue,
      r.curation.missionAlignment, r.curation.sourceQuality,
      r.curation.urgency, r.curation.reason, r.curation.shouldReject ? 1 : 0,
      r.curation.isBreaking ? 1 : 0, r.citationHash, r.trustScore
    );
    console.log(`  ✓ Stored: "${r.article.title.slice(0, 50)}..."`);

    auditInsert.run(
      r.auditEntry.operation, r.auditEntry.model,
      r.article.title, r.auditEntry.confidence,
      JSON.stringify({ reason: r.curation.reason, score: r.trustScore })
    );
  }

  // Summary
  console.log('\n─── Summary ───\n');
  const count = db.prepare('SELECT COUNT(*) as c FROM articles').get() as any;
  const avgScore = db.prepare('SELECT AVG(curation_score) as avg FROM articles WHERE curation_score > 0').get() as any;
  console.log(`  Articles stored: ${count.c}`);
  console.log(`  Avg score: ${avgScore.avg ? Math.round(avgScore.avg) : 'N/A'}/100`);

  const passed = results.filter(r => !r.curation.shouldReject && r.trustScore >= 60);
  console.log(`  Passed curation: ${passed.length}/${results.length}`);

  console.log('\n  Carnice timing:');
  console.log(`  Prompt → tokens/s: varies by batch`);
  console.log(`  Prediction → tokens/s: varies by batch`);

  console.log('\n═══════════════════════════════════════════');
  console.log('  Spike complete. DB: ./civint-spike.db');
  console.log('═══════════════════════════════════════════\n');

  db.close();
}

main().catch(err => {
  console.error('\n[ERROR] Spike failed:', err.message);
  process.exit(1);
});
