

import type { RSSFeedResult } from './rss-xml.js';
import { fetchAndParseFeed } from './rss-xml.js';

class RSSService {
  private cache = new Map<string, { result: RSSFeedResult; timestamp: number }>();
  private cacheExpiry = 10 * 60 * 1000; // 10 minutes

  async fetchFeed(url: string): Promise<RSSFeedResult> {
    const cached = this.cache.get(url);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.result;
    }
    try {
      const result = await fetchAndParseFeed(url);
      // Try to get favicon from domain
      let favicon: string | undefined = undefined;
      try {
        const baseUrl = new URL(url);
        favicon = `${baseUrl.origin}/favicon.ico`;
      } catch {}
      result.feed.favicon = favicon;
      this.cache.set(url, { result, timestamp: Date.now() });
      return result;
    } catch (error) {
      console.error('Failed to fetch RSS feed:', error);
      const cached = this.cache.get(url);
      if (cached) {
        return cached.result;
      }
      return { items: [], feed: { title: '', favicon: undefined } };
    }
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const rssService = new RSSService();
