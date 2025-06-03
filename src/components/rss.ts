import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { type RSSWidget, type RSSItem } from '../services/data.js';
import { rssService } from '../services/rss.js';

@customElement('fv-rss')
export class RSS extends LitElement {
  @property({ type: Object }) widget!: RSSWidget;
  @state() private items: RSSItem[] = [];
  @state() private loading = false;
  @state() private error: string | null = null;
  @state() private displayCount = 7;

  static styles = css`
    :host {
      display: block;
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
      font-size: var(--fv-font-size-lg);
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
      height: 200px;
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
  `;

  async connectedCallback() {
    super.connectedCallback();
    await this.loadFeed();
  }

  private async loadFeed() {
    this.loading = true;
    this.error = null;
    this.displayCount = 7; // Reset display count when reloading
    
    try {
      this.items = await rssService.fetchFeed(this.widget.feedUrl);
    } catch (error) {
      this.error = 'Failed to load RSS feed';
      console.error('RSS feed error:', error);
    } finally {
      this.loading = false;
    }
  }

  private formatDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) {
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        if (diffHours === 0) {
          const diffMinutes = Math.floor(diffTime / (1000 * 60));
          return diffMinutes <= 1 ? 'Just now' : `${diffMinutes}m ago`;
        }
        return `${diffHours}h ago`;
      } else if (diffDays === 1) {
        return 'Yesterday';
      } else if (diffDays < 7) {
        return `${diffDays}d ago`;
      } else {
        return date.toLocaleDateString();
      }
    } catch (error) {
      return dateString;
    }
  }

  private handleScroll(event: Event) {
    const element = event.target as HTMLElement;
    const threshold = 50; // Load more when 50px from bottom
    
    console.log('Scroll event:', {
      scrollTop: element.scrollTop,
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
      threshold
    });
    
    if (element.scrollTop + element.clientHeight >= element.scrollHeight - threshold) {
      console.log('Loading more items...');
      this.loadMoreItems();
    }
  }

  private loadMoreItems() {
    console.log('loadMoreItems called:', { displayCount: this.displayCount, totalItems: this.items.length });
    if (this.displayCount < this.items.length) {
      this.displayCount = Math.min(this.displayCount + 7, this.items.length);
      console.log('New displayCount:', this.displayCount);
    }
  }

  render() {
    const displayItems = this.items.slice(0, this.displayCount);
    const hasMoreItems = this.displayCount < this.items.length;

    return html`
      <div class="header">
        <h2 class="title">${this.widget.title}</h2>
        <button 
          class="refresh-btn" 
          @click=${this.loadFeed}
          ?disabled=${this.loading}
          title="Refresh feed">
          ${this.loading ? '⟳' : '↻'}
        </button>
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
