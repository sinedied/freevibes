export interface DashboardData {
  settings: {
    columns: number;
    darkMode: boolean;
  };
  widgets: Widget[];
}

export interface Widget {
  id: string;
  type: 'rss' | 'note';
  title: string;
  position: {
    row: number;
    col: number;
  };
}

export interface RSSWidget extends Widget {
  type: 'rss';
  feedUrl: string;
}

export interface NoteWidget extends Widget {
  type: 'note';
  content: string;
  color: 'yellow' | 'green' | 'blue' | 'red';
}

export interface RSSItem {
  title: string;
  link: string;
  pubDate: string;
  description?: string;
}

import { githubGistService } from './github-gist.js';

class DataService {
  private dashboardData: DashboardData | undefined = undefined;
  private localStorageKey = 'freevibes-data';
  private isUsingGistStorage = false;

  async loginWithGithubToken(githubToken: string) {
    await githubGistService.login(githubToken);
    this.isUsingGistStorage = true;
    this.dashboardData = await githubGistService.loadData();
    if (this.dashboardData) {
      this.saveToLocalStorage(this.dashboardData);
    }
  }

  logout() {
    githubGistService.logout();
    this.isUsingGistStorage = false;
  }

  async loadData(): Promise<DashboardData> {
    if (this.isUsingGistStorage) {
      try {
        this.dashboardData = await githubGistService.loadData();
        if (this.dashboardData) {
          this.saveToLocalStorage(this.dashboardData);
          return this.dashboardData;
        }
      } catch (error) {
        console.warn('Failed to load from gist, falling back to local/data.json', error);
      }
    }
    
    const localStorageData = localStorage.getItem(this.localStorageKey);
    if (localStorageData) {
      try {
        this.dashboardData = JSON.parse(localStorageData);
        if (this.dashboardData) {
          return this.dashboardData;
        }
      } catch (error) {
        console.warn('Failed to parse local data, falling back to default data');
      }
    }
    
    try {
      const response = await fetch('./data.json');
      this.dashboardData = await response.json();
      if (this.dashboardData) {
        return this.dashboardData;
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
    
    this.dashboardData = {
      settings: { columns: 3, darkMode: false },
      widgets: []
    };
    return this.dashboardData;
  }

  async saveData(dashboardData: DashboardData): Promise<void> {
    this.dashboardData = dashboardData;
    this.saveToLocalStorage(dashboardData);
    if (this.isUsingGistStorage) {
      try {
        await githubGistService.saveData(dashboardData);
      } catch (error) {
        console.warn('Failed to save to gist, keeping local only', error);
      }
    }
  }

  private saveToLocalStorage(dashboardData: DashboardData) {
    localStorage.setItem(this.localStorageKey, JSON.stringify(dashboardData));
  }

  getData(): DashboardData | undefined {
    return this.dashboardData;
  }

  async updateWidget(updatedWidget: Widget): Promise<void> {
    if (!this.dashboardData) return;
    const widgetIndex = this.dashboardData.widgets.findIndex(widget => widget.id === updatedWidget.id);
    if (widgetIndex !== -1) {
      this.dashboardData.widgets[widgetIndex] = updatedWidget;
      await this.saveData(this.dashboardData);
    }
  }

  async updateSettings(settingsUpdate: Partial<DashboardData['settings']>): Promise<void> {
    if (!this.dashboardData) return;
    this.dashboardData.settings = { ...this.dashboardData.settings, ...settingsUpdate };
    await this.saveData(this.dashboardData);
  }

  isGistEnabled() {
    return this.isUsingGistStorage;
  }
}

export const dataService = new DataService();
