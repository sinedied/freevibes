import { type RSSItem } from './data.js';

class RSSService {
  private cache = new Map<string, { items: RSSItem[]; timestamp: number }>();
  private cacheExpiry = 10 * 60 * 1000; // 10 minutes

  async fetchFeed(url: string): Promise<RSSItem[]> {
    // Check cache first
    const cached = this.cache.get(url);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.items;
    }

    try {
      // Use a CORS proxy for RSS feeds
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

      // Cache the results
      this.cache.set(url, { items, timestamp: Date.now() });
      
      return items;
    } catch (error) {
      console.error('Failed to fetch RSS feed:', error);
      
      // Return cached data if available, even if expired
      const cached = this.cache.get(url);
      if (cached) {
        return cached.items;
      }
      
      // Return empty array if no cache available
      return [];
    }
  }

  clearCache(): void {
    this.cache.clear();
  }
}

export const rssService = new RSSService();
