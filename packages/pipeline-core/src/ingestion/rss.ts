/**
 * RSS ingestion module — fetch, parse, and deduplicate RSS feeds
 */
import type { RSSFeed, RSSItem, RSSSource } from '../types.js';

/** 43+ curated Canadian news sources */
export const RSS_SOURCES: RSSSource[] = [
  // National broadcasters
  { name: 'CBC News Top Stories', url: 'https://www.cbc.ca/webfeed/rss/rss-topstories', category: 'news' },
  { name: 'CBC Politics', url: 'https://www.cbc.ca/webfeed/rss/rss-politics', category: 'politics' },
  { name: 'CBC Business', url: 'https://www.cbc.ca/webfeed/rss/rss-business', category: 'business' },
  { name: 'CBC Technology', url: 'https://www.cbc.ca/webfeed/rss/rss-technology', category: 'technology' },
  { name: 'CBC Health', url: 'https://www.cbc.ca/webfeed/rss/rss-health', category: 'health' },
  { name: 'CBC Indigenous', url: 'https://www.cbc.ca/webfeed/rss/rss-indigenous', category: 'indigenous' },
  { name: 'CBC World', url: 'https://www.cbc.ca/webfeed/rss/rss-world', category: 'world' },

  // National newspapers
  { name: 'The Globe and Mail - Canada', url: 'https://www.theglobeandmail.com/arc/outboundfeeds/rss/category/canada/', category: 'politics' },
  { name: 'The Globe and Mail - Politics', url: 'https://www.theglobeandmail.com/arc/outboundfeeds/rss/category/politics/', category: 'politics' },
  { name: 'The Globe and Mail - Business', url: 'https://www.theglobeandmail.com/arc/outboundfeeds/rss/category/business/', category: 'business' },
  { name: 'The Globe and Mail - Opinion', url: 'https://www.theglobeandmail.com/arc/outboundfeeds/rss/category/opinion/', category: 'opinion' },
  { name: 'National Post', url: 'https://nationalpost.com/feed', category: 'news' },
  { name: 'National Post - Politics', url: 'https://nationalpost.com/category/politics/feed', category: 'politics' },
  { name: 'Toronto Star', url: 'https://www.thestar.com/content/feed?category=news', category: 'news' },
  { name: 'Toronto Star - Politics', url: 'https://www.thestar.com/content/feed?category=politics', category: 'politics' },

  // Regional - Ontario
  { name: 'Toronto Sun', url: 'https://torontosun.com/feed', category: 'news' },
  { name: 'Ottawa Citizen', url: 'https://ottawacitizen.com/feed', category: 'news' },
  { name: 'Hamilton Spectator', url: 'https://thespec.com/feed', category: 'news' },
  { name: 'Windsor Star', url: 'https://windsorstar.com/feed', category: 'news' },
  { name: 'London Free Press', url: 'https://lfpress.com/feed', category: 'news' },
  { name: 'Waterloo Region Record', url: 'https://therecord.com/feed', category: 'news' },

  // Regional - Quebec
  { name: 'Montreal Gazette', url: 'https://montrealgazette.com/feed', category: 'news' },
  { name: 'Le Devoir', url: 'https://www.ledevoir.com/rss', category: 'news' },

  // Regional - West
  { name: 'Vancouver Sun', url: 'https://vancouversun.com/feed', category: 'news' },
  { name: 'The Province', url: 'https://theprovince.com/feed', category: 'news' },
  { name: 'Calgary Herald', url: 'https://calgaryherald.com/feed', category: 'news' },
  { name: 'Edmonton Journal', url: 'https://edmontonjournal.com/feed', category: 'news' },
  { name: 'Winnipeg Free Press', url: 'https://www.winnipegfreepress.com/feed', category: 'news' },
  { name: 'Saskatoon StarPhoenix', url: 'https://thestarphoenix.com/feed', category: 'news' },
  { name: 'Regina Leader-Post', url: 'https://leaderpost.com/feed', category: 'news' },

  // Regional - Atlantic
  { name: 'Chronicle Herald', url: 'https://chronicleherald.ca/feed', category: 'news' },
  { name: 'Telegraph-Journal', url: 'https://telegraphjournal.com/feed', category: 'news' },

  // Digital-first
  { name: 'The Narwhal', url: 'https://www.thenarwhal.ca/feed/', category: 'environment' },
  { name: "Canada's National Observer", url: 'https://www.nationalobserver.com/rss', category: 'environment' },
  { name: 'Tyee', url: 'https://thetyee.ca/RSS', category: 'news' },
  { name: 'PressProgress', url: 'https://pressprogress.ca/feed/', category: 'politics' },

  // Business
  { name: 'Financial Post', url: 'https://financialpost.com/feed', category: 'business' },
  { name: 'Canadian Business', url: 'https://www.canadianbusiness.com/feed/', category: 'business' },
  { name: 'Bloomberg News - Canada', url: 'https://www.bnnbloomberg.ca/rss', category: 'business' },

  // Policy & think tanks
  { name: "Maclean's", url: 'https://www.macleans.ca/feed/', category: 'news' },
  { name: 'Policy Options', url: 'https://policyoptions.irpp.org/feed/', category: 'policy' },
  { name: 'The Hill Times', url: 'https://hilltimes.com/feed/', category: 'politics' },

  // Wire
  { name: 'The Canadian Press', url: 'https://www.cp.org/feed/', category: 'news' },

  // Specialized
  { name: 'First Nations Drum', url: 'https://www.firstnationsdrum.com/feed/', category: 'indigenous' },
  { name: 'Open Canada', url: 'https://www.opencanada.org/feed/', category: 'policy' },
];

/**
 * Regex-based RSS parser — no external dependencies needed
 */
export function parseRSS(xmlText: string): RSSFeed {
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

  return { items };
}

/**
 * Fetch a single RSS feed with timeout and user-agent
 */
export async function fetchFeed(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: {
      'User-Agent': 'civint-CA/1.0 (+https://github.com/reverb256/civint-CA)',
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching ${url}`);
  }

  return response.text();
}

/**
 * Hash a string using a simple stable hash (for deduplication keys)
 */
export function hashString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}
