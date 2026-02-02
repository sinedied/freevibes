import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { type DashboardData, type Widget } from '../services/data.js';
import './rss.js';
import './notes.js';

@customElement('fv-dashboard')
export class Dashboard extends LitElement {
  @property({ type: Object }) data!: DashboardData;
  @property({ type: String }) currentTabId = '';

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
      min-height: 200px; /* Ensure columns have minimum height for dropping */
    }

    .widget {
      background-color: var(--fv-bg-secondary);
      border: 1px solid var(--fv-border);
      border-radius: var(--fv-border-radius-lg);
      box-shadow: 0 2px 8px var(--fv-shadow);
      transition: all 0.3s ease;
      overflow: hidden;
      height: calc(var(--widget-height, 6) * 1.5em + 3rem);
      min-height: var(--fv-widget-min-height);
      position: relative;
    }

    .widget.folded {
      height: auto;
      min-height: auto;
    }

    .widget.dragging {
      opacity: 0.5;
      z-index: 1000;
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
    }

    .widget.drag-preview {
      background-color: var(--fv-bg-tertiary);
      border: 2px dashed var(--fv-accent-primary);
      opacity: 0.7;
    }

    .drag-placeholder {
      height: 3rem;
      border: 2px dashed var(--fv-accent-primary);
      border-radius: var(--fv-border-radius-lg);
      background-color: var(--fv-bg-tertiary);
      opacity: 0;
      margin: calc(var(--fv-widget-gap) / 2) 0;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--fv-accent-primary);
      font-size: var(--fv-font-size-sm);
      font-weight: 500;
      transform: scaleY(0);
      transform-origin: center;
      animation: dropZoneAppear 0.2s ease-out forwards;
    }

    @keyframes dropZoneAppear {
      0% {
        opacity: 0;
        transform: scaleY(0);
        height: 0;
      }
      50% {
        opacity: 0.6;
        height: 3rem;
      }
      100% {
        opacity: 0.8;
        transform: scaleY(1);
        height: 3rem;
      }
    }

    .drag-placeholder::after {
      content: "Drop here";
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

    .widget.folded .resize-handle {
      display: none;
    }

    .resize-handle:hover {
      opacity: 1 !important;
      background: linear-gradient(-45deg, transparent 0%, transparent 30%, var(--fv-accent-primary) 30%, var(--fv-accent-primary) 40%, transparent 40%, transparent 60%, var(--fv-accent-primary) 60%, var(--fv-accent-primary) 70%, transparent 70%);
    }

    .widget.resizing {
      transition: none;
      box-shadow: 0 4px 12px var(--fv-shadow-hover);
    }

    /* Drag handle styling */
    .widget ::slotted(.header),
    .widget fv-rss::part(header),
    .widget fv-notes::part(header) {
      cursor: grab;
    }

    .widget.dragging ::slotted(.header),
    .widget.dragging fv-rss::part(header),
    .widget.dragging fv-notes::part(header) {
      cursor: grabbing;
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

  // Drag and Drop State
  private _draggedWidget: Widget | undefined = undefined;
  private _dragPreview: { column: number; position: number } | undefined = undefined;
  private _columns: Widget[][] = [];

  private initializeDragHandlers() {
    // This method sets up the drag functionality after render
    this.updateComplete.then(() => {
      const widgets = this.shadowRoot?.querySelectorAll('.widget');
      widgets?.forEach(widgetEl => {
        // Find the header element within the widget's component
        const rssComponent = widgetEl.querySelector('fv-rss');
        const notesComponent = widgetEl.querySelector('fv-notes');
        
        let headerEl: Element | null = null;
        if (rssComponent) {
          headerEl = rssComponent.shadowRoot?.querySelector('.header') || null;
        } else if (notesComponent) {
          headerEl = notesComponent.shadowRoot?.querySelector('.header') || null;
        }

        if (headerEl) {
          headerEl.setAttribute('draggable', 'true');
          headerEl.addEventListener('dragstart', (e) => {
            const widgetId = widgetEl.getAttribute('data-id');
            if (widgetId) {
              this.handleDragStart(e as DragEvent, widgetId);
            }
          });
        }
      });
    });
  }

  private handleDragStart(e: DragEvent, widgetId: string) {
    const widget = this.data.widgets.find(w => w.id === widgetId);
    if (!widget) return;

    this._draggedWidget = widget;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', widgetId);
    }

    // Add dragging class for visual feedback
    this.requestUpdate();
  }

  private handleDragOver(e: DragEvent, columnIndex: number, position?: number) {
    e.preventDefault();
    if (!this._draggedWidget) return;

    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = 'move';
    }

    // Calculate position if not provided
    if (position === undefined) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const y = e.clientY - rect.top;
      const widgets = this._columns[columnIndex] || [];
      
      // Find the position based on mouse Y position
      let insertPosition = widgets.length;
      
      for (let i = 0; i < widgets.length; i++) {
        const widgetEl = this.shadowRoot?.querySelector(`[data-id="${widgets[i].id}"]`);
        if (widgetEl) {
          const widgetRect = widgetEl.getBoundingClientRect();
          const widgetY = widgetRect.top - rect.top + widgetRect.height / 2;
          
          if (y < widgetY) {
            insertPosition = i;
            break;
          }
        }
      }
      
      position = insertPosition;
    }

    // Update preview if position changed
    const newPreview = { column: columnIndex, position };
    if (!this._dragPreview || 
        this._dragPreview.column !== newPreview.column || 
        this._dragPreview.position !== newPreview.position) {
      this._dragPreview = newPreview;
      this.requestUpdate();
    }
  }

  private handleDrop(e: DragEvent) {
    e.preventDefault();
    
    if (!this._draggedWidget || !this._dragPreview) return;

    const { column: targetColumn, position: targetPosition } = this._dragPreview;
    
    // Create a new widgets array
    const widgets = this.data.widgets.filter(w => w.id !== this._draggedWidget!.id);
    
    // Update the dragged widget's position
    const updatedWidget = {
      ...this._draggedWidget,
      position: {
        column: targetColumn + 1, // Convert to 1-based
        order: (targetPosition + 1) * 1000 // Give some spacing for future insertions
      }
    };

    // Insert the widget at the target position
    const columnWidgets = widgets.filter(w => w.position.column === targetColumn + 1);
    const beforePosition = columnWidgets.slice(0, targetPosition);
    const afterPosition = columnWidgets.slice(targetPosition);
    
    // Rebuild the widgets array with proper ordering
    const otherColumnWidgets = widgets.filter(w => w.position.column !== targetColumn + 1);
    const newColumnWidgets = [...beforePosition, updatedWidget, ...afterPosition];
    
    // Update order values for the target column
    newColumnWidgets.forEach((widget, index) => {
      widget.position.order = (index + 1) * 1000;
    });

    const updatedData = {
      ...this.data,
      widgets: [...otherColumnWidgets, ...newColumnWidgets]
    };

    // Clean up drag state
    this._draggedWidget = undefined;
    this._dragPreview = undefined;

    this.dispatchEvent(new CustomEvent('data-updated', {
      detail: updatedData,
      bubbles: true
    }));
  }

  private handleDragEnd = () => {
    this._draggedWidget = undefined;
    this._dragPreview = undefined;
    this.requestUpdate();
  };

  private renderDragPlaceholder(widget: Widget) {
    return html`
      <div 
        class="drag-placeholder" 
        style="--placeholder-height: ${widget.height || 6}">
      </div>
    `;
  }

  // Resize functionality
  private _resizingId: string | undefined = undefined;
  private _resizeStartY: number = 0;
  private _resizeStartHeight: number = 0;

  private handleResizeStart = (e: MouseEvent, widgetId: string) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent widget drag from starting
    
    const widget = this.data.widgets.find(w => w.id === widgetId);
    if (!widget || widget.folded) return; // Don't allow resize on folded widgets

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

  private renderWidget(widget: Widget) {
    const isDragging = this._draggedWidget?.id === widget.id;
    const isResizing = this._resizingId === widget.id;
    const isFolded = widget.folded || false;
    
    return html`
      <div
        class="widget ${isDragging ? 'dragging' : ''} ${isResizing ? 'resizing' : ''} ${isFolded ? 'folded' : ''}"
        data-id=${widget.id}
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

  protected updated() {
    // Initialize drag handlers after the component updates
    this.initializeDragHandlers();
    
    // Organize widgets by column for easier access
    const columns = this.data.settings.columns;
    this._columns = Array.from({ length: columns }, () => []);
    
    this.data.widgets.forEach(widget => {
      const columnIndex = Math.max(0, Math.min(widget.position.column - 1, columns - 1));
      this._columns[columnIndex].push(widget);
    });

    this._columns.forEach(column => {
      column.sort((a, b) => a.position.order - b.position.order);
    });
  }

  render() {
    const tabWidgets = this.data.widgets.filter(w => w.tabId === this.currentTabId);

    if (!tabWidgets.length) {
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

    tabWidgets.forEach(widget => {
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
          <div 
            class="column" 
            data-column=${columnIndex + 1}
            @dragover=${(e: DragEvent) => this.handleDragOver(e, columnIndex)}
            @drop=${this.handleDrop}
          >
            ${repeat(
              columnWidgets,
              (widget) => widget.id,
              (widget, widgetIndex) => {
                const showPlaceholderBefore = this._dragPreview?.column === columnIndex && 
                                           this._dragPreview?.position === widgetIndex &&
                                           this._draggedWidget?.id !== widget.id;
                
                return html`
                  ${showPlaceholderBefore ? this.renderDragPlaceholder(this._draggedWidget!) : ''}
                  ${this.renderWidget(widget)}
                `;
              }
            )}
            ${/* Show placeholder at end of column if needed */ ''}
            ${this._dragPreview?.column === columnIndex && 
              this._dragPreview?.position === columnWidgets.length &&
              !columnWidgets.some(w => w.id === this._draggedWidget?.id)
                ? this.renderDragPlaceholder(this._draggedWidget!) 
                : ''}
            ${/* Show placeholder for empty columns */ ''}
            ${columnWidgets.length === 0 && this._dragPreview?.column === columnIndex
                ? this.renderDragPlaceholder(this._draggedWidget!)
                : ''}
          </div>
        `)}
      </div>
    `;
  }
}
