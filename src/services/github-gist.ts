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

  async login(token: string) {
    this.token = token;
    this.gistId = await this.findOrCreateGist();
  }

  private async findOrCreateGist(): Promise<string> {
    const gists = await this.api('/gists');
    let gist = gists.find((g: any) => g.files[GIST_FILENAME]);
    if (gist) return gist.id;
    // Create new gist if not found
    const res = await this.api('/gists', 'POST', {
      description: GIST_DESC,
      public: false,
      files: {
        [GIST_FILENAME]: { content: '{}' }
      }
    });
    return res.id;
  }

  async loadData(): Promise<any> {
    if (!this.gistId) throw new Error('Not logged in');
    const gist = await this.api(`/gists/${this.gistId}`);
    const file = gist.files[GIST_FILENAME];
    return JSON.parse(file.content);
  }

  async saveData(data: any): Promise<void> {
    if (!this.gistId) throw new Error('Not logged in');
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
