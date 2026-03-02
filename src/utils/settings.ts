import { db, firebaseEnabled } from '../lib/firebase';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';

export interface AppSettings {
  squads: string[];
  countries: { name: string; flag: string }[];
  researchers: string[];
  methodologies: string[];
  geminiApiKey?: string;
  googleClientId?: string;
  googlePickerApiKey?: string;
}

export const DEFAULT_SQUADS = [
  'Money In',
  'MB & Account XP',
  'Payments Assistant',
  'Troy',
  'TOUT',
  'Cross GBA',
  'Payments & Core Infra',
  'External',
  'Other',
];

export const DEFAULT_RESEARCHERS = [
  'Anita',
  'Alan Paschoal',
  'Daniel Kaihara',
  'Deleu',
  'Erika Martinez',
  'Fernanda Mujica',
  'Matheus Rahme',
  'Miriam Matus',
  'Yas',
];

export const DEFAULT_COUNTRIES: { name: string; flag: string }[] = [
  { name: 'Brazil', flag: '🇧🇷' },
  { name: 'Mexico', flag: '🇲🇽' },
  { name: 'USA', flag: '🇺🇸' },
  { name: 'Colombia', flag: '🇨🇴' },
  { name: 'Global', flag: '🌎' },
];

export const DEFAULT_METHODOLOGIES = [
  'Usability Testing',
  'User Interview',
  'Survey',
  'Card Sorting',
  'A/B Testing',
  'Diary Study',
  'Heuristic Evaluation',
  'Focus Group',
  'Contextual Inquiry',
  'Tree Testing',
];

const LS_KEY = 'research-hub-settings';

function getDefaults(): AppSettings {
  return {
    squads: [...DEFAULT_SQUADS],
    countries: [...DEFAULT_COUNTRIES],
    researchers: [...DEFAULT_RESEARCHERS],
    methodologies: [...DEFAULT_METHODOLOGIES],
  };
}

let cachedSettings: AppSettings | null = null;

export function getSettings(): AppSettings {
  if (cachedSettings) return cachedSettings;
  const raw = localStorage.getItem(LS_KEY);
  if (raw) {
    try { return JSON.parse(raw); } catch { /* fall through */ }
  }
  return getDefaults();
}

export async function saveSettings(settings: AppSettings) {
  cachedSettings = settings;
  localStorage.setItem(LS_KEY, JSON.stringify(settings));

  if (firebaseEnabled && db) {
    const ref = doc(db, 'settings', 'global');
    await setDoc(ref, settings);
  }
}

export function subscribeSettings(callback: (s: AppSettings) => void): (() => void) | null {
  if (!firebaseEnabled || !db) return null;

  const ref = doc(db, 'settings', 'global');
  return onSnapshot(ref, (snap) => {
    if (snap.exists()) {
      const data = snap.data() as AppSettings;
      cachedSettings = data;
      localStorage.setItem(LS_KEY, JSON.stringify(data));
      callback(data);
    }
  });
}

export function getSquads(): string[] {
  return getSettings().squads;
}

export function getGbaSquads(): string[] {
  return getSquads().filter((s) => s !== 'External' && s !== 'Other');
}

export function getExternalSquads(): string[] {
  return getSquads().filter((s) => s === 'External' || s === 'Other');
}

export function getCountries(): { name: string; flag: string }[] {
  return getSettings().countries;
}

export function getCountryNames(): string[] {
  return getCountries().map((c) => c.name);
}

export function getCountryFlags(): Record<string, string> {
  const flags: Record<string, string> = {};
  getCountries().forEach((c) => { flags[c.name] = c.flag; });
  return flags;
}

export function getResearchers(): string[] {
  return getSettings().researchers;
}

export function getMethodologies(): string[] {
  return getSettings().methodologies;
}

const DEFAULT_GEMINI_KEY = 'AIzaSyB25CB-XA6EZ8PyvpmzHqHdeoid1LRm3i0';

export function getGeminiApiKey(): string {
  return getSettings().geminiApiKey?.trim() || DEFAULT_GEMINI_KEY;
}

export function getGooglePickerConfig(): { clientId: string; apiKey: string } | null {
  const s = getSettings();
  if (s.googleClientId?.trim() && s.googlePickerApiKey?.trim()) {
    return { clientId: s.googleClientId.trim(), apiKey: s.googlePickerApiKey.trim() };
  }
  return null;
}
