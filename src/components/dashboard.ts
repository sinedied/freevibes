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
      display: flex;
      gap: var(--fv-widget-gap);
      max-width: 1400px;
      margin: 0 auto;
      align-items: flex-start;
    }

    .column {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: var(--fv-widget-gap);
      min-width: 0; /* Prevent flex item from overflowing */
    }

    .widget {
      background-color: var(--fv-bg-secondary);
      border: 1px solid var(--fv-border);
      border-radius: var(--fv-border-radius-lg);
      box-shadow: 0 2px 8px var(--fv-shadow);
      transition: var(--fv-transition);
      overflow: hidden;
      height: calc(var(--widget-height, 6) * 1.5em + 3rem); /* Height based on lines + padding */
      min-height: var(--fv-widget-min-height);
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

    /* Responsive columns */
    @media (max-width: 768px) {
      .dashboard {
        flex-direction: column;
      }
      .column {
        width: 100%;
      }
    }

    @media (max-width: 1024px) and (min-width: 769px) {
      .dashboard {
        flex-wrap: wrap;
      }
      .column {
        flex-basis: calc(50% - var(--fv-widget-gap) / 2);
        max-width: calc(50% - var(--fv-widget-gap) / 2);
      }
      /* For odd number of columns > 2, make the last column full width */
      .column:nth-child(odd):last-child {
        flex-basis: 100%;
        max-width: 100%;
      }
    }

    .widget {
      cursor: grab;
    }
    .widget:active {
      cursor: grabbing;
      opacity: 0.85;
    }

    .drop-zone {
      min-height: 2em;
      border: 2px dashed transparent;
      border-radius: var(--fv-border-radius);
      transition: var(--fv-transition);
      margin: var(--fv-spacing-xs) 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--fv-text-muted);
      font-size: var(--fv-font-size-sm);
    }

    .drop-zone.drag-over {
      border-color: var(--fv-accent-primary);
      background-color: var(--fv-bg-tertiary);
      color: var(--fv-accent-primary);
    }

    .drop-zone.drag-over::after {
      content: "Drop widget here";
    }

    .resize-handle {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 20px;
      height: 20px;
      cursor: nw-resize;
      background: linear-gradient(-45deg, transparent 0%, transparent 30%, var(--fv-border) 30%, var(--fv-border) 40%, transparent 40%, transparent 60%, var(--fv-border) 60%, var(--fv-border) 70%, transparent 70%);
      opacity: 0;
      transition: var(--fv-transition);
      z-index: 10;
    }

    .widget:hover .resize-handle {
      opacity: 0.6;
    }

    .resize-handle:hover {
      opacity: 1 !important;
      background: linear-gradient(-45deg, transparent 0%, transparent 30%, var(--fv-accent-primary) 30%, var(--fv-accent-primary) 40%, transparent 40%, transparent 60%, var(--fv-accent-primary) 60%, var(--fv-accent-primary) 70%, transparent 70%);
    }

    .widget.resizing {
      transition: none;
      box-shadow: 0 4px 12px var(--fv-shadow-hover);
    }
  `;

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
    const isResizing = this._resizingId === widget.id;
    return html`
      <div
        class="widget ${isResizing ? 'resizing' : ''}"
        data-id=${widget.id}
        draggable="true"
        @dragstart=${(e: DragEvent) => this.handleDragStart(e, widget.id)}
        @dragend=${this.handleDragEnd}
        @dragover=${(e: DragEvent) => this.handleDragOver(e)}
        @drop=${(e: DragEvent) => this.handleDrop(e, widget.id)}
        style="--widget-height: ${widget.height || 6}; ${isDragging ? 'opacity:0.5;' : ''} position: relative;"
      >
        ${widget.type === 'rss'
          ? html`<fv-rss .widget=${widget as any} @widget-updated=${this.handleWidgetUpdate}></fv-rss>`
          : widget.type === 'note'
            ? html`<fv-notes .widget=${widget as any} @widget-updated=${this.handleWidgetUpdate}></fv-notes>`
            : html`Unknown widget type`}
        <div class="resize-handle" @mousedown=${(e: MouseEvent) => this.handleResizeStart(e, widget.id)}></div>
      </div>
    `;
  }

  private _draggedId: string | undefined = undefined;
  private _resizingId: string | undefined = undefined;
  private _resizeStartY: number = 0;
  private _resizeStartHeight: number = 0;

  private handleDragStart(e: DragEvent, id: string) {
    this._draggedId = id;
    e.dataTransfer?.setData('text/plain', id);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
  }

  private handleDragOver(e: DragEvent) {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
  }

  private handleDrop(e: DragEvent, targetId: string) {
    e.preventDefault();
    const fromId = this._draggedId;
    if (!fromId || fromId === targetId) return;

    const widgets = [...this.data.widgets];
    const fromWidget = widgets.find(w => w.id === fromId);
    const targetWidget = widgets.find(w => w.id === targetId);
    
    if (!fromWidget || !targetWidget) return;

    // If dropping on the same widget, do nothing
    if (fromWidget.id === targetWidget.id) return;

    // Get widgets in the target column
    const targetColumn = targetWidget.position.column;

    // Remove the dragged widget from its current position
    const fromIndex = widgets.findIndex(w => w.id === fromId);
    widgets.splice(fromIndex, 1);

    // Update the dragged widget's position
    fromWidget.position.column = targetColumn;
    fromWidget.position.order = targetWidget.position.order;

    // Insert the widget at the target position
    const updatedIndex = widgets.findIndex(w => w.id === targetId);
    widgets.splice(updatedIndex, 0, fromWidget);

    // Reorder widgets in the target column
    const updatedColumnWidgets = widgets
      .filter(w => w.position.column === targetColumn)
      .sort((a, b) => widgets.indexOf(a) - widgets.indexOf(b));
    
    updatedColumnWidgets.forEach((widget, index) => {
      widget.position.order = (index + 1) * 1000;
    });

    const updatedData = { ...this.data, widgets };
    this._draggedId = undefined;
    this.dispatchEvent(new CustomEvent('data-updated', {
      detail: updatedData,
      bubbles: true
    }));
  }

  private handleDragEnd = () => {
    this._draggedId = undefined;
    this.requestUpdate();
  };

  private handleResizeStart = (e: MouseEvent, widgetId: string) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent widget drag from starting
    
    const widget = this.data.widgets.find(w => w.id === widgetId);
    if (!widget) return;

    this._resizingId = widgetId;
    this._resizeStartY = e.clientY;
    this._resizeStartHeight = widget.height || 6;

    // Add global event listeners
    document.addEventListener('mousemove', this.handleResize);
    document.addEventListener('mouseup', this.handleResizeEnd);
    
    this.requestUpdate();
  };

  private handleResize = (e: MouseEvent) => {
    if (!this._resizingId) return;
    
    const widget = this.data.widgets.find(w => w.id === this._resizingId);
    if (!widget) return;

    // Calculate height change based on mouse movement
    // Each line is approximately 1.5em, so we convert pixels to lines
    const deltaY = e.clientY - this._resizeStartY;
    const lineHeight = 24; // Approximate height of one line in pixels (1.5em ≈ 24px)
    const deltaLines = Math.round(deltaY / lineHeight);
    
    // Calculate new height with constraints
    const newHeight = Math.max(2, Math.min(20, this._resizeStartHeight + deltaLines));
    
    // Update widget height temporarily for visual feedback
    widget.height = newHeight;
    this.requestUpdate();
  };

  private handleResizeEnd = () => {
    if (!this._resizingId) return;

    const widget = this.data.widgets.find(w => w.id === this._resizingId);
    if (widget) {
      // Save the updated widget data
      const updatedData = {
        ...this.data,
        widgets: this.data.widgets.map(w => 
          w.id === this._resizingId ? { ...w, height: widget.height } : w
        )
      };
      
      this.dispatchEvent(new CustomEvent('data-updated', {
        detail: updatedData,
        bubbles: true
      }));
    }

    // Clean up
    document.removeEventListener('mousemove', this.handleResize);
    document.removeEventListener('mouseup', this.handleResizeEnd);
    this._resizingId = undefined;
    this._resizeStartY = 0;
    this._resizeStartHeight = 0;
    
    this.requestUpdate();
  };

  private handleColumnDragOver(e: DragEvent, _column: number) {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
    // Add visual feedback
    const target = e.currentTarget as HTMLElement;
    target.classList.add('drag-over');
  }

  private handleColumnDragLeave(e: DragEvent) {
    // Remove visual feedback when dragging leaves
    const target = e.currentTarget as HTMLElement;
    target.classList.remove('drag-over');
  }

  private handleColumnDrop(e: DragEvent, column: number) {
    e.preventDefault();
    const fromId = this._draggedId;
    if (!fromId) return;

    const widgets = [...this.data.widgets];
    const fromWidget = widgets.find(w => w.id === fromId);
    
    if (!fromWidget) return;

    // Move widget to the empty column
    fromWidget.position.column = column;
    fromWidget.position.order = 1000; // First in the column

    const updatedData = { ...this.data, widgets };
    this._draggedId = undefined;
    
    // Remove visual feedback
    const target = e.currentTarget as HTMLElement;
    target.classList.remove('drag-over');
    
    this.dispatchEvent(new CustomEvent('data-updated', {
      detail: updatedData,
      bubbles: true
    }));
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

    const columns = this.data.settings.columns;
    const columnArrays: Widget[][] = Array.from({ length: columns }, () => []);

    // Organize widgets by column
    this.data.widgets.forEach(widget => {
      const columnIndex = Math.max(0, Math.min(widget.position.column - 1, columns - 1));
      columnArrays[columnIndex].push(widget);
    });

    // Sort widgets within each column by order
    columnArrays.forEach(column => {
      column.sort((a, b) => a.position.order - b.position.order);
    });

    return html`
      <div class="dashboard">
        ${columnArrays.map((columnWidgets, index) => html`
          <div class="column" data-column=${index + 1}>
            ${columnWidgets.map(widget => this.renderWidget(widget))}
            ${columnWidgets.length === 0 ? html`
              <div class="drop-zone" 
                   @dragover=${(e: DragEvent) => this.handleColumnDragOver(e, index + 1)}
                   @dragleave=${this.handleColumnDragLeave}
                   @drop=${(e: DragEvent) => this.handleColumnDrop(e, index + 1)}>
              </div>
            ` : ''}
          </div>
        `)}
      </div>
    `;
  }
}
