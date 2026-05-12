#!/usr/bin/env node

/**
 * civint-CA CLI — civilian intelligence toolkit
 */

import { Command } from 'commander';

const program = new Command();

program
  .name('civint')
  .description('Civilian intelligence CLI for Canada — ingest, verify, and query civic data')
  .version('0.1.0');

program
  .command('ingest')
  .description('Ingest RSS feeds or government data')
  .argument('<source>', 'rss | statcan | ckan')
  .action(async (source: string) => {
    console.log(`[civint] ingest ${source} — pipeline backend not yet connected`);
  });

program
  .command('verify')
  .description('Verify article citation hash')
  .argument('<article-id>', 'Article ID to verify')
  .action(async (id: string) => {
    console.log(`[civint] verify ${id} — pipeline backend not yet connected`);
  });

program
  .command('status')
  .description('Show pipeline health')
  .action(async () => {
    console.log('[civint] pipeline status — not yet connected');
  });

program.parse();
