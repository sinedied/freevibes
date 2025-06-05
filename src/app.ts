import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { dataService, type DashboardData } from './services/data.js';
import './components/dashboard.js';
import './components/settings.js';

@customElement('fv-app')
export class App extends LitElement {
  @state() private data: DashboardData | null = null;
  @state() private loading = true;
  @state() private showSettings = false;
  @state() private githubLoggedIn = false;
  @state() private loginError: string | null = null;
  @state() private loginToken: string = '';

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
    }

    .logo {
      font-size: var(--fv-font-size-xl);
      font-weight: 600;
      color: var(--fv-accent-primary);
      text-decoration: none;
    }

    .nav {
      display: flex;
      align-items: center;
      gap: var(--fv-spacing-md);
    }

    .theme-toggle {
      background: none;
      border: 1px solid var(--fv-border);
      border-radius: var(--fv-border-radius);
      padding: var(--fv-spacing-sm);
      color: var(--fv-text-primary);
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: var(--fv-spacing-xs);
      font-size: var(--fv-font-size-sm);
      transition: var(--fv-transition);
    }

    .theme-toggle:hover {
      background-color: var(--fv-bg-tertiary);
      border-color: var(--fv-accent-primary);
    }

    .settings-btn {
      background: var(--fv-accent-primary);
      border: none;
      border-radius: var(--fv-border-radius);
      padding: var(--fv-spacing-sm) var(--fv-spacing-md);
      color: white;
      cursor: pointer;
      font-size: var(--fv-font-size-sm);
      transition: var(--fv-transition);
    }

    .settings-btn:hover {
      background-color: var(--fv-accent-hover);
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
  `;

  async connectedCallback() {
    super.connectedCallback();
    // Check if PAT is present in localStorage and set githubLoggedIn accordingly
    const pat = localStorage.getItem('freevibes-github-pat');
    this.githubLoggedIn = !!pat;
    if (this.githubLoggedIn) {
      // If token is present, ensure dataService uses gist
      await dataService.loginWithGithubToken(pat!);
    }
    await this.loadData();
    this.applyTheme();
  }

  private async loadData() {
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

  private async handleGithubLogin(e: Event) {
    e.preventDefault();
    this.loginError = null;
    try {
      const token = this.loginToken.trim();
      await dataService.loginWithGithubToken(token);
      localStorage.setItem('freevibes-github-pat', token);
      this.githubLoggedIn = true;
      this.data = await dataService.loadData();
      this.applyTheme();
    } catch (err: any) {
      this.loginError = 'Login failed: ' + (err?.message || 'Invalid token');
      this.githubLoggedIn = false;
    }
  }

  private handleTokenInput(e: Event) {
    this.loginToken = (e.target as HTMLInputElement).value;
  }

  private toggleTheme() {
    if (!this.data) return;
    
    const newDarkMode = !this.data.settings.darkMode;
    dataService.updateSettings({ darkMode: newDarkMode });
    this.data = { ...this.data, settings: { ...this.data.settings, darkMode: newDarkMode } };
    this.applyTheme();
  }

  private applyTheme() {
    const isDark = this.data?.settings.darkMode ?? false;
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }

  private handleDataUpdate(event: CustomEvent) {
    this.data = event.detail;
  }

  private handleSettingsUpdate(event: CustomEvent) {
    this.data = event.detail;
    this.applyTheme();
    this.showSettings = false;
  }

  private openSettings() {
    this.showSettings = true;
  }

  private closeSettings() {
    this.showSettings = false;
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
        <form style="max-width:400px;margin:3rem auto;padding:2rem;background:var(--fv-bg-secondary);border-radius:var(--fv-border-radius-lg);box-shadow:0 2px 8px var(--fv-shadow);display:flex;flex-direction:column;gap:1.5rem;" @submit=${this.handleGithubLogin}>
          <h2 style="margin:0;color:var(--fv-accent-primary);font-size:1.5rem;">Sign in with GitHub</h2>
          <label style="display:flex;flex-direction:column;gap:0.5rem;">
            <span style="font-size:var(--fv-font-size-sm);color:var(--fv-text-secondary);">GitHub Personal Access Token (with gist scope):</span>
            <input type="password" style="padding:0.5rem;font-size:1rem;border-radius:var(--fv-border-radius);border:1px solid var(--fv-border);" .value=${this.loginToken} @input=${this.handleTokenInput} required autocomplete="off" />
          </label>
          <button type="submit" style="background:var(--fv-accent-primary);color:white;padding:0.75rem 1.5rem;border:none;border-radius:var(--fv-border-radius);font-size:1rem;cursor:pointer;">Sign In</button>
          ${this.loginError ? html`<div style="color:var(--fv-danger);font-size:var(--fv-font-size-sm);">${this.loginError}</div>` : ''}
          <div style="color:var(--fv-text-muted);font-size:var(--fv-font-size-xs);line-height:1.4;">
            <b>How to get a token?</b><br>
            Go to <a href="https://github.com/settings/tokens/new?scopes=gist&description=FreeVibes%20Dashboard" target="_blank" rel="noopener" style="color:var(--fv-accent-primary);">GitHub token settings</a>,<br>
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
          <button class="retry-btn" @click=${this.loadData}>Retry</button>
        </div>
      `;
    }

    return html`
      <div class="header">
        <a href="/" class="logo">FreeVibes</a>
        <nav class="nav">
          <button class="theme-toggle" @click=${this.toggleTheme}>
            <span>${this.data.settings.darkMode ? '☀️' : '🌙'}</span>
            <span>${this.data.settings.darkMode ? 'Light' : 'Dark'}</span>
          </button>
          <button class="settings-btn" @click=${this.openSettings}>Settings</button>
        </nav>
      </div>
      <main class="main">
        <fv-dashboard 
          .data=${this.data} 
          @data-updated=${this.handleDataUpdate}>
        </fv-dashboard>
      </main>
      ${this.showSettings ? html`
        <fv-settings 
          .data=${this.data}
          @settings-updated=${this.handleSettingsUpdate}
          @close=${this.closeSettings}>
        </fv-settings>
      ` : ''}
    `;
  }
}
