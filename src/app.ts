import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { dataService, type DashboardData } from './services/data.js';
import './components/dashboard.js';
import './components/settings.js';

@customElement('fv-app')
export class App extends LitElement {
  @state() private data: DashboardData | undefined = undefined;
  @state() private loading = true;
  @state() private showSettings = false;
  @state() private githubLoggedIn = false;
  @state() private loginError: string | undefined = undefined;
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

    .logout-btn {
      background: none;
      border: 1px solid var(--fv-border);
      border-radius: var(--fv-border-radius);
      padding: var(--fv-spacing-sm) var(--fv-spacing-md);
      color: var(--fv-text-secondary);
      cursor: pointer;
      font-size: var(--fv-font-size-sm);
      transition: var(--fv-transition);
    }

    .logout-btn:hover {
      background-color: var(--fv-bg-tertiary);
      border-color: var(--fv-danger);
      color: var(--fv-danger);
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
  }

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

  private toggleTheme() {
    if (!this.data) return;
    
    const newDarkModeState = !this.data.settings.darkMode;
    dataService.updateSettings({ darkMode: newDarkModeState });
    this.data = { ...this.data, settings: { ...this.data.settings, darkMode: newDarkModeState } };
    this.applyTheme();
  }

  private applyTheme() {
    const isDarkMode = this.data?.settings.darkMode ?? false;
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }

  private handleDataUpdate(updateEvent: CustomEvent) {
    this.data = updateEvent.detail;
  }

  private handleSettingsUpdate(updateEvent: CustomEvent) {
    this.data = updateEvent.detail;
    this.applyTheme();
    this.showSettings = false;
  }

  private handleLogout() {
    dataService.logout();
    this.githubLoggedIn = false;
    // No need to reload data since we keep local data
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
        <nav class="nav">
          <button class="theme-toggle" @click=${this.toggleTheme}>
            <span>${this.data.settings.darkMode ? '☀️' : '🌙'}</span>
            <span>${this.data.settings.darkMode ? 'Light' : 'Dark'}</span>
          </button>
          <button class="settings-btn" @click=${this.openSettings}>Settings</button>
          ${this.githubLoggedIn ? html`
            <button class="logout-btn" @click=${this.handleLogout}>Logout</button>
          ` : ''}
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
