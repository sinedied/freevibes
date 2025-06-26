import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { type RSSWidget, type RSSItem } from '../services/data.js';
import { rssService } from '../services/rss.js';
import rssIconUrl from '/rss.svg?url';

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
  private lastKnownHeight: number = 6;

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
      cursor: grab;
      user-select: none;
    }

    .header:active {
      cursor: grabbing;
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
    this.lastKnownHeight = this.widget.height || 6;
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

  updated(changedProperties: Map<string | number | symbol, unknown>) {
    super.updated(changedProperties);
    
    // Check if widget height has changed
    if (changedProperties.has('widget')) {
      const currentHeight = this.widget.height || 6;
      if (currentHeight !== this.lastKnownHeight) {
        this.lastKnownHeight = currentHeight;
        this.updateDisplayCount();
      }
    }
  }

  private updateDisplayCount() {
    // Calculate how many items can fit based on widget height
    const height = this.widget.height || 6;
    
    // Each item takes approximately 1 line of height
    // We subtract 2 lines for the header and padding
    const availableLines = Math.max(1, height - 2);
    
    // Set display count to fit the available space plus 5 more for scrollability
    this.displayCount = Math.min(availableLines + 5, this.items.length);
  }

  private async loadFeed() {
    this.loading = true;
    this.error = undefined;
    try {
      const result = await rssService.fetchFeed(this.widget.feedUrl);
      this.items = result.items;
      this.feedTitle = result.feed.title || this.widget.title;
      this.favicon = result.feed.favicon;
      // Update display count after loading items
      this.updateDisplayCount();
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
      // Load 7 more items when scrolling
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
            src="${this.favicon || rssIconUrl}"
            alt="Favicon"
            class="favicon"
            @error=${(e: Event) => {
              const img = e.currentTarget as HTMLImageElement;
              img.src = rssIconUrl;
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
