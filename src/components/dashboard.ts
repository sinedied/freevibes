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

    /* Suppression de l'effet hover (ombre et déplacement) */

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
    .widget {
      cursor: grab;
    }
    .widget:active {
      cursor: grabbing;
      opacity: 0.85;
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
    const isDragging = this._draggedId === widget.id;
    return html`
      <div
        class="widget"
        data-id=${widget.id}
        draggable="true"
        @dragstart=${(e: DragEvent) => this.handleDragStart(e, widget.id)}
        @dragend=${this.handleDragEnd}
        @dragover=${(e: DragEvent) => this.handleDragOver(e)}
        @drop=${(e: DragEvent) => this.handleDrop(e, widget.id)}
        style=${isDragging ? 'opacity:0.5;' : ''}
      >
        ${widget.type === 'rss'
          ? html`<fv-rss .widget=${widget as any} @widget-updated=${this.handleWidgetUpdate}></fv-rss>`
          : widget.type === 'note'
            ? html`<fv-notes .widget=${widget as any} @widget-updated=${this.handleWidgetUpdate}></fv-notes>`
            : html`Unknown widget type`}
      </div>
    `;
  }

  private _draggedId: string | null = null;

  private handleDragStart(e: DragEvent, id: string) {
    this._draggedId = id;
    e.dataTransfer?.setData('text/plain', id);
    e.dataTransfer!.effectAllowed = 'move';
  }

  private handleDragOver(e: DragEvent) {
    e.preventDefault();
    e.dataTransfer!.dropEffect = 'move';
  }

  private handleDrop(e: DragEvent, targetId: string) {
    e.preventDefault();
    const fromId = this._draggedId;
    if (!fromId || fromId === targetId) return;

    // 1. Trie les widgets par position pour obtenir l'ordre visuel actuel
    const sorted = [...this.data.widgets].sort((a, b) => {
      if (a.position.row !== b.position.row) return a.position.row - b.position.row;
      return a.position.col - b.position.col;
    });

    // 2. Trouve les index source et cible dans ce tableau trié
    const fromIndex = sorted.findIndex(w => w.id === fromId);
    const toIndex = sorted.findIndex(w => w.id === targetId);
    if (fromIndex === -1 || toIndex === -1) return;

    // 3. Déplace le widget dans le tableau trié
    const [moved] = sorted.splice(fromIndex, 1);
    sorted.splice(toIndex, 0, moved);

    // 4. Recalcule les positions (row) pour refléter le nouvel ordre
    const updatedWidgets = sorted.map((w, i) => ({
      ...w,
      position: { ...w.position, row: (i + 1) * 1000 }
    }));

    // 5. Mets à jour le tableau d'origine dans le même ordre que sorted
    const updatedData = { ...this.data, widgets: updatedWidgets };
    this._draggedId = null;
    this.dispatchEvent(new CustomEvent('data-updated', {
      detail: updatedData,
      bubbles: true
    }));
  }

  private handleDragEnd = () => {
    this._draggedId = null;
    this.requestUpdate();
  };

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
        ${sortedWidgets.map((widget) => this.renderWidget(widget))}
      </div>
    `;
  }
}
