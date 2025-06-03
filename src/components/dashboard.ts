import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { type DashboardData, type Widget } from '../services/data.js';
import './rss.js';
import './notes.js';

@customElement('fv-dashboard')
export class Dashboard extends LitElement {
  @property({ type: Object }) data!: DashboardData;

  static styles = css`
    :host {
      display: block;
    }

    .dashboard {
      display: grid;
      gap: var(--fv-widget-gap);
      grid-template-columns: repeat(var(--columns, 3), 1fr);
      max-width: 1400px;
      margin: 0 auto;
    }

    .widget {
      background-color: var(--fv-bg-secondary);
      border: 1px solid var(--fv-border);
      border-radius: var(--fv-border-radius-lg);
      box-shadow: 0 2px 8px var(--fv-shadow);
      transition: var(--fv-transition);
      overflow: hidden;
      min-height: var(--fv-widget-min-height);
    }

    .widget:hover {
      box-shadow: 0 4px 12px var(--fv-shadow-hover);
      transform: translateY(-2px);
    }

    .empty-state {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 200px;
      color: var(--fv-text-secondary);
      font-size: var(--fv-font-size-lg);
      grid-column: 1 / -1;
    }

    /* Responsive grid */
    @media (max-width: 768px) {
      .dashboard {
        grid-template-columns: 1fr;
      }
    }

    @media (max-width: 1024px) {
      .dashboard {
        grid-template-columns: repeat(2, 1fr);
      }
    }
  `;

  updated(changedProperties: Map<string, any>) {
    if (changedProperties.has('data')) {
      (this as any).style.setProperty('--columns', this.data.settings.columns.toString());
    }
  }

  private handleWidgetUpdate(event: CustomEvent) {
    const updatedWidget = event.detail;
    const updatedData = {
      ...this.data,
      widgets: this.data.widgets.map(w => 
        w.id === updatedWidget.id ? updatedWidget : w
      )
    };
    
    this.dispatchEvent(new CustomEvent('data-updated', {
      detail: updatedData,
      bubbles: true
    }));
  }

  private renderWidget(widget: Widget) {
    switch (widget.type) {
      case 'rss':
        return html`
          <div class="widget">
            <fv-rss 
              .widget=${widget as any} 
              @widget-updated=${this.handleWidgetUpdate}>
            </fv-rss>
          </div>
        `;
      case 'note':
        return html`
          <div class="widget">
            <fv-notes 
              .widget=${widget as any} 
              @widget-updated=${this.handleWidgetUpdate}>
            </fv-notes>
          </div>
        `;
      default:
        return html`<div class="widget">Unknown widget type</div>`;
    }
  }

  render() {
    if (!this.data.widgets.length) {
      return html`
        <div class="dashboard">
          <div class="empty-state">
            No widgets configured. Add some widgets to get started!
          </div>
        </div>
      `;
    }

    // Sort widgets by position
    const sortedWidgets = [...this.data.widgets].sort((a, b) => {
      if (a.position.row !== b.position.row) {
        return a.position.row - b.position.row;
      }
      return a.position.col - b.position.col;
    });

    return html`
      <div class="dashboard">
        ${sortedWidgets.map(widget => this.renderWidget(widget))}
      </div>
    `;
  }
}
