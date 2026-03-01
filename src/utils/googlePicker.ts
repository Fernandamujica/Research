declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

const SCOPES = 'https://www.googleapis.com/auth/drive.readonly';

let gapiLoaded = false;
let tokenClient: any = null;
let accessToken: string | null = null;

function loadGapiClient(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (gapiLoaded) { resolve(); return; }
    if (!window.gapi) { reject(new Error('Google API script not loaded')); return; }
    window.gapi.load('picker', {
      callback: () => { gapiLoaded = true; resolve(); },
      onerror: () => reject(new Error('Failed to load Google Picker API')),
    });
  });
}

function initTokenClient(clientId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      reject(new Error('Google Identity Services not loaded'));
      return;
    }

    if (accessToken) { resolve(accessToken); return; }

    tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: SCOPES,
      callback: (response: any) => {
        if (response.error) {
          reject(new Error(response.error));
          return;
        }
        accessToken = response.access_token;
        resolve(response.access_token);
      },
    });

    tokenClient.requestAccessToken();
  });
}

export interface PickerResult {
  url: string;
  name: string;
  mimeType: string;
}

export async function openGooglePicker(
  clientId: string,
  apiKey: string,
): Promise<PickerResult | null> {
  await loadGapiClient();
  const token = await initTokenClient(clientId);

  return new Promise((resolve) => {
    const docsView = new window.google.picker.DocsView()
      .setIncludeFolders(true)
      .setSelectFolderEnabled(false)
      .setMimeTypes([
        'application/vnd.google-apps.presentation',
        'application/vnd.google-apps.document',
        'application/vnd.google-apps.spreadsheet',
        'application/pdf',
      ].join(','));

    const picker = new window.google.picker.PickerBuilder()
      .addView(docsView)
      .addView(new window.google.picker.DocsView().setIncludeFolders(true).setSelectFolderEnabled(false))
      .setOAuthToken(token)
      .setDeveloperKey(apiKey)
      .setCallback((data: any) => {
        if (data.action === window.google.picker.Action.PICKED) {
          const doc = data.docs[0];
          resolve({
            url: doc.url,
            name: doc.name,
            mimeType: doc.mimeType,
          });
        } else if (data.action === window.google.picker.Action.CANCEL) {
          resolve(null);
        }
      })
      .setTitle('Select a presentation or document')
      .build();

    picker.setVisible(true);
  });
}

export function isGooglePickerConfigured(clientId?: string, apiKey?: string): boolean {
  return !!(clientId?.trim() && apiKey?.trim());
}
