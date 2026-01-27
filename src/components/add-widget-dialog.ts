import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

type WidgetType = 'rss' | 'note' | undefined;
type NoteColor = 'yellow' | 'green' | 'blue' | 'red';

interface WidgetConfig {
  type: WidgetType;
  title: string;
  feedUrl?: string;
  content?: string;
  color?: NoteColor;
}

@customElement('fv-add-widget-dialog')
export class AddWidgetDialog extends LitElement {
  @property({ type: Boolean }) open = false;
  @state() private step: 'select' | 'configure' = 'select';
  @state() private selectedType: WidgetType = undefined;
  @state() private widgetTitle = '';
  @state() private feedUrl = '';
  @state() private content = '';
  @state() private color: NoteColor = 'yellow';

  static styles = css`
    :host {
      display: block;
    }

    .overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background-color: rgba(0, 0, 0, 0.5);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: 0;
      visibility: hidden;
      transition: var(--fv-transition);
    }

    :host([open]) .overlay {
      opacity: 1;
      visibility: visible;
    }

    .modal {
      background-color: var(--fv-bg-secondary);
      border-radius: var(--fv-border-radius-lg);
      box-shadow: 0 20px 60px var(--fv-shadow);
      max-width: 500px;
      width: 90%;
      max-height: 80vh;
      overflow-y: auto;
      transform: scale(0.9);
      transition: var(--fv-transition);
    }

    :host([open]) .modal {
      transform: scale(1);
    }

    .header {
      padding: var(--fv-spacing-lg);
      border-bottom: 1px solid var(--fv-border);
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .title {
      font-size: var(--fv-font-size-xl);
      font-weight: 600;
      margin: 0;
      color: var(--fv-text-primary);
    }

    .close-btn {
      background: none;
      border: none;
      font-size: var(--fv-font-size-xl);
      cursor: pointer;
      color: var(--fv-text-muted);
      padding: var(--fv-spacing-xs);
      line-height: 1;
      transition: var(--fv-transition);
    }

    .close-btn:hover {
      color: var(--fv-text-primary);
    }

    .content {
      padding: var(--fv-spacing-lg);
    }

    .widget-types {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: var(--fv-spacing-md);
    }

    .widget-type-card {
      background-color: var(--fv-bg-tertiary);
      border: 2px solid var(--fv-border);
      border-radius: var(--fv-border-radius-lg);
      padding: var(--fv-spacing-lg);
      text-align: center;
      cursor: pointer;
      transition: var(--fv-transition);
    }

    .widget-type-card:hover {
      border-color: var(--fv-accent-primary);
      background-color: var(--fv-bg-secondary);
      transform: translateY(-2px);
      box-shadow: 0 4px 8px var(--fv-shadow);
    }

    .widget-type-icon {
      font-size: 3rem;
      margin-bottom: var(--fv-spacing-sm);
    }

    .widget-type-title {
      font-size: var(--fv-font-size-md);
      font-weight: 600;
      margin: 0 0 var(--fv-spacing-xs) 0;
      color: var(--fv-text-primary);
    }

    .widget-type-description {
      font-size: var(--fv-font-size-sm);
      color: var(--fv-text-secondary);
      margin: 0;
    }

    .form-group {
      margin-bottom: var(--fv-spacing-md);
    }

    .form-label {
      display: block;
      font-size: var(--fv-font-size-sm);
      font-weight: 500;
      color: var(--fv-text-primary);
      margin-bottom: var(--fv-spacing-xs);
    }

    .form-input {
      width: 100%;
      padding: var(--fv-spacing-sm);
      font-size: var(--fv-font-size-sm);
      border: 1px solid var(--fv-border);
      border-radius: var(--fv-border-radius);
      background-color: var(--fv-bg-primary);
      color: var(--fv-text-primary);
      box-sizing: border-box;
    }

    .form-input:focus {
      outline: none;
      border-color: var(--fv-accent-primary);
      box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
    }

    .form-textarea {
      min-height: 100px;
      resize: vertical;
      font-family: var(--fv-font-family);
    }

    .color-picker {
      display: flex;
      gap: var(--fv-spacing-sm);
    }

    .color-option {
      width: 40px;
      height: 40px;
      border-radius: var(--fv-border-radius);
      border: 3px solid transparent;
      cursor: pointer;
      transition: var(--fv-transition);
    }

    .color-option:hover {
      transform: scale(1.1);
    }

    .color-option.selected {
      border-color: var(--fv-text-primary);
      box-shadow: 0 0 0 2px var(--fv-bg-secondary), 0 0 0 4px var(--fv-accent-primary);
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

    .footer {
      padding: var(--fv-spacing-lg);
      border-top: 1px solid var(--fv-border);
      display: flex;
      justify-content: flex-end;
      gap: var(--fv-spacing-sm);
    }

    .btn {
      padding: var(--fv-spacing-sm) var(--fv-spacing-lg);
      border: none;
      border-radius: var(--fv-border-radius);
      font-size: var(--fv-font-size-sm);
      cursor: pointer;
      transition: var(--fv-transition);
    }

    .btn-cancel {
      background-color: var(--fv-bg-tertiary);
      color: var(--fv-text-primary);
      border: 1px solid var(--fv-border);
    }

    .btn-cancel:hover {
      background-color: var(--fv-bg-primary);
    }

    .btn-primary {
      background-color: var(--fv-accent-primary);
      color: white;
    }

    .btn-primary:hover {
      background-color: var(--fv-accent-hover);
    }

    .btn-primary:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .back-btn {
      background-color: var(--fv-bg-tertiary);
      color: var(--fv-text-primary);
      border: 1px solid var(--fv-border);
    }

    .back-btn:hover {
      background-color: var(--fv-bg-primary);
    }
  `;

  private resetForm() {
    this.step = 'select';
    this.selectedType = undefined;
    this.widgetTitle = '';
    this.feedUrl = '';
    this.content = '';
    this.color = 'yellow';
  }

  private handleClose() {
    this.resetForm();
    this.dispatchEvent(new CustomEvent('close', { bubbles: true }));
  }

  private handleSelectType(type: WidgetType) {
    this.selectedType = type;
    this.step = 'configure';
    
    if (type === 'rss') {
      this.widgetTitle = 'RSS Feed';
    } else if (type === 'note') {
      this.widgetTitle = 'Note';
    }
  }

  private handleBack() {
    this.step = 'select';
    this.selectedType = undefined;
  }

  private handleAdd() {
    if (!this.selectedType || !this.widgetTitle.trim()) return;

    const config: WidgetConfig = {
      type: this.selectedType,
      title: this.widgetTitle.trim()
    };

    if (this.selectedType === 'rss') {
      if (!this.feedUrl.trim()) return;
      config.feedUrl = this.feedUrl.trim();
    } else if (this.selectedType === 'note') {
      config.content = this.content.trim();
      config.color = this.color;
    }

    this.dispatchEvent(new CustomEvent('add-widget', {
      detail: config,
      bubbles: true
    }));

    this.handleClose();
  }

  private isFormValid(): boolean {
    if (!this.widgetTitle.trim()) return false;
    if (this.selectedType === 'rss' && !this.feedUrl.trim()) return false;
    return true;
  }

  private handleOverlayClick(e: Event) {
    if ((e.target as HTMLElement).classList.contains('overlay')) {
      this.handleClose();
    }
  }

  private renderSelectStep() {
    return html`
      <div class="content">
        <div class="widget-types">
          <div class="widget-type-card" @click=${() => this.handleSelectType('rss')}>
            <div class="widget-type-icon">📡</div>
            <h3 class="widget-type-title">RSS Feed</h3>
            <p class="widget-type-description">Subscribe to RSS/Atom feeds</p>
          </div>
          <div class="widget-type-card" @click=${() => this.handleSelectType('note')}>
            <div class="widget-type-icon">📝</div>
            <h3 class="widget-type-title">Note</h3>
            <p class="widget-type-description">Create a sticky note</p>
          </div>
        </div>
      </div>
    `;
  }

  private renderConfigureStep() {
    return html`
      <div class="content">
        <div class="form-group">
          <label class="form-label">Title</label>
          <input
            type="text"
            class="form-input"
            .value=${this.widgetTitle}
            @input=${(e: Event) => this.widgetTitle = (e.target as HTMLInputElement).value}
            placeholder="Widget title"
            autofocus
          />
        </div>

        ${this.selectedType === 'rss' ? html`
          <div class="form-group">
            <label class="form-label">Feed URL</label>
            <input
              type="url"
              class="form-input"
              .value=${this.feedUrl}
              @input=${(e: Event) => this.feedUrl = (e.target as HTMLInputElement).value}
              placeholder="https://example.com/feed.xml"
            />
          </div>
        ` : ''}

        ${this.selectedType === 'note' ? html`
          <div class="form-group">
            <label class="form-label">Content</label>
            <textarea
              class="form-input form-textarea"
              .value=${this.content}
              @input=${(e: Event) => this.content = (e.target as HTMLTextAreaElement).value}
              placeholder="Enter your note here..."
            ></textarea>
          </div>
          <div class="form-group">
            <label class="form-label">Color</label>
            <div class="color-picker">
              ${(['yellow', 'green', 'blue', 'red'] as NoteColor[]).map(c => html`
                <div
                  class="color-option color-${c} ${this.color === c ? 'selected' : ''}"
                  @click=${() => this.color = c}
                ></div>
              `)}
            </div>
          </div>
        ` : ''}
      </div>
      <div class="footer">
        <button class="btn back-btn" @click=${this.handleBack}>Back</button>
        <button class="btn btn-cancel" @click=${this.handleClose}>Cancel</button>
        <button
          class="btn btn-primary"
          @click=${this.handleAdd}
          ?disabled=${!this.isFormValid()}
        >
          Add Widget
        </button>
      </div>
    `;
  }

  render() {
    return html`
      <div class="overlay" @click=${this.handleOverlayClick}>
        <div class="modal">
          <div class="header">
            <h2 class="title">
              ${this.step === 'select' ? 'Add Widget' : `Configure ${this.selectedType === 'rss' ? 'RSS Feed' : 'Note'}`}
            </h2>
            <button class="close-btn" @click=${this.handleClose}>×</button>
          </div>
          ${this.step === 'select' ? this.renderSelectStep() : this.renderConfigureStep()}
          ${this.step === 'select' ? html`
            <div class="footer">
              <button class="btn btn-cancel" @click=${this.handleClose}>Cancel</button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }
}
