export interface GistFile {
  filename: string;
  content: string;
}

const GIST_FILENAME = 'freevibes.json';
const GIST_DESC = 'FreeVibes dashboard data';
const GITHUB_API = 'https://api.github.com';
const STORAGE_KEY = 'freevibes-github-pat';

interface GithubGistState {
  token: string | undefined;
  gistId: string | undefined;
}

const state: GithubGistState = {
  token: localStorage.getItem(STORAGE_KEY) || undefined,
  gistId: undefined
};

async function login(token: string) {
  state.token = token;
  localStorage.setItem(STORAGE_KEY, token);
  state.gistId = await findGistId();
}

function logout() {
  state.token = undefined;
  state.gistId = undefined;
  localStorage.removeItem(STORAGE_KEY);
}

async function findGistId(): Promise<string | undefined> {
  if (!state.token) throw new Error('No GitHub token');
  let page = 1;
  let gist = undefined;
  while (true) {
    const gists = await apiCall(`/gists?per_page=100&page=${page}`);
    gist = gists.find((g: any) => g.files && g.files[GIST_FILENAME]);
    if (gist || gists.length < 100) break;
    page++;
  }
  return gist ? gist.id : undefined;
}

async function findOrCreateGist(): Promise<string> {
  let gistId = await findGistId();
  if (gistId) return gistId;
  
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
        title: 'GitHub Blog',
        feedUrl: 'https://github.blog/feed/',
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
  
  const res = await apiCall('/gists', 'POST', {
    description: GIST_DESC,
    public: false,
    files: {
      [GIST_FILENAME]: { content: JSON.stringify(exampleData, undefined, 2) }
    }
  });
  return res.id;
}

async function loadData(): Promise<any> {
  if (!state.gistId) {
    state.gistId = await findGistId();
  }
  if (!state.gistId) throw new Error('No gist found for FreeVibes');
  const gist = await apiCall(`/gists/${state.gistId}`);
  const file = gist.files[GIST_FILENAME];
  return JSON.parse(file.content);
}

async function saveData(data: any): Promise<void> {
  if (!state.gistId) {
    state.gistId = await findOrCreateGist();
  }
  await apiCall(`/gists/${state.gistId}`, 'PATCH', {
    files: {
      [GIST_FILENAME]: { content: JSON.stringify(data, undefined, 2) }
    }
  });
}

async function apiCall(path: string, method = 'GET', body?: any) {
  if (!state.token) throw new Error('No GitHub token');
  const res = await fetch(`${GITHUB_API}${path}`, {
    method,
    headers: {
      'Authorization': `token ${state.token}`,
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json'
    },
    body: body ? JSON.stringify(body) : undefined
  });
  if (!res.ok) throw new Error(`GitHub API error: ${res.status}`);
  return res.json();
}

function getGistUrl(): string | undefined {
  if (!state.gistId) return undefined;
  return `https://gist.github.com/${state.gistId}`;
}

export const githubGistService = {
  login,
  logout,
  loadData,
  saveData,
  getGistUrl
};