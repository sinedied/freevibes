export interface DashboardData {
  settings: {
    columns: number;
    darkMode: boolean;
    darkModeType: 'on' | 'off' | 'system';
    mainColor: string;
    backgroundColor: string;
    fontSize: number;
  };
  widgets: Widget[];
}

export interface Widget {
  id: string;
  type: 'rss' | 'note';
  title: string;
  position: {
    column: number;
    order: number;
  };
  height?: number; // Height in lines (em units)
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

  private migrateWidgetData(widgets: any[]): Widget[] {
    return widgets.map((widget, index) => {
      // If widget has old position format (row, col), migrate to new format
      if (widget.position && 'row' in widget.position && 'col' in widget.position) {
        const { row, col } = widget.position;
        return {
          ...widget,
          position: {
            column: col,
            order: row * 1000 + index // Convert row-based order to column order
          },
          height: widget.height || 6 // Default height of 6 lines
        };
      }
      // Ensure height is set for new widgets
      return {
        ...widget,
        height: widget.height || 6
      };
    });
  }

  private migrateSettingsData(settings: any): DashboardData['settings'] {
    return {
      columns: settings.columns || 3,
      darkMode: settings.darkMode || false,
      darkModeType: settings.darkModeType || (settings.darkMode ? 'on' : 'off'),
      mainColor: settings.mainColor || '#007bff',
      backgroundColor: settings.backgroundColor || '#f8f9fa', 
      fontSize: settings.fontSize || 16
    };
  }

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
    let rawData: any;

    if (this.isUsingGistStorage) {
      try {
        rawData = await githubGistService.loadData();
        if (rawData) {
          const migratedData = {
            ...rawData,
            settings: this.migrateSettingsData(rawData.settings),
            widgets: this.migrateWidgetData(rawData.widgets)
          };
          this.dashboardData = migratedData;
          this.saveToLocalStorage(migratedData);
          return migratedData;
        }
      } catch (error) {
        console.warn('Failed to load from gist, falling back to local/data.json', error);
      }
    }
    
    const localStorageData = localStorage.getItem(this.localStorageKey);
    if (localStorageData) {
      try {
        rawData = JSON.parse(localStorageData);
        if (rawData) {
          const migratedData = {
            ...rawData,
            settings: this.migrateSettingsData(rawData.settings),
            widgets: this.migrateWidgetData(rawData.widgets)
          };
          this.dashboardData = migratedData;
          return migratedData;
        }
      } catch (error) {
        console.warn('Failed to parse local data, falling back to default data');
      }
    }
    
    try {
      const response = await fetch('./data.json');
      rawData = await response.json();
      if (rawData) {
        const migratedData = {
          ...rawData,
          settings: this.migrateSettingsData(rawData.settings),
          widgets: this.migrateWidgetData(rawData.widgets)
        };
        this.dashboardData = migratedData;
        return migratedData;
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
    
    // Fallback default data
    const defaultData = {
      settings: { 
        columns: 3, 
        darkMode: false,
        darkModeType: 'off' as const,
        mainColor: '#007bff',
        backgroundColor: '#f8f9fa',
        fontSize: 16
      },
      widgets: []
    };
    this.dashboardData = defaultData;
    return defaultData;
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

  getGistUrl(): string | undefined {
    return githubGistService.getGistUrl();
  }
}

export const dataService = new DataService();
