import { getSettings } from './settings';

const TOKEN_KEY = 'gba-google-access-token';
const TOKEN_EXPIRY_KEY = 'gba-google-token-expiry';
const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';

export function getStoredToken(): string | null {
  const token = sessionStorage.getItem(TOKEN_KEY);
  const expiry = sessionStorage.getItem(TOKEN_EXPIRY_KEY);
  if (token && expiry && Date.now() < Number(expiry)) return token;
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(TOKEN_EXPIRY_KEY);
  return null;
}

function storeToken(token: string) {
  sessionStorage.setItem(TOKEN_KEY, token);
  sessionStorage.setItem(TOKEN_EXPIRY_KEY, String(Date.now() + 55 * 60 * 1000));
}

export function getGoogleClientId(): string {
  return getSettings().googleClientId?.trim() ?? '';
}

export function isGoogleLink(url: string): boolean {
  return /docs\.google\.com\/(document|presentation|spreadsheets)\/d\//.test(url);
}

export function requestGoogleToken(): Promise<string> {
  return new Promise((resolve, reject) => {
    const clientId = getGoogleClientId();
    if (!clientId) {
      reject(new Error('No Google OAuth Client ID configured. Go to Settings to add it.'));
      return;
    }

    if (!window.google?.accounts?.oauth2) {
      reject(new Error('Google Identity Services not loaded. Please refresh the page.'));
      return;
    }

    const existing = getStoredToken();
    if (existing) {
      resolve(existing);
      return;
    }

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: (resp: { access_token?: string; error?: string }) => {
        if (resp.error) {
          reject(new Error(`Google auth error: ${resp.error}`));
          return;
        }
        if (resp.access_token) {
          storeToken(resp.access_token);
          resolve(resp.access_token);
        } else {
          reject(new Error('No access token received.'));
        }
      },
    });

    client.requestAccessToken();
  });
}

function extractDocId(url: string): string | null {
  const m = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
  return m ? m[1] : null;
}

async function fetchGoogleDocText(docId: string, token: string): Promise<string> {
  const res = await fetch(
    `https://docs.googleapis.com/v1/documents/${docId}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) throw new Error(`Google Docs API error ${res.status}`);
  const doc = await res.json();
  return extractTextFromDocBody(doc.body?.content ?? []);
}

function extractTextFromDocBody(content: Array<Record<string, unknown>>): string {
  const parts: string[] = [];
  for (const el of content) {
    const paragraph = el.paragraph as { elements?: Array<{ textRun?: { content?: string } }> } | undefined;
    if (paragraph?.elements) {
      for (const e of paragraph.elements) {
        if (e.textRun?.content) parts.push(e.textRun.content);
      }
    }
    const table = el.table as { tableRows?: Array<{ tableCells?: Array<{ content?: Array<Record<string, unknown>> }> }> } | undefined;
    if (table?.tableRows) {
      for (const row of table.tableRows) {
        if (row.tableCells) {
          for (const cell of row.tableCells) {
            if (cell.content) parts.push(extractTextFromDocBody(cell.content));
          }
          parts.push('\n');
        }
      }
    }
  }
  return parts.join('');
}

async function fetchGoogleSlidesText(presentationId: string, token: string): Promise<string> {
  const res = await fetch(
    `https://slides.googleapis.com/v1/presentations/${presentationId}`,
    { headers: { Authorization: `Bearer ${token}` } },
  );
  if (!res.ok) throw new Error(`Google Slides API error ${res.status}`);
  const pres = await res.json();
  const parts: string[] = [];

  for (const slide of pres.slides ?? []) {
    for (const el of slide.pageElements ?? []) {
      const shape = el.shape as { text?: { textElements?: Array<{ textRun?: { content?: string } }> } } | undefined;
      if (shape?.text?.textElements) {
        for (const te of shape.text.textElements) {
          if (te.textRun?.content) parts.push(te.textRun.content);
        }
      }
      const table = el.table as { tableRows?: Array<{ tableCells?: Array<{ text?: { textElements?: Array<{ textRun?: { content?: string } }> } }> }> } | undefined;
      if (table?.tableRows) {
        for (const row of table.tableRows) {
          for (const cell of row.tableCells ?? []) {
            for (const te of cell.text?.textElements ?? []) {
              if (te.textRun?.content) parts.push(te.textRun.content);
            }
          }
        }
      }
    }
    parts.push('\n---\n');
  }

  return parts.join('');
}

export async function fetchGoogleDocContent(url: string, token: string): Promise<string> {
  const docId = extractDocId(url);
  if (!docId) throw new Error('Could not extract document ID from the URL.');

  if (/\/presentation\//.test(url)) {
    return fetchGoogleSlidesText(docId, token);
  }
  return fetchGoogleDocText(docId, token);
}
