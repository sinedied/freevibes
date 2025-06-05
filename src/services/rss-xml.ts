export interface RSSItem {
  title: string;
  link: string;
  pubDate: string;
  description?: string;
}

export interface RSSFeedInfo {
  title: string;
  favicon?: string;
}

export interface RSSFeedResult {
  items: RSSItem[];
  feed: RSSFeedInfo;
}

function getTextContent(parent: Element, tag: string): string {
  const el = parent.querySelector(tag);
  return el ? (el.textContent || '').trim() : '';
}

function parseRSS(xml: Document): RSSFeedResult {
  const channel = xml.querySelector('channel');
  const items: RSSItem[] = [];
  if (channel) {
    channel.querySelectorAll('item').forEach(item => {
      items.push({
        title: getTextContent(item, 'title'),
        link: getTextContent(item, 'link'),
        pubDate: getTextContent(item, 'pubDate'),
        description: getTextContent(item, 'description')
      });
    });
  }
  return {
    items,
    feed: {
      title: channel ? getTextContent(channel, 'title') : '',
      favicon: undefined // can be set by consumer
    }
  };
}

function parseAtom(xml: Document): RSSFeedResult {
  const feed = xml.querySelector('feed');
  const items: RSSItem[] = [];
  if (feed) {
    feed.querySelectorAll('entry').forEach(entry => {
      items.push({
        title: getTextContent(entry, 'title'),
        link: (entry.querySelector('link')?.getAttribute('href') || ''),
        pubDate: getTextContent(entry, 'updated') || getTextContent(entry, 'published'),
        description: getTextContent(entry, 'summary') || getTextContent(entry, 'content')
      });
    });
  }
  return {
    items,
    feed: {
      title: feed ? getTextContent(feed, 'title') : '',
      favicon: undefined
    }
  };
}

export async function fetchAndParseFeed(url: string): Promise<RSSFeedResult> {
  const corsProxy = 'https://corsproxy.io/?';
  const response = await fetch(`${corsProxy}${encodeURIComponent(url)}`);
  if (!response.ok) throw new Error(`Failed to fetch RSS feed: ${response.status}`);
  const text = await response.text();
  const parser = new DOMParser();
  const xml = parser.parseFromString(text, 'application/xml');
  if (xml.querySelector('parsererror')) throw new Error('Invalid RSS/Atom XML');
  if (xml.querySelector('channel')) return parseRSS(xml);
  if (xml.querySelector('feed')) return parseAtom(xml);
  throw new Error('Unknown feed format');
}
