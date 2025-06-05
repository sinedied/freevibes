export interface GistFile {
  filename: string;
  content: string;
}

const GIST_FILENAME = 'freevibes.json';
const GIST_DESC = 'FreeVibes dashboard data';
const GITHUB_API = 'https://api.github.com';

class GithubGistService {
  private token: string | null = null;
  private gistId: string | null = null;
  private storageKey = 'freevibes-github-pat';

  constructor() {
    // Try to load token from localStorage
    const stored = localStorage.getItem(this.storageKey);
    if (stored) {
      this.token = stored;
    }
  }

  async login(token: string) {
    this.token = token;
    localStorage.setItem(this.storageKey, token);
    // Only set gistId if found, do not create a new gist here
    this.gistId = await this.findGistId();
    // If not found, will be created on first save
  }

  // Find gist by filename, do not create
  private async findGistId(): Promise<string | null> {
    if (!this.token) throw new Error('No GitHub token');
    let page = 1;
    let gist = null;
    while (true) {
      const gists = await this.api(`/gists?per_page=100&page=${page}`);
      gist = gists.find((g: any) => g.files && g.files[GIST_FILENAME]);
      if (gist || gists.length < 100) break;
      page++;
    }
    return gist ? gist.id : null;
  }

  // Only create gist if needed (on save)
  private async findOrCreateGist(): Promise<string> {
    let gistId = await this.findGistId();
    if (gistId) return gistId;
    // Create new gist with example data
    const exampleData = {
      settings: { columns: 3, darkMode: false },
      widgets: [
        {
          id: 'rss-1',
          type: 'rss',
          title: 'Hacker News',
          feedUrl: 'https://hnrss.org/frontpage',
          position: { row: 1000, col: 1 }
        },
        {
          id: 'rss-2',
          type: 'rss',
          title: 'Gameblog',
          feedUrl: 'https://www.gameblog.fr/rssmap/rss_all.xml',
          position: { row: 2000, col: 1 }
        },
        {
          id: 'note-1',
          type: 'note',
          title: 'Welcome Note',
          content: 'Welcome to FreeVibes!\n\n- You can edit this note.\n- Add your own RSS feeds and notes.\n- Click links to open them in a new tab.\n\nExample: https://github.com/',
          color: 'yellow',
          position: { row: 1000, col: 2 }
        }
      ]
    };
    const res = await this.api('/gists', 'POST', {
      description: GIST_DESC,
      public: false,
      files: {
        [GIST_FILENAME]: { content: JSON.stringify(exampleData, null, 2) }
      }
    });
    return res.id;
  }

  async loadData(): Promise<any> {
    // Always try to find the gistId if not set
    if (!this.gistId) {
      this.gistId = await this.findGistId();
    }
    if (!this.gistId) throw new Error('No gist found for FreeVibes');
    const gist = await this.api(`/gists/${this.gistId}`);
    const file = gist.files[GIST_FILENAME];
    return JSON.parse(file.content);
  }

  async saveData(data: any): Promise<void> {
    // If gist does not exist, create it first
    if (!this.gistId) {
      this.gistId = await this.findOrCreateGist();
    }
    await this.api(`/gists/${this.gistId}`, 'PATCH', {
      files: {
        [GIST_FILENAME]: { content: JSON.stringify(data, null, 2) }
      }
    });
  }

  private async api(path: string, method = 'GET', body?: any) {
    if (!this.token) throw new Error('No GitHub token');
    const res = await fetch(`${GITHUB_API}${path}`, {
      method,
      headers: {
        'Authorization': `token ${this.token}`,
        'Accept': 'application/vnd.github+json',
        'Content-Type': 'application/json'
      },
      body: body ? JSON.stringify(body) : undefined
    });
    if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
    return res.json();
  }
}

export const githubGistService = new GithubGistService();
