import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { type Tab } from '../services/data.js';

@customElement('fv-tab-bar')
export class TabBar extends LitElement {
  @property({ type: Array }) tabs: Tab[] = [];
  @property({ type: String }) currentTabId = '';

  @state() private _draggedTabId: string | undefined = undefined;
  @state() private _dropTargetIndex: number = -1;

  static styles = css`
    :host {
      display: block;
      height: 100%;
    }

    .tab-bar {
      display: flex;
      gap: var(--fv-spacing-xs);
      overflow-x: auto;
      scrollbar-width: thin;
      align-items: stretch;
      height: 100%;
    }

    .tab-bar::-webkit-scrollbar {
      height: 4px;
    }

    .tab-bar::-webkit-scrollbar-thumb {
      background: var(--fv-border);
      border-radius: 2px;
    }

    .tab-wrapper {
      display: flex;
      align-items: stretch;
      height: 100%;
    }

    .drop-indicator {
      width: 3px;
      height: 24px;
      background: var(--fv-accent-primary);
      border-radius: 2px;
      margin: 0 2px;
    }

    .tab {
      position: relative;
      padding: 0 var(--fv-spacing-md);
      background: transparent;
      border: none;
      cursor: pointer;
      transition: var(--fv-transition);
      white-space: nowrap;
      display: flex;
      align-items: center;
      gap: var(--fv-spacing-xs);
      user-select: none;
      height: 100%;
    }

    .tab::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: transparent;
      transition: var(--fv-transition);
    }

    .tab.dragging {
      opacity: 0.4;
    }

    .tab:hover:not(.active) {
      background-color: var(--fv-bg-tertiary);
    }

    .tab:hover {
      color: var(--fv-accent-primary);
    }

    .tab.active::after {
      background: var(--fv-accent-primary);
    }

    .tab.active {
      font-weight: 600;
    }

    .tab-name {
      color: var(--fv-text-primary);
      font-size: var(--fv-font-size-sm);
    }

    .tab.active .tab-name {
      color: var(--fv-accent-primary);
    }

    .drop-zone-end {
      min-width: 20px;
      height: 28px;
      flex-shrink: 0;
    }
  `;

  private handleTabClick(tabId: string) {
    if (this._draggedTabId) return;
    this.dispatchEvent(new CustomEvent('tab-selected', {
      detail: tabId,
      bubbles: true
    }));
  }

  private handleDragStart(event: DragEvent, tab: Tab) {
    this._draggedTabId = tab.id;
    this._dropTargetIndex = -1;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', tab.id);
    }
  }

  private handleDragOver(event: DragEvent, index: number) {
    event.preventDefault();
    if (!this._draggedTabId) return;

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }

    if (this._dropTargetIndex !== index) {
      this._dropTargetIndex = index;
    }
  }

  private handleDragLeave() {
    this._dropTargetIndex = -1;
  }

  private handleDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    
    if (!this._draggedTabId || this._dropTargetIndex === -1) {
      this.resetDragState();
      return;
    }

    const sortedTabs = [...this.tabs].sort((a, b) => a.order - b.order);
    const draggedIndex = sortedTabs.findIndex(t => t.id === this._draggedTabId);
    const targetIndex = this._dropTargetIndex;
    
    if (draggedIndex === -1) {
      this.resetDragState();
      return;
    }

    if (draggedIndex === targetIndex || draggedIndex === targetIndex - 1) {
      this.resetDragState();
      return;
    }

    const reorderedTabs = sortedTabs.map(t => ({ ...t }));
    const [removed] = reorderedTabs.splice(draggedIndex, 1);
    const insertIndex = targetIndex > draggedIndex ? targetIndex - 1 : targetIndex;
    reorderedTabs.splice(insertIndex, 0, removed);

    reorderedTabs.forEach((tab, index) => {
      tab.order = (index + 1) * 1000;
    });

    this.dispatchEvent(new CustomEvent('tabs-reordered', {
      detail: reorderedTabs,
      bubbles: true
    }));

    this.resetDragState();
  }

  private handleDragEnd() {
    this.resetDragState();
  }

  private resetDragState() {
    this._draggedTabId = undefined;
    this._dropTargetIndex = -1;
  }

  render() {
    const sortedTabs = [...this.tabs].sort((a, b) => a.order - b.order);
    const draggedIndex = this._draggedTabId 
      ? sortedTabs.findIndex(t => t.id === this._draggedTabId) 
      : -1;

    return html`
      <div 
        class="tab-bar"
        @drop=${this.handleDrop}
        @dragleave=${this.handleDragLeave}
      >
        ${sortedTabs.map((tab, index) => {
          const isActive = tab.id === this.currentTabId;
          const isDragging = tab.id === this._draggedTabId;
          const showIndicatorBefore = this._dropTargetIndex === index && 
            draggedIndex !== index && 
            draggedIndex !== index - 1;

          return html`
            <div class="tab-wrapper">
              ${showIndicatorBefore ? html`<div class="drop-indicator"></div>` : ''}
              <div
                class="tab ${isActive ? 'active' : ''} ${isDragging ? 'dragging' : ''}"
                draggable="true"
                @click=${() => this.handleTabClick(tab.id)}
                @dragstart=${(e: DragEvent) => this.handleDragStart(e, tab)}
                @dragover=${(e: DragEvent) => this.handleDragOver(e, index)}
                @dragend=${this.handleDragEnd}
              >
                <span class="tab-name">${tab.name}</span>
              </div>
            </div>
          `;
        })}
        ${this._dropTargetIndex === sortedTabs.length && draggedIndex !== sortedTabs.length - 1 
          ? html`<div class="drop-indicator"></div>` 
          : ''}
        <div 
          class="drop-zone-end"
          @dragover=${(e: DragEvent) => this.handleDragOver(e, sortedTabs.length)}
        ></div>
      </div>
    `;
  }
}
