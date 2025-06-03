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

class DataService {
  private data: DashboardData | null = null;
  private storageKey = 'freevibes-data';

  async loadData(): Promise<DashboardData> {
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
      const response = await fetch('/data.json');
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

  saveData(data: DashboardData): void {
    this.data = data;
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  getData(): DashboardData | null {
    return this.data;
  }

  updateWidget(updatedWidget: Widget): void {
    if (!this.data) return;
    
    const index = this.data.widgets.findIndex(w => w.id === updatedWidget.id);
    if (index !== -1) {
      this.data.widgets[index] = updatedWidget;
      this.saveData(this.data);
    }
  }

  updateSettings(settings: Partial<DashboardData['settings']>): void {
    if (!this.data) return;
    
    this.data.settings = { ...this.data.settings, ...settings };
    this.saveData(this.data);
  }
}

export const dataService = new DataService();
