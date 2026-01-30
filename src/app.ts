import { LitElement, html, css } from 'lit';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import { customElement, state } from 'lit/decorators.js';
import { dataService, type DashboardData, type Widget, type RSSWidget, type NoteWidget, type Tab } from './services/data.js';
import './components/dashboard.js';
import './components/settings.js';
import './components/edit-widget-dialog.js';
import './components/tab-bar.js';
import './components/edit-tab-dialog.js';
import settingsIcon from 'iconoir/icons/settings.svg?raw';
import menuIcon from 'iconoir/icons/more-vert.svg?raw';
import plusIcon from 'iconoir/icons/plus.svg?raw';
import logOutIcon from 'iconoir/icons/log-out.svg?raw';
import newTabIcon from 'iconoir/icons/new-tab.svg?raw';
import editIcon from 'iconoir/icons/edit.svg?raw';

const WIDGET_ORDER_SPACING = 1000;

@customElement('fv-app')
export class App extends LitElement {
  @state() private data: DashboardData | undefined = undefined;
  @state() private loading = true;
  @state() private showSettings = false;
  @state() private showEditWidget = false;
  @state() private showEditTab = false;
  @state() private editingWidget: Widget | undefined = undefined;
  @state() private editingTab: Tab | undefined = undefined;
  @state() private githubLoggedIn = false;
  @state() private loginError: string | undefined = undefined;
  @state() private loginToken: string = '';
  @state() private showMenu = false;

  static styles = css`
    :host {
      display: block;
      min-height: 100vh;
    }

    .header {
      background-color: var(--fv-bg-secondary);
      border-bottom: 1px solid var(--fv-border);
      box-shadow: 0 2px 4px var(--fv-shadow);
      height: var(--fv-header-height);
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 var(--fv-spacing-lg);
      position: sticky;
      top: 0;
      z-index: 100;
      gap: var(--fv-spacing-lg);
    }

    .logo {
      font-size: var(--fv-font-size-xl);
      font-weight: 600;
      color: var(--fv-accent-primary);
      text-decoration: none;
      white-space: nowrap;
    }

    .header-tabs {
      flex: 1;
      min-width: 0;
      overflow: hidden;
    }

    .nav {
      display: flex;
      align-items: center;
      gap: var(--fv-spacing-md);
      position: relative;
    }

    .menu-btn {
      background: none;
      border: none;
      cursor: pointer;
      padding: var(--fv-spacing-sm);
      color: var(--fv-text-primary);
      transition: var(--fv-transition);
      border-radius: var(--fv-border-radius);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .menu-btn:hover {
      background-color: var(--fv-bg-tertiary);
    }

    .menu-btn svg {
      width: 24px;
      height: 24px;
    }

    .menu-dropdown {
      position: absolute;
      top: calc(100% + var(--fv-spacing-sm));
      right: 0;
      background: var(--fv-bg-secondary);
      border: 1px solid var(--fv-border);
      border-radius: var(--fv-border-radius);
      box-shadow: 0 4px 12px var(--fv-shadow);
      min-width: 200px;
      z-index: 1000;
      overflow: hidden;
    }

    .menu-item {
      display: flex;
      align-items: center;
      gap: var(--fv-spacing-md);
      padding: var(--fv-spacing-md);
      background: none;
      border: none;
      width: 100%;
      text-align: left;
      cursor: pointer;
      color: var(--fv-text-primary);
      font-size: var(--fv-font-size-sm);
      transition: var(--fv-transition);
    }

    .menu-item:hover {
      background-color: var(--fv-bg-tertiary);
    }

    .menu-item svg {
      width: 20px;
      height: 20px;
    }

    .menu-item.logout-item {
      border-top: 1px solid var(--fv-border);
      color: var(--fv-text-secondary);
    }

    .menu-item.logout-item:hover {
      color: var(--fv-danger);
    }

    .menu-item-icon {
      width: 16px;
      height: 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .menu-item-icon svg {
      width: 100%;
      height: 100%;
    }

    .menu-submenu {
      position: absolute;
      left: 100%;
      top: 0;
      background: var(--fv-bg-secondary);
      border: 1px solid var(--fv-border);
      border-radius: var(--fv-border-radius);
      box-shadow: 0 4px 12px var(--fv-shadow);
      min-width: 200px;
      z-index: 1001;
      overflow: hidden;
      margin-left: var(--fv-spacing-xs);
    }

    .main {
      padding: var(--fv-spacing-lg);
    }

    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      height: calc(100vh - var(--fv-header-height));
      font-size: var(--fv-font-size-lg);
      color: var(--fv-text-secondary);
    }

    .error {
      display: flex;
      align-items: center;
      justify-content: center;
      height: calc(100vh - var(--fv-header-height));
      flex-direction: column;
      gap: var(--fv-spacing-md);
      color: var(--fv-danger);
    }

    .retry-btn {
      background: var(--fv-accent-primary);
      border: none;
      border-radius: var(--fv-border-radius);
      padding: var(--fv-spacing-sm) var(--fv-spacing-md);
      color: white;
      cursor: pointer;
      font-size: var(--fv-font-size-sm);
    }

    .login-form {
      max-width: 400px;
      margin: 3rem auto;
      padding: 2rem;
      background: var(--fv-bg-secondary);
      border-radius: var(--fv-border-radius-lg);
      box-shadow: 0 2px 8px var(--fv-shadow);
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }

    .login-title {
      margin: 0;
      color: var(--fv-accent-primary);
      font-size: 1.5rem;
    }

    .login-field {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .login-field label {
      font-size: var(--fv-font-size-sm);
      color: var(--fv-text-secondary);
    }

    .login-field input {
      padding: 0.5rem;
      font-size: 1rem;
      border-radius: var(--fv-border-radius);
      border: 1px solid var(--fv-border);
    }

    .login-submit {
      background: var(--fv-accent-primary);
      color: white;
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: var(--fv-border-radius);
      font-size: 1rem;
      cursor: pointer;
    }

    .login-error {
      color: var(--fv-danger);
      font-size: var(--fv-font-size-sm);
    }

    .login-help {
      color: var(--fv-text-muted);
      font-size: var(--fv-font-size-xs);
      line-height: 1.4;
    }

    .login-help a {
      color: var(--fv-accent-primary);
    }
  `;

  async connectedCallback() {
    super.connectedCallback();
    const githubToken = localStorage.getItem('freevibes-github-pat');
    this.githubLoggedIn = !!githubToken;
    if (this.githubLoggedIn && githubToken) {
      await dataService.loginWithGithubToken(githubToken);
    }
    await this.loadDashboardData();
    this.applyTheme();
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', () => {
      if (this.data?.settings.darkModeType === 'system') {
        this.applyTheme();
      }
    });

    // Close menu on outside click
    document.addEventListener('click', this.handleDocumentClick);
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    document.removeEventListener('click', this.handleDocumentClick);
  }

  private handleDocumentClick = (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (target && target.closest && !target.closest('.nav')) {
      this.showMenu = false;
    }
  };

  private async loadDashboardData() {
    try {
      this.loading = true;
      this.data = await dataService.loadData();
      this.githubLoggedIn = dataService.isGistEnabled();
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      this.loading = false;
    }
  }

  private async handleGithubLogin(loginEvent: Event) {
    loginEvent.preventDefault();
    this.loginError = undefined;
    try {
      const githubToken = this.loginToken.trim();
      await dataService.loginWithGithubToken(githubToken);
      localStorage.setItem('freevibes-github-pat', githubToken);
      this.githubLoggedIn = true;
      this.data = await dataService.loadData();
      this.applyTheme();
    } catch (error: any) {
      this.loginError = 'Login failed: ' + (error?.message || 'Invalid token');
      this.githubLoggedIn = false;
    }
  }

  private handleTokenInput(inputEvent: Event) {
    this.loginToken = (inputEvent.target as HTMLInputElement).value;
  }

  private adjustColorBrightness(hex: string, amount: number): string {
    // Remove # if present
    hex = hex.replace('#', '');
    
    // Parse r, g, b values
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Adjust brightness
    const newR = Math.max(0, Math.min(255, r + amount));
    const newG = Math.max(0, Math.min(255, g + amount));
    const newB = Math.max(0, Math.min(255, b + amount));
    
    // Convert back to hex
    return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
  }

  private applyTheme() {
    const settings = this.data?.settings;
    if (!settings) return;

    let isDarkMode = false;
    
    switch (settings.darkModeType) {
      case 'on':
        isDarkMode = true;
        break;
      case 'off':
        isDarkMode = false;
        break;
      case 'system':
        isDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
        break;
    }

    // Update darkMode boolean for backward compatibility
    if (settings.darkMode !== isDarkMode) {
      settings.darkMode = isDarkMode;
    }

    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    
    // Apply custom colors
    if (settings.mainColor) {
      document.documentElement.style.setProperty('--fv-accent-primary', settings.mainColor);
      // Calculate a slightly darker hover color
      const color = this.adjustColorBrightness(settings.mainColor, -20);
      document.documentElement.style.setProperty('--fv-accent-hover', color);
    }
    
    if (settings.backgroundColor && !isDarkMode) {
      document.documentElement.style.setProperty('--fv-bg-primary', settings.backgroundColor);
    }
    
    // Apply font size
    if (settings.fontSize) {
      document.documentElement.style.setProperty('--fv-font-size-base', `${settings.fontSize}px`);
    }
  }

  private async handleDataUpdate(updateEvent: CustomEvent) {
    this.data = updateEvent.detail;
    if (this.data) {
      await dataService.saveData(this.data);
    }
  }

  private handleSettingsUpdate(updateEvent: CustomEvent) {
    this.data = updateEvent.detail;
    this.applyTheme();
    this.showSettings = false;
  }

  private handleLogout() {
    dataService.logout();
    this.githubLoggedIn = false;
    this.showMenu = false;
  }

  private toggleMenu(event: MouseEvent) {
    event.stopPropagation();
    this.showMenu = !this.showMenu;
  }

  private openSettings() {
    this.showSettings = true;
    this.showMenu = false;
  }

  private closeSettings() {
    this.showSettings = false;
  }

  private openAddWidget() {
    this.editingWidget = undefined;
    this.showEditWidget = true;
    this.showMenu = false;
  }

  private closeEditWidget() {
    this.showEditWidget = false;
    this.editingWidget = undefined;
  }

  private handleConfigureWidget(event: CustomEvent) {
    this.editingWidget = event.detail;
    this.showEditWidget = true;
  }

  private async handleAddWidget(event: CustomEvent) {
    const config = event.detail;
    if (!this.data) return;

    const currentTabId = this.data.settings.currentTabId || this.data.tabs[0]?.id;
    if (!currentTabId) return;

    const columnWidgets = this.data.widgets.filter(w => w.tabId === currentTabId && w.position.column === 1);
    const minOrder = columnWidgets.length > 0 
      ? Math.min(...columnWidgets.map(w => w.position.order))
      : WIDGET_ORDER_SPACING;

    const newWidget: Widget = {
      id: crypto.randomUUID(),
      type: config.type,
      title: config.title,
      tabId: currentTabId,
      position: {
        column: 1,
        order: minOrder - WIDGET_ORDER_SPACING
      },
      height: 6
    };

    if (config.type === 'rss') {
      (newWidget as RSSWidget).feedUrl = config.feedUrl;
    } else if (config.type === 'note') {
      (newWidget as NoteWidget).content = config.content || '';
      (newWidget as NoteWidget).color = config.color || 'yellow';
    }

    const updatedData = {
      ...this.data,
      widgets: [...this.data.widgets, newWidget]
    };

    this.data = updatedData;
    await dataService.saveData(updatedData);
    this.showEditWidget = false;
  }

  private async handleEditWidget(event: CustomEvent) {
    const config = event.detail;
    if (!this.data || !config.id) return;

    const updatedWidgets = this.data.widgets.map(w => {
      if (w.id !== config.id) return w;

      const updatedWidget: Widget = {
        ...w,
        title: config.title
      };

      if (config.type === 'rss') {
        (updatedWidget as RSSWidget).feedUrl = config.feedUrl;
      } else if (config.type === 'note') {
        (updatedWidget as NoteWidget).content = config.content || '';
        (updatedWidget as NoteWidget).color = config.color;
      }

      return updatedWidget;
    });

    const updatedData = {
      ...this.data,
      widgets: updatedWidgets
    };

    this.data = updatedData;
    await dataService.saveData(updatedData);
    this.showEditWidget = false;
    this.editingWidget = undefined;
  }

  private async handleDeleteWidget(event: CustomEvent) {
    const { id } = event.detail;
    if (!this.data || !id) return;

    const updatedData = {
      ...this.data,
      widgets: this.data.widgets.filter(w => w.id !== id)
    };

    this.data = updatedData;
    await dataService.saveData(updatedData);
    this.showEditWidget = false;
    this.editingWidget = undefined;
  }

  private getCurrentTabId(): string {
    if (!this.data) return '';
    return this.data.settings.currentTabId || this.data.tabs[0]?.id || '';
  }

  private async handleTabSelected(event: CustomEvent) {
    const tabId = event.detail;
    if (!this.data) return;

    const updatedData = {
      ...this.data,
      settings: {
        ...this.data.settings,
        currentTabId: tabId
      }
    };

    this.data = updatedData;
    await dataService.saveData(updatedData);
  }

  private async handleTabsReordered(event: CustomEvent) {
    const reorderedTabs = event.detail;
    if (!this.data) return;

    const updatedData = {
      ...this.data,
      tabs: reorderedTabs
    };

    this.data = updatedData;
    await dataService.saveData(updatedData);
  }

  private openAddTab() {
    this.editingTab = undefined;
    this.showEditTab = true;
    this.showMenu = false;
  }

  private openEditCurrentTab() {
    if (!this.data) return;
    const currentTabId = this.getCurrentTabId();
    const tab = this.data.tabs.find(t => t.id === currentTabId);
    if (tab) {
      this.editingTab = tab;
      this.showEditTab = true;
      this.showMenu = false;
    }
  }

  private closeEditTab() {
    this.showEditTab = false;
    this.editingTab = undefined;
  }

  private async handleAddTab(event: CustomEvent) {
    const config = event.detail;
    if (!this.data) return;

    const maxOrder = this.data.tabs.length > 0
      ? Math.max(...this.data.tabs.map(t => t.order))
      : 0;

    const newTab: Tab = {
      id: crypto.randomUUID(),
      name: config.name,
      order: maxOrder + 1000
    };

    const updatedData = {
      ...this.data,
      tabs: [...this.data.tabs, newTab],
      settings: {
        ...this.data.settings,
        currentTabId: newTab.id
      }
    };

    this.data = updatedData;
    await dataService.saveData(updatedData);
    this.showEditTab = false;
  }

  private async handleEditTabSave(event: CustomEvent) {
    const config = event.detail;
    if (!this.data || !config.id) return;

    const updatedTabs = this.data.tabs.map(t =>
      t.id === config.id
        ? { ...t, name: config.name }
        : t
    );

    const updatedData = {
      ...this.data,
      tabs: updatedTabs
    };

    this.data = updatedData;
    await dataService.saveData(updatedData);
    this.showEditTab = false;
    this.editingTab = undefined;
  }

  private async handleDeleteTab(event: CustomEvent) {
    const { id } = event.detail;
    if (!this.data || !id) return;

    if (this.data.tabs.length <= 1) {
      return;
    }

    const deletedTabIndex = this.data.tabs.findIndex(t => t.id === id);
    const updatedTabs = this.data.tabs.filter(t => t.id !== id);
    const updatedWidgets = this.data.widgets.filter(w => w.tabId !== id);

    let newCurrentTabId = this.data.settings.currentTabId;
    if (newCurrentTabId === id) {
      const newIndex = Math.min(deletedTabIndex, updatedTabs.length - 1);
      newCurrentTabId = updatedTabs[newIndex]?.id || updatedTabs[0]?.id;
    }

    const updatedData = {
      ...this.data,
      tabs: updatedTabs,
      widgets: updatedWidgets,
      settings: {
        ...this.data.settings,
        currentTabId: newCurrentTabId
      }
    };

    this.data = updatedData;
    await dataService.saveData(updatedData);
    this.showEditTab = false;
    this.editingTab = undefined;
  }

  render() {
    if (this.loading) {
      return html`
        <div class="header">
          <a href="/" class="logo">FreeVibes</a>
        </div>
        <div class="loading">Loading dashboard...</div>
      `;
    }

    if (!this.githubLoggedIn) {
      return html`
        <div class="header">
          <a href="/" class="logo">FreeVibes</a>
        </div>
        <form class="login-form" @submit=${this.handleGithubLogin}>
          <h2 class="login-title">Sign in with GitHub</h2>
          <div class="login-field">
            <label>GitHub Personal Access Token (with gist scope):</label>
            <input type="password" .value=${this.loginToken} @input=${this.handleTokenInput} required autocomplete="off" />
          </div>
          <button type="submit" class="login-submit">Sign In</button>
          ${this.loginError ? html`<div class="login-error">${this.loginError}</div>` : ''}
          <div class="login-help">
            <b>How to get a token?</b><br>
            Go to <a href="https://github.com/settings/tokens/new?scopes=gist&description=FreeVibes%20Dashboard" target="_blank" rel="noopener">GitHub token settings</a>,<br>
            create a token with <b>gist</b> scope, and paste it above.
          </div>
        </form>
      `;
    }

    if (!this.data) {
      return html`
        <div class="header">
          <a href="/" class="logo">FreeVibes</a>
        </div>
        <div class="error">
          <div>Failed to load dashboard data</div>
          <button class="retry-btn" @click=${this.loadDashboardData}>Retry</button>
        </div>
      `;
    }

    return html`
      <div class="header">
        <a href="/" class="logo">FreeVibes</a>
        ${this.data.tabs.length > 0 ? html`
          <div class="header-tabs">
            <fv-tab-bar
              .tabs=${this.data.tabs}
              .currentTabId=${this.getCurrentTabId()}
              @tab-selected=${this.handleTabSelected}
              @tabs-reordered=${this.handleTabsReordered}>
            </fv-tab-bar>
          </div>
        ` : ''}
        <nav class="nav">
          <button class="menu-btn" @click=${this.toggleMenu} title="Menu">
            ${unsafeSVG(menuIcon)}
          </button>
          ${this.showMenu ? html`
            <div class="menu-dropdown">
              <button class="menu-item" @click=${this.openAddWidget}>
                ${unsafeSVG(plusIcon)}
                <span>Add widget</span>
              </button>
              <button class="menu-item" @click=${this.openAddTab}>
                ${unsafeSVG(newTabIcon)}
                <span>Add tab</span>
              </button>
              <button class="menu-item" @click=${this.openEditCurrentTab}>
                ${unsafeSVG(editIcon)}
                <span>Edit current tab</span>
              </button>
              <button class="menu-item" @click=${this.openSettings}>
                ${unsafeSVG(settingsIcon)}
                <span>Settings</span>
              </button>
              ${this.githubLoggedIn ? html`
                <button class="menu-item logout-item" @click=${this.handleLogout}>
                  ${unsafeSVG(logOutIcon)}
                  <span>Logout</span>
                </button>
              ` : ''}
            </div>
          ` : ''}
        </nav>
      </div>
      <main class="main">
        <fv-dashboard 
          .data=${this.data}
          .currentTabId=${this.getCurrentTabId()}
          @data-updated=${this.handleDataUpdate}
          @configure-widget=${this.handleConfigureWidget}>
        </fv-dashboard>
      </main>
      ${this.showSettings ? html`
        <fv-settings 
          .data=${this.data}
          ?open=${this.showSettings}
          @settings-updated=${this.handleSettingsUpdate}
          @close=${this.closeSettings}>
        </fv-settings>
      ` : ''}
      ${this.showEditWidget ? html`
        <fv-edit-widget-dialog
          ?open=${this.showEditWidget}
          .widget=${this.editingWidget}
          @add-widget=${this.handleAddWidget}
          @edit-widget=${this.handleEditWidget}
          @delete-widget=${this.handleDeleteWidget}
          @close=${this.closeEditWidget}>
        </fv-edit-widget-dialog>
      ` : ''}
      ${this.showEditTab ? html`
        <fv-edit-tab-dialog
          ?open=${this.showEditTab}
          .tab=${this.editingTab}
          .canDelete=${this.data.tabs.length > 1}
          @add-tab=${this.handleAddTab}
          @edit-tab=${this.handleEditTabSave}
          @delete-tab=${this.handleDeleteTab}
          @close=${this.closeEditTab}>
        </fv-edit-tab-dialog>
      ` : ''}
    `;
  }
}
