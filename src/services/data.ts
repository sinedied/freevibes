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
  private data: DashboardData | null = null;
  private storageKey = 'freevibes-data';
  private useGist = false;

  async loginWithGithubToken(token: string) {
    await githubGistService.login(token);
    this.useGist = true;
    this.data = await githubGistService.loadData();
    this.saveLocal(this.data); // keep local backup
  }

  async loadData(): Promise<DashboardData> {
    if (this.useGist) {
      try {
        this.data = await githubGistService.loadData();
        this.saveLocal(this.data);
        return this.data!;
      } catch (error) {
        console.warn('Failed to load from gist, falling back to local/data.json', error);
      }
    }
    // Try to load from localStorage first
    const localData = localStorage.getItem(this.storageKey);
    if (localData) {
      try {
        this.data = JSON.parse(localData);
        return this.data!;
      } catch (error) {
        console.warn('Failed to parse local data, falling back to default data');
      }
    }
    // Fall back to loading from data.json
    try {
      const response = await fetch('./data.json');
      this.data = await response.json();
      return this.data!;
    } catch (error) {
      console.error('Failed to load data:', error);
      // Return default data if everything fails
      this.data = {
        settings: { columns: 3, darkMode: false },
        widgets: []
      };
      return this.data;
    }
  }

  async saveData(data: DashboardData): Promise<void> {
    this.data = data;
    this.saveLocal(data);
    if (this.useGist) {
      try {
        await githubGistService.saveData(data);
      } catch (error) {
        console.warn('Failed to save to gist, keeping local only', error);
      }
    }
  }

  private saveLocal(data: DashboardData) {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  getData(): DashboardData | null {
    return this.data;
  }

  async updateWidget(updatedWidget: Widget): Promise<void> {
    if (!this.data) return;
    const index = this.data.widgets.findIndex(w => w.id === updatedWidget.id);
    if (index !== -1) {
      this.data.widgets[index] = updatedWidget;
      await this.saveData(this.data);
    }
  }

  async updateSettings(settings: Partial<DashboardData['settings']>): Promise<void> {
    if (!this.data) return;
    this.data.settings = { ...this.data.settings, ...settings };
    await this.saveData(this.data);
  }

  isGistEnabled() {
    return this.useGist;
  }
}

export const dataService = new DataService();
