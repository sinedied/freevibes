import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { type NoteWidget } from '../services/data.js';
import { dataService } from '../services/data.js';
import noteIconSvg from '/note.svg?raw';

@customElement('fv-notes')
export class Notes extends LitElement {
  @property({ type: Object }) widget!: NoteWidget;
  @state() private isEditing = false;
  @state() private editContent = '';

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

    .header-content {
      display: flex;
      align-items: center;
      gap: var(--fv-spacing-sm);
      min-width: 0;
      flex: 1;
    }

    .note-icon {
      width: 20px;
      height: 20px;
      object-fit: contain;
      flex-shrink: 0;
    }

    :host([data-color="yellow"]) .note-icon {
      color: var(--fv-note-yellow-border);
    }

    :host([data-color="green"]) .note-icon {
      color: var(--fv-note-green-border);
    }

    :host([data-color="blue"]) .note-icon {
      color: var(--fv-note-blue-border);
    }

    :host([data-color="red"]) .note-icon {
      color: var(--fv-note-red-border);
    }

    .header-title {
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
    }

    .color-indicator {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      border: 2px solid var(--fv-border);
    }

    .color-yellow {
      background-color: var(--fv-note-yellow-border);
    }

    .color-green {
      background-color: var(--fv-note-green-border);
    }

    .color-blue {
      background-color: var(--fv-note-blue-border);
    }

    .color-red {
      background-color: var(--fv-note-red-border);
    }

    .content {
      padding: var(--fv-spacing-sm);
      flex: 1;
      overflow-y: auto;
      background-color: var(--note-bg);
      position: relative;
    }

    :host([data-color="yellow"]) .content {
      --note-bg: var(--fv-note-yellow);
      border-left: 4px solid var(--fv-note-yellow-border);
    }

    :host([data-color="green"]) .content {
      --note-bg: var(--fv-note-green);
      border-left: 4px solid var(--fv-note-green-border);
    }

    :host([data-color="blue"]) .content {
      --note-bg: var(--fv-note-blue);
      border-left: 4px solid var(--fv-note-blue-border);
    }

    :host([data-color="red"]) .content {
      --note-bg: var(--fv-note-red);
      border-left: 4px solid var(--fv-note-red-border);
    }

    .note-text {
      word-wrap: break-word;
      line-height: var(--fv-line-height);
      margin: 0;
      cursor: pointer;
      font-size: var(--fv-font-size-sm);
      color: var(--fv-text-primary);
    }

    .note-text:hover {
      background-color: rgba(0, 0, 0, 0.02);
      border-radius: var(--fv-border-radius);
    }

    .note-text a {
      color: var(--fv-accent-primary);
      text-decoration: underline;
    }

    .note-text a:hover {
      color: var(--fv-accent-hover);
    }

    .edit-textarea {
      width: 100%;
      height: 100%;
      border: none;
      outline: none;
      resize: none;
      font-family: var(--fv-font-family);
      font-size: var(--fv-font-size-sm);
      line-height: var(--fv-line-height);
      background: transparent;
      color: var(--fv-text-primary);
      padding: 0;
    }

    .edit-controls {
      position: absolute;
      bottom: var(--fv-spacing-sm);
      right: var(--fv-spacing-sm);
      display: flex;
      gap: var(--fv-spacing-xs);
    }

    .edit-btn {
      background: var(--fv-accent-primary);
      border: none;
      border-radius: var(--fv-border-radius);
      padding: var(--fv-spacing-xs) var(--fv-spacing-sm);
      color: white;
      cursor: pointer;
      font-size: var(--fv-font-size-xs);
      transition: var(--fv-transition);
    }

    .edit-btn:hover {
      background-color: var(--fv-accent-hover);
    }

    .cancel-btn {
      background: var(--fv-text-muted);
    }

    .cancel-btn:hover {
      background-color: var(--fv-text-secondary);
    }

    .empty {
      color: var(--fv-text-muted);
      font-style: italic;
      cursor: pointer;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    (this as any).setAttribute('data-color', this.widget.color);
  }

  private startEditing() {
    this.isEditing = true;
    this.editContent = this.widget.content;
  }

  private cancelEditing() {
    this.isEditing = false;
    this.editContent = '';
  }

  private async saveNote() {
    const updatedWidget: NoteWidget = {
      ...this.widget,
      content: this.editContent
    };

    dataService.updateWidget(updatedWidget);
    
    this.dispatchEvent(new CustomEvent('widget-updated', {
      detail: updatedWidget,
      bubbles: true
    }));

    this.isEditing = false;
    this.editContent = '';
  }

  private handleKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      this.cancelEditing();
    } else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
      this.saveNote();
    }
  }

  private parseContent(content: string) {
    if (!content.trim()) {
      return html`<span class="empty">Click to add a note...</span>`;
    }

    const contentLines = content.split('\n');
    
    return html`${contentLines.map((line, lineIndex) => {
      const parsedLine = this.parseLinksInText(line);
      return html`${parsedLine}${lineIndex < contentLines.length - 1 ? html`<br>` : ''}`;
    })}`;
  }

  private parseLinksInText(text: string) {
    const linkRegex = /(https?:\/\/[^\s]+)/g;
    const textParts = text.split(linkRegex);
    
    return textParts.map(part => {
      if (linkRegex.test(part)) {
        return html`<a href="${part}" target="_blank" rel="noopener noreferrer">${part}</a>`;
      }
      return part;
    });
  }

  render() {
    return html`
      <div class="header">
        <span class="header-content">
          <span class="note-icon">
            ${unsafeSVG(noteIconSvg)}
          </span>
          <h2 class="title header-title">${this.widget.title}</h2>
        </span>
        <div class="color-indicator color-${this.widget.color}"></div>
      </div>
      <div class="content">
        ${this.isEditing ? html`
          <textarea
            class="edit-textarea"
            .value=${this.editContent}
            @input=${(e: Event) => this.editContent = (e.target as HTMLTextAreaElement).value}
            @keydown=${this.handleKeydown}
            placeholder="Enter your note here..."
            autofocus>
          </textarea>
          <div class="edit-controls">
            <button class="edit-btn cancel-btn" @click=${this.cancelEditing}>
              Cancel
            </button>
            <button class="edit-btn" @click=${this.saveNote}>
              Save
            </button>
          </div>
        ` : html`
          <div class="note-text" @click=${this.startEditing}>
            ${this.parseContent(this.widget.content)}
          </div>
        `}
      </div>
    `;
  }
}
