import { type RSSFeedResult, fetchAndParseFeed } from './rss-xml.js';

type CachedFeedData = {
	feedResult: RSSFeedResult;
	cacheTimestamp: number;
};

class RSSService {
	private readonly feedCache = new Map<string, CachedFeedData>();
	private readonly cacheExpiryMs = 10 * 60 * 1000;

	async fetchFeed(feedUrl: string): Promise<RSSFeedResult> {
		const cachedFeedData = this.feedCache.get(feedUrl);
		if (this.isCacheValid(cachedFeedData)) {
			return cachedFeedData.feedResult;
		}

		try {
			const feedResult = await fetchAndParseFeed(feedUrl);
			this.addFaviconToFeed(feedResult, feedUrl);
			this.cacheResult(feedUrl, feedResult);
			return feedResult;
		} catch (error) {
			console.error('Failed to fetch RSS feed:', error);
			const staleCache = this.feedCache.get(feedUrl);
			if (staleCache) {
				return staleCache.feedResult;
			}

			throw error instanceof Error ? error : new Error('Failed to load feed');
		}
	}

	private isCacheValid(cachedData: CachedFeedData | undefined): cachedData is CachedFeedData {
		return cachedData !== undefined && Date.now() - cachedData.cacheTimestamp < this.cacheExpiryMs;
	}

	private addFaviconToFeed(feedResult: RSSFeedResult, feedUrl: string): void {
		try {
			const feedDomain = new URL(feedUrl);
			feedResult.feed.favicon = `${feedDomain.origin}/favicon.ico`;
		} catch {
			feedResult.feed.favicon = undefined;
		}
	}

	private cacheResult(feedUrl: string, feedResult: RSSFeedResult): void {
		this.feedCache.set(feedUrl, {
			feedResult,
			cacheTimestamp: Date.now(),
		});
	}

	clearCache(): void {
		this.feedCache.clear();
	}
}

export const rssService = new RSSService();
