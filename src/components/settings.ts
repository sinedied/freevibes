import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { type DashboardData } from '../services/data.js';
import { dataService } from '../services/data.js';

@customElement('fv-settings')
export class Settings extends LitElement {
  @property({ type: Object }) data!: DashboardData;
  @property({ type: Boolean }) open = false;
  @state() private columns = 3;
  @state() private darkModeType: 'on' | 'off' | 'system' = 'off';
  @state() private mainColor = '#007bff';
  @state() private backgroundColor = '#f8f9fa';
  @state() private fontSize = 16;

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

    .setting-group {
      margin-bottom: var(--fv-spacing-lg);
    }

    .setting-group:last-child {
      margin-bottom: 0;
    }

    .setting-label {
      display: block;
      font-weight: 500;
      color: var(--fv-text-primary);
      margin-bottom: var(--fv-spacing-sm);
      font-size: var(--fv-font-size-sm);
    }

    .setting-description {
      color: var(--fv-text-secondary);
      font-size: var(--fv-font-size-xs);
      margin-bottom: var(--fv-spacing-sm);
    }

    .range-input {
      width: 100%;
      margin-bottom: var(--fv-spacing-xs);
    }

    .range-value {
      display: inline-block;
      background-color: var(--fv-bg-tertiary);
      color: var(--fv-text-primary);
      padding: var(--fv-spacing-xs) var(--fv-spacing-sm);
      border-radius: var(--fv-border-radius);
      font-size: var(--fv-font-size-sm);
      font-weight: 500;
    }

    .radio-group {
      display: flex;
      gap: var(--fv-spacing-md);
      margin-bottom: var(--fv-spacing-xs);
    }

    .radio-item {
      display: flex;
      align-items: center;
      gap: var(--fv-spacing-xs);
    }

    .radio-item input[type="radio"] {
      margin: 0;
    }

    .radio-item label {
      margin: 0;
      font-weight: normal;
      cursor: pointer;
      font-size: var(--fv-font-size-sm);
    }

    .color-input-group {
      display: flex;
      align-items: center;
      gap: var(--fv-spacing-sm);
      margin-bottom: var(--fv-spacing-xs);
    }

    .color-input {
      width: 60px;
      height: 40px;
      border: 1px solid var(--fv-border);
      border-radius: var(--fv-border-radius);
      cursor: pointer;
      background: none;
      padding: 2px;
    }

    .color-input::-webkit-color-swatch-wrapper {
      padding: 0;
    }

    .color-input::-webkit-color-swatch {
      border: none;
      border-radius: 4px;
    }

    .color-hex {
      font-family: monospace;
      font-size: var(--fv-font-size-sm);
      color: var(--fv-text-secondary);
      background: var(--fv-bg-tertiary);
      padding: var(--fv-spacing-xs) var(--fv-spacing-sm);
      border-radius: var(--fv-border-radius);
      border: 1px solid var(--fv-border);
      width: 100px;
    }

    .actions {
      padding: var(--fv-spacing-lg);
      border-top: 1px solid var(--fv-border);
      display: flex;
      justify-content: flex-end;
      gap: var(--fv-spacing-sm);
    }

    .btn {
      padding: var(--fv-spacing-sm) var(--fv-spacing-md);
      border-radius: var(--fv-border-radius);
      font-size: var(--fv-font-size-sm);
      cursor: pointer;
      transition: var(--fv-transition);
      border: 1px solid var(--fv-border);
    }

    .btn-primary {
      background-color: var(--fv-accent-primary);
      color: white;
      border-color: var(--fv-accent-primary);
    }

    .btn-primary:hover {
      background-color: var(--fv-accent-hover);
      border-color: var(--fv-accent-hover);
    }

    .btn-secondary {
      background-color: var(--fv-bg-secondary);
      color: var(--fv-text-primary);
    }

    .btn-secondary:hover {
      background-color: var(--fv-bg-tertiary);
    }

    .info {
      background-color: var(--fv-bg-tertiary);
      border-radius: var(--fv-border-radius);
      padding: var(--fv-spacing-md);
      margin-top: var(--fv-spacing-lg);
    }

    .info-title {
      font-weight: 500;
      color: var(--fv-text-primary);
      margin: 0 0 var(--fv-spacing-xs) 0;
      font-size: var(--fv-font-size-sm);
    }

    .info-text {
      color: var(--fv-text-secondary);
      font-size: var(--fv-font-size-xs);
      margin: 0;
      line-height: 1.4;
    }
  `;

  connectedCallback() {
    super.connectedCallback();
    if (this.data) {
      this.columns = this.data.settings.columns;
      this.darkModeType = this.data.settings.darkModeType;
      this.mainColor = this.data.settings.mainColor;
      this.backgroundColor = this.data.settings.backgroundColor;
      this.fontSize = this.data.settings.fontSize;
    }
  }

  updated(changedProperties: Map<string, any>) {
    if (changedProperties.has('data') && this.data) {
      this.columns = this.data.settings.columns;
      this.darkModeType = this.data.settings.darkModeType;
      this.mainColor = this.data.settings.mainColor;
      this.backgroundColor = this.data.settings.backgroundColor;
      this.fontSize = this.data.settings.fontSize;
    }
  }

  private handleOverlayClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  private handleColumnsChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.columns = parseInt(target.value);
  }

  private handleDarkModeChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.darkModeType = target.value as 'on' | 'off' | 'system';
  }

  private handleMainColorChange(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.type === 'color') {
      this.mainColor = target.value;
    } else if (target.type === 'text') {
      const value = target.value.trim();
      if (value.match(/^#[0-9A-Fa-f]{6}$/)) {
        this.mainColor = value;
      }
    }
  }

  private handleBackgroundColorChange(event: Event) {
    const target = event.target as HTMLInputElement;
    if (target.type === 'color') {
      this.backgroundColor = target.value;
    } else if (target.type === 'text') {
      const value = target.value.trim();
      if (value.match(/^#[0-9A-Fa-f]{6}$/)) {
        this.backgroundColor = value;
      }
    }
  }

  private handleFontSizeChange(event: Event) {
    const target = event.target as HTMLInputElement;
    this.fontSize = parseInt(target.value);
  }

  private save() {
    const updatedData = {
      ...this.data,
      settings: {
        ...this.data.settings,
        columns: this.columns,
        darkModeType: this.darkModeType,
        darkMode: this.darkModeType === 'on' || (this.darkModeType === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches),
        mainColor: this.mainColor,
        backgroundColor: this.backgroundColor,
        fontSize: this.fontSize
      }
    };

    dataService.saveData(updatedData);
    
    this.dispatchEvent(new CustomEvent('settings-updated', {
      detail: updatedData,
      bubbles: true
    }));

    this.close();
  }

  private close() {
    this.dispatchEvent(new CustomEvent('close', { bubbles: true }));
  }

  render() {
    return html`
      <div class="overlay" @click=${this.handleOverlayClick}>
        <div class="modal">
          <div class="header">
            <h2 class="title">Settings</h2>
            <button class="close-btn" @click=${this.close}>&times;</button>
          </div>
          
          <div class="content">
            <div class="setting-group">
              <label class="setting-label">Grid Columns</label>
              <div class="setting-description">
                Adjust the number of columns in the dashboard grid
              </div>
              <input
                type="range"
                class="range-input"
                min="1"
                max="15"
                .value=${this.columns.toString()}
                @input=${this.handleColumnsChange}
              />
              <span class="range-value">${this.columns} column${this.columns !== 1 ? 's' : ''}</span>
            </div>

            <div class="setting-group">
              <label class="setting-label">Dark Mode</label>
              <div class="setting-description">
                Choose your preferred color scheme
              </div>
              <div class="radio-group">
                <div class="radio-item">
                  <input 
                    type="radio" 
                    id="dark-off" 
                    name="darkMode" 
                    value="off" 
                    .checked=${this.darkModeType === 'off'}
                    @change=${this.handleDarkModeChange}
                  />
                  <label for="dark-off">Light</label>
                </div>
                <div class="radio-item">
                  <input 
                    type="radio" 
                    id="dark-on" 
                    name="darkMode" 
                    value="on" 
                    .checked=${this.darkModeType === 'on'}
                    @change=${this.handleDarkModeChange}
                  />
                  <label for="dark-on">Dark</label>
                </div>
                <div class="radio-item">
                  <input 
                    type="radio" 
                    id="dark-system" 
                    name="darkMode" 
                    value="system" 
                    .checked=${this.darkModeType === 'system'}
                    @change=${this.handleDarkModeChange}
                  />
                  <label for="dark-system">System</label>
                </div>
              </div>
            </div>

            <div class="setting-group">
              <label class="setting-label">Accent Color</label>
              <div class="setting-description">
                Choose the main accent color for buttons and links
              </div>
              <div class="color-input-group">
                <input
                  type="color"
                  class="color-input"
                  .value=${this.mainColor}
                  @input=${this.handleMainColorChange}
                />
                <input
                  type="text"
                  class="color-hex"
                  .value=${this.mainColor}
                  @input=${this.handleMainColorChange}
                  pattern="#[0-9A-Fa-f]{6}"
                  placeholder="#007bff"
                />
              </div>
            </div>

            <div class="setting-group">
              <label class="setting-label">Background Color</label>
              <div class="setting-description">
                Choose the background color (only applies in light mode)
              </div>
              <div class="color-input-group">
                <input
                  type="color"
                  class="color-input"
                  .value=${this.backgroundColor}
                  @input=${this.handleBackgroundColorChange}
                />
                <input
                  type="text"
                  class="color-hex"
                  .value=${this.backgroundColor}
                  @input=${this.handleBackgroundColorChange}
                  pattern="#[0-9A-Fa-f]{6}"
                  placeholder="#f8f9fa"
                />
              </div>
            </div>

            <div class="setting-group">
              <label class="setting-label">Font Size</label>
              <div class="setting-description">
                Adjust the base font size for better readability
              </div>
              <input
                type="range"
                class="range-input"
                min="12"
                max="24"
                .value=${this.fontSize.toString()}
                @input=${this.handleFontSizeChange}
              />
              <span class="range-value">${this.fontSize}px</span>
            </div>

            <div class="info">
              <h3 class="info-title">💡 About FreeVibes</h3>
              <p class="info-text">
                Your dashboard data is automatically saved to your browser's local storage. 
                To sync across devices or backup your data, you can export your configuration 
                and add it to a GitHub repository.
              </p>
            </div>
          </div>

          <div class="actions">
            <button class="btn btn-secondary" @click=${this.close}>
              Cancel
            </button>
            <button class="btn btn-primary" @click=${this.save}>
              Save Changes
            </button>
          </div>
        </div>
      </div>
    `;
  }
}
