import { type RSSItem } from './data.js';

interface RSSFeedInfo {
  title: string;
  favicon?: string;
}

interface RSSFeedResult {
  items: RSSItem[];
  feed: RSSFeedInfo;
}

class RSSService {
  private cache = new Map<string, { result: RSSFeedResult; timestamp: number }>();
  private cacheExpiry = 10 * 60 * 1000; // 10 minutes

  async fetchFeed(url: string): Promise<RSSFeedResult> {
    const cached = this.cache.get(url);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.result;
    }

    try {
      const proxyUrl = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (data.status !== 'ok') {
        throw new Error(`RSS service error: ${data.message}`);
      }

      const items: RSSItem[] = data.items.map((item: any) => ({
        title: item.title,
        link: item.link,
        pubDate: item.pubDate,
        description: item.description
      }));
      let favicon = data.feed?.image || data.feed?.favicon || undefined;
      // If favicon is relative, make it absolute using the feed link
      if (favicon && !/^https?:\/\//.test(favicon)) {
        try {
          const baseUrl = new URL(url);
          favicon = new URL(favicon, baseUrl.origin).href;
        } catch {}
      }
      // If no favicon, fallback to domain favicon
      if (!favicon) {
        try {
          const baseUrl = new URL(url);
          favicon = `${baseUrl.origin}/favicon.ico`;
        } catch {}
      }
      const feed: RSSFeedInfo = {
        title: data.feed?.title || '',
        favicon
      };
      const result: RSSFeedResult = { items, feed };
      this.cache.set(url, { result, timestamp: Date.now() });
      return result;
    } catch (error) {
      console.error('Failed to fetch RSS feed:', error);
      
      // Return cached data if available, even if expired
      const cached = this.cache.get(url);
      if (cached) {
        return cached.result;
      }
      // Return empty result if no cache available
      return { items: [], feed: { title: '', favicon: undefined } };
    }
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export type { RSSFeedResult, RSSFeedInfo };
export const rssService = new RSSService();
