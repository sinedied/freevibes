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
      transition: all 0.2s ease;
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
      transition: var(--fv-transition);
      position: relative;
      cursor: grab;
    }

    .widget:active {
      cursor: grabbing;
    }

    .widget.dragging {
      opacity: 0.5;
      z-index: 1000;
      box-shadow: 0 8px 25px var(--fv-shadow-hover);
    }

    .widget.drag-placeholder {
      opacity: 0.3;
      transform: scale(0.95);
    }

    .drop-zone {
      border-radius: var(--fv-border-radius);
      transition: all 0.2s ease;
      height: 0;
      opacity: 0;
      overflow: hidden;
      margin: 0;
      border: 2px dashed transparent;
    }

    :host(.dragging) .drop-zone {
      height: 40px;
      opacity: 1;
      margin: 8px 0;
      border-color: var(--fv-border);
      background-color: var(--fv-bg-tertiary);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .drop-zone.drag-active {
      border-color: var(--fv-accent-primary);
      background-color: rgba(0, 123, 255, 0.15);
      transform: scale(1.02);
    }

    /* Empty columns while dragging */
    :host(.dragging) .column:empty {
      min-height: 100px;
      border: 2px dashed var(--fv-border);
      background-color: var(--fv-bg-tertiary);
      border-radius: var(--fv-border-radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    :host(.dragging) .column.drag-over-empty {
      min-height: 200px;
      border: 2px dashed var(--fv-border);
      background-color: var(--fv-bg-secondary);
      border-radius: var(--fv-border-radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
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
      pointer-events: none;
    }

    .widget:hover .resize-handle {
      opacity: 0.6;
      pointer-events: auto;
    }

    .resize-handle:hover {
      opacity: 1 !important;
      background: linear-gradient(-45deg, transparent 0%, transparent 30%, var(--fv-accent-primary) 30%, var(--fv-accent-primary) 40%, transparent 40%, transparent 60%, var(--fv-accent-primary) 60%, var(--fv-accent-primary) 70%, transparent 70%);
    }

    .widget.resizing {
      transition: none;
      box-shadow: 0 4px 12px var(--fv-shadow-hover);
    }

    .widget.resizing .resize-handle {
      pointer-events: auto;
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
    const isPlaceholder = this._draggedId && this._draggedId !== widget.id && this._dragTargetId === widget.id;
    
    return html`
      <div
        class="widget ${isDragging ? 'dragging' : ''} ${isPlaceholder ? 'drag-placeholder' : ''} ${isResizing ? 'resizing' : ''}"
        data-id=${widget.id}
        draggable="true"
        @dragstart=${(e: DragEvent) => this.handleDragStart(e, widget.id)}
        @dragend=${this.handleDragEnd}
        style="--widget-height: ${widget.height || 6}; position: relative;"
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
  private _dragTargetId: string | undefined = undefined;
  private _resizingId: string | undefined = undefined;
  private _resizeStartY: number = 0;
  private _resizeStartHeight: number = 0;

  protected updated(changedProperties: Map<string | number | symbol, unknown>) {
    super.updated(changedProperties);
  }

  private handleDragStart(e: DragEvent, id: string) {
    this._draggedId = id;
    e.dataTransfer?.setData('text/plain', id);
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
    }
    // Add dragging class to host for CSS styling
    this.classList.add('dragging');
    this.requestUpdate();
  }

  private handleDragEnd = () => {
    this._draggedId = undefined;
    this._dragTargetId = undefined;
    // Remove dragging class from host
    this.classList.remove('dragging');
    this.requestUpdate();
  };

  private handleDropZoneDragOver(e: DragEvent, _column: number, _position: number) {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
    
    // Set visual feedback
    const target = e.currentTarget as HTMLElement;
    target.classList.add('drag-active');
  }

  private handleDropZoneDragLeave(e: DragEvent) {
    const target = e.currentTarget as HTMLElement;
    target.classList.remove('drag-active');
  }

  private handleDropZoneDrop(e: DragEvent, column: number, position: number) {
    e.preventDefault();
    const fromId = this._draggedId;
    if (!fromId) return;

    const target = e.currentTarget as HTMLElement;
    target.classList.remove('drag-active');

    const widgets = [...this.data.widgets];
    const fromWidget = widgets.find(w => w.id === fromId);
    
    if (!fromWidget) return;

    // Store the original column before modifying the widget
    const originalColumn = fromWidget.position.column;

    // Update the dragged widget's position
    fromWidget.position.column = column;

    // Get widgets in the target column (excluding the dragged widget)
    const columnWidgets = widgets
      .filter(w => w.position.column === column && w.id !== fromId)
      .sort((a, b) => a.position.order - b.position.order);

    // Insert the widget at the specified position
    if (position <= columnWidgets.length) {
      columnWidgets.splice(position, 0, fromWidget);
    } else {
      columnWidgets.push(fromWidget);
    }

    // Reorder all widgets in the target column
    columnWidgets.forEach((widget, index) => {
      widget.position.order = (index + 1) * 1000;
    });

    // If the widget moved to a different column, reorder the original column too
    if (originalColumn !== column) {
      const originalColumnWidgets = widgets
        .filter(w => w.position.column === originalColumn && w.id !== fromId)
        .sort((a, b) => a.position.order - b.position.order);
      
      originalColumnWidgets.forEach((widget, index) => {
        widget.position.order = (index + 1) * 1000;
      });
    }

    const updatedData = { ...this.data, widgets };
    this._draggedId = undefined;
    this._dragTargetId = undefined;
    
    this.dispatchEvent(new CustomEvent('data-updated', {
      detail: updatedData,
      bubbles: true
    }));
    
    // Force immediate update after data change
    this.data = updatedData;
    this.requestUpdate();
  }

  private handleEmptyColumnDragOver(e: DragEvent, _column: number) {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }
    
    const target = e.currentTarget as HTMLElement;
    target.classList.add('drag-over-empty');
  }

  private handleEmptyColumnDragLeave(e: DragEvent) {
    const target = e.currentTarget as HTMLElement;
    target.classList.remove('drag-over-empty');
  }

  private handleEmptyColumnDrop(e: DragEvent, column: number) {
    e.preventDefault();
    const fromId = this._draggedId;
    if (!fromId) return;

    const target = e.currentTarget as HTMLElement;
    target.classList.remove('drag-over-empty');

    const widgets = [...this.data.widgets];
    const fromWidget = widgets.find(w => w.id === fromId);
    
    if (!fromWidget) return;

    // Move widget to the empty column
    fromWidget.position.column = column;
    fromWidget.position.order = 1000; // First in the column

    const updatedData = { ...this.data, widgets };
    this._draggedId = undefined;
    this._dragTargetId = undefined;
    
    this.dispatchEvent(new CustomEvent('data-updated', {
      detail: updatedData,
      bubbles: true
    }));
    
    // Force immediate update after data change
    this.data = updatedData;
    this.requestUpdate();
  }

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
        ${columnArrays.map((columnWidgets, columnIndex) => html`
          <div class="column" data-column=${columnIndex + 1}>
            ${columnWidgets.length === 0 
              ? html`
                <div class="drop-zone column-drop-zone" 
                     @dragover=${(e: DragEvent) => this.handleEmptyColumnDragOver(e, columnIndex + 1)}
                     @dragleave=${this.handleEmptyColumnDragLeave}
                     @drop=${(e: DragEvent) => this.handleEmptyColumnDrop(e, columnIndex + 1)}>
                </div>
              ` 
              : html`
                <!-- Drop zone at the top of the column -->
                <div class="drop-zone" 
                     @dragover=${(e: DragEvent) => this.handleDropZoneDragOver(e, columnIndex + 1, 0)}
                     @dragleave=${this.handleDropZoneDragLeave}
                     @drop=${(e: DragEvent) => this.handleDropZoneDrop(e, columnIndex + 1, 0)}>
                </div>
                
                ${columnWidgets.map((widget, widgetIndex) => html`
                  ${this.renderWidget(widget)}
                  <!-- Drop zone after each widget -->
                  <div class="drop-zone" 
                       @dragover=${(e: DragEvent) => this.handleDropZoneDragOver(e, columnIndex + 1, widgetIndex + 1)}
                       @dragleave=${this.handleDropZoneDragLeave}
                       @drop=${(e: DragEvent) => this.handleDropZoneDrop(e, columnIndex + 1, widgetIndex + 1)}>
                  </div>
                `)}
              `}
          </div>
        `)}
      </div>
    `;
  }
}
