import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { type RSSWidget, type RSSItem } from '../services/data.js';
import { rssService } from '../services/rss.js';

@customElement('fv-rss')
export class RSS extends LitElement {
  @property({ type: Object }) widget!: RSSWidget;
  @state() private items: RSSItem[] = [];
  @state() private feedTitle: string = '';
  @state() private favicon: string | undefined;
  @state() private loading = false;
  @state() private error: string | undefined = undefined;
  @state() private displayCount = 7;
  private autoRefreshInterval: number | undefined;

  static styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .header {
      padding: var(--fv-spacing-sm);
      border-bottom: 1px solid var(--fv-border-light);
      display: flex;
      align-items: center;
      justify-content: space-between;
      background-color: var(--fv-bg-tertiary);
    }

    .title {
      font-size: var(--fv-font-size-sm);
      font-weight: 600;
      color: var(--fv-text-primary);
      margin: 0;
    }

    .refresh-btn {
      background: none;
      border: 1px solid var(--fv-border);
      border-radius: var(--fv-border-radius);
      padding: var(--fv-spacing-xs);
      cursor: pointer;
      color: var(--fv-text-secondary);
      font-size: var(--fv-font-size-sm);
      transition: var(--fv-transition);
    }

    .refresh-btn:hover {
      background-color: var(--fv-bg-primary);
      border-color: var(--fv-accent-primary);
      color: var(--fv-accent-primary);
    }

    .refresh-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .content {
      padding: var(--fv-spacing-sm);
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      position: relative;
    }

    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100px;
      color: var(--fv-text-secondary);
    }

    .error {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100px;
      color: var(--fv-danger);
      text-align: center;
      font-size: var(--fv-font-size-sm);
    }

    .items {
      list-style: none;
      margin: 0;
      padding: 0;
      min-height: 100%;
    }

    .item {
      border-bottom: 1px solid var(--fv-border-light);
      padding: var(--fv-spacing-xs) 0;
    }

    .item:last-child {
      border-bottom: none;
    }

    .item-link {
      display: flex;
      align-items: center;
      justify-content: space-between;
      text-decoration: none;
      color: var(--fv-text-primary);
      transition: var(--fv-transition);
      gap: var(--fv-spacing-sm);
    }

    .item-link:hover {
      color: var(--fv-accent-primary);
    }

    .item-title {
      font-size: var(--fv-font-size-sm);
      font-weight: 500;
      line-height: 1.2;
      margin: 0;
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .item-date {
      font-size: var(--fv-font-size-xs);
      color: var(--fv-text-muted);
      margin: 0;
      flex-shrink: 0;
    }

    .empty {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100px;
      color: var(--fv-text-secondary);
      font-size: var(--fv-font-size-sm);
    }

    .load-indicator {
      padding: var(--fv-spacing-sm);
      text-align: center;
      color: var(--fv-text-muted);
      font-size: var(--fv-font-size-xs);
    }

    .header-content {
      display: flex;
      align-items: center;
      gap: var(--fv-spacing-sm);
      min-width: 0;
      flex: 1;
    }

    .favicon {
      width: 20px;
      height: 20px;
      border-radius: 4px;
      background: var(--fv-bg-secondary);
      object-fit: contain;
      flex-shrink: 0;
    }

    .header-title {
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
    }
  `;

  async connectedCallback() {
    super.connectedCallback();
    await this.loadFeed();
    this.autoRefreshInterval = window.setInterval(() => {
      this.loadFeed();
    }, 5 * 60 * 1000); // 5 minutes
  }

  disconnectedCallback() {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }
    super.disconnectedCallback();
  }

  private async loadFeed() {
    this.loading = true;
    this.error = undefined;
    this.displayCount = 7;
    try {
      const result = await rssService.fetchFeed(this.widget.feedUrl);
      this.items = result.items;
      this.feedTitle = result.feed.title || this.widget.title;
      this.favicon = result.feed.favicon;
    } catch (error) {
      this.error = 'Failed to load RSS feed';
      this.feedTitle = this.widget.title;
      this.favicon = undefined;
      console.error('RSS feed error:', error);
    } finally {
      this.loading = false;
    }
  }

  private formatDate(dateString: string): string {
    try {
      const publicationDate = new Date(dateString);
      const currentTime = new Date();
      const timeDifferenceMs = currentTime.getTime() - publicationDate.getTime();
      const daysDifference = Math.floor(timeDifferenceMs / (1000 * 60 * 60 * 24));
      
      if (daysDifference === 0) {
        return this.formatSameDayTime(timeDifferenceMs);
      } else if (daysDifference === 1) {
        return 'Yesterday';
      } else if (daysDifference < 7) {
        return `${daysDifference}d ago`;
      } else {
        return publicationDate.toLocaleDateString();
      }
    } catch (error) {
      return dateString;
    }
  }

  private formatSameDayTime(timeDifferenceMs: number): string {
    const hoursDifference = Math.floor(timeDifferenceMs / (1000 * 60 * 60));
    if (hoursDifference === 0) {
      const minutesDifference = Math.floor(timeDifferenceMs / (1000 * 60));
      return minutesDifference <= 1 ? 'Just now' : `${minutesDifference}m ago`;
    }
    return `${hoursDifference}h ago`;
  }

  private handleScroll(event: Event) {
    const element = event.target as HTMLElement;
    const threshold = 50;
    
    if (element.scrollTop + element.clientHeight >= element.scrollHeight - threshold) {
      this.loadMoreItems();
    }
  }

  private loadMoreItems() {
    if (this.displayCount < this.items.length) {
      this.displayCount = Math.min(this.displayCount + 7, this.items.length);
    }
  }

  render() {
    const displayItems = this.items.slice(0, this.displayCount);
    const hasMoreItems = this.displayCount < this.items.length;

    return html`
      <div class="header">
        <span class="header-content">
          <img
            src="${this.favicon || 'data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Ccircle cx=\'10\' cy=\'10\' r=\'10\' fill=\'%23ff9800\'/%3E%3Cpath d=\'M6 15a1 1 0 110-2 1 1 0 010 2zm2.5-1a1 1 0 110-2c3.59 0 6.5-2.91 6.5-6.5a1 1 0 112 0c0 4.694-3.806 8.5-8.5 8.5z\' fill=\'white\'/%3E%3C/svg%3E'}"
            alt="Favicon"
            class="favicon"
            @error=${(e: Event) => {
              const img = e.currentTarget as HTMLImageElement;
              img.src = 'data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' fill=\'none\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Ccircle cx=\'10\' cy=\'10\' r=\'10\' fill=\'%23ff9800\'/%3E%3Cpath d=\'M6 15a1 1 0 110-2 1 1 0 010 2zm2.5-1a1 1 0 110-2c3.59 0 6.5-2.91 6.5-6.5a1 1 0 112 0c0 4.694-3.806 8.5-8.5 8.5z\' fill=\'white\'/%3E%3C/svg%3E';
            }}
          />
          <h2 class="title header-title" title="${this.feedTitle}">${this.feedTitle}</h2>
        </span>
      </div>
      <div class="content" @scroll=${this.handleScroll}>
        ${this.loading ? html`
          <div class="loading">Loading...</div>
        ` : this.error ? html`
          <div class="error">${this.error}</div>
        ` : this.items.length === 0 ? html`
          <div class="empty">No items found</div>
        ` : html`
          <ul class="items">
            ${displayItems.map(item => html`
              <li class="item">
                <a 
                  href="${item.link}" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  class="item-link">
                  <span class="item-title">${item.title}</span>
                  <span class="item-date">${this.formatDate(item.pubDate)}</span>
                </a>
              </li>
            `)}
          </ul>
          ${hasMoreItems ? html`
            <div class="load-indicator">
              Scroll down for more items (${this.items.length - this.displayCount} remaining)
            </div>
          ` : ''}
        `}
      </div>
    `;
  }
}
