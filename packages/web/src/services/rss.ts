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
			return this.getFallbackResult(feedUrl);
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

	private getFallbackResult(feedUrl: string): RSSFeedResult {
		const cachedFeedData = this.feedCache.get(feedUrl);
		if (cachedFeedData) {
			return cachedFeedData.feedResult;
		}

		return { items: [], feed: { title: '', favicon: undefined } };
	}

	clearCache(): void {
		this.feedCache.clear();
	}
}

export const rssService = new RSSService();
