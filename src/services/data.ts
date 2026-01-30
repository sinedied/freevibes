export interface Tab {
  id: string;
  name: string;
  order: number;
}

export interface DashboardData {
  settings: {
    columns: number;
    darkMode: boolean;
    darkModeType: 'on' | 'off' | 'system';
    mainColor: string;
    backgroundColor: string;
    fontSize: number;
    currentTabId?: string;
  };
  tabs: Tab[];
  widgets: Widget[];
}

export interface Widget {
  id: string;
  type: 'rss' | 'note';
  title: string;
  tabId: string;
  position: {
    column: number;
    order: number;
  };
  height?: number;
  folded?: boolean;
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

  private migrateWidgetData(widgets: any[], tabs: Tab[]): Widget[] {
    const defaultTabId = tabs.length > 0 ? tabs[0].id : crypto.randomUUID();
    return widgets.map((widget, index) => {
      if (widget.position && 'row' in widget.position && 'col' in widget.position) {
        const { row, col } = widget.position;
        return {
          ...widget,
          tabId: widget.tabId || defaultTabId,
          position: {
            column: col,
            order: row * 1000 + index
          },
          height: widget.height || 6
        };
      }
      return {
        ...widget,
        tabId: widget.tabId || defaultTabId,
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
      fontSize: settings.fontSize || 16,
      currentTabId: settings.currentTabId
    };
  }

  private migrateTabs(tabs: any[] | undefined, settings: any): Tab[] {
    if (tabs && tabs.length > 0) {
      return tabs.map(t => ({
        id: t.id,
        name: t.name,
        order: t.order
      }));
    }
    const defaultTab: Tab = {
      id: crypto.randomUUID(),
      name: 'Main',
      order: 1000
    };
    if (!settings.currentTabId) {
      settings.currentTabId = defaultTab.id;
    }
    return [defaultTab];
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
          const settings = this.migrateSettingsData(rawData.settings);
          const tabs = this.migrateTabs(rawData.tabs, settings);
          const migratedData = {
            ...rawData,
            settings,
            tabs,
            widgets: this.migrateWidgetData(rawData.widgets, tabs)
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
          const settings = this.migrateSettingsData(rawData.settings);
          const tabs = this.migrateTabs(rawData.tabs, settings);
          const migratedData = {
            ...rawData,
            settings,
            tabs,
            widgets: this.migrateWidgetData(rawData.widgets, tabs)
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
        const settings = this.migrateSettingsData(rawData.settings);
        const tabs = this.migrateTabs(rawData.tabs, settings);
        const migratedData = {
          ...rawData,
          settings,
          tabs,
          widgets: this.migrateWidgetData(rawData.widgets, tabs)
        };
        this.dashboardData = migratedData;
        return migratedData;
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
    
    const defaultTabId = crypto.randomUUID();
    const defaultData = {
      settings: { 
        columns: 3, 
        darkMode: false,
        darkModeType: 'off' as const,
        mainColor: '#007bff',
        backgroundColor: '#f8f9fa',
        fontSize: 16,
        currentTabId: defaultTabId
      },
      tabs: [{
        id: defaultTabId,
        name: 'Main',
        order: 1000
      }],
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
