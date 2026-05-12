/**
 * RSS ingestion — fetch and parse RSS feeds
 */

import type { RSSItem } from '../types.js';

/**
 * Parse RSS XML text into items using regex (no external deps)
 */
export function parseRSS(xmlText: string): RSSItem[] {
  const items: RSSItem[] = [];
  const itemMatches = xmlText.match(/<item[^>]*>[\s\S]*?<\/item>/gi) || [];

  for (const itemBlock of itemMatches) {
    const item: RSSItem = {};

    const titleMatch = itemBlock.match(/<title[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/i);
    if (titleMatch) item.title = titleMatch[1].trim();

    const linkMatch = itemBlock.match(/<link[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/link>/i);
    if (linkMatch) item.link = linkMatch[1].trim();

    const guidMatch = itemBlock.match(/<guid[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/guid>/i);
    if (guidMatch) item.guid = guidMatch[1].trim();

    const pubDateMatch = itemBlock.match(/<pubDate[^>]*>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/pubDate>/i);
    if (pubDateMatch) item.pubDate = pubDateMatch[1].trim();

    const descMatch = itemBlock.match(/<description[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i);
    if (descMatch) {
      item.contentSnippet = descMatch[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
      item.content = descMatch[1];
    }

    const contentMatch = itemBlock.match(/<content:encoded[^>]*>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/content:encoded>/i);
    if (contentMatch) {
      item.content = contentMatch[1];
    }

    if (item.title || item.link) {
      items.push(item);
    }
  }

  return items;
}

/**
 * Fetch a single RSS feed and parse it
 */
export async function fetchRSS(url: string): Promise<{ items: RSSItem[]; source: string }> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; civint-CA/0.1.0)',
      'Accept': 'application/rss+xml, application/xml, text/xml',
    },
  });

  if (!response.ok) {
    throw new Error(`RSS fetch failed: ${url} — HTTP ${response.status}`);
  }

  const text = await response.text();
  const items = parseRSS(text);

  return { items, source: url };
}
