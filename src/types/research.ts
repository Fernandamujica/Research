export type Country = 'brasil' | 'mexico' | 'usa' | 'colombia' | 'global';

export type Squad =
  | 'money-in'
  | 'mb-account-xp'
  | 'payments-assistant'
  | 'troy'
  | 'tout'
  | 'cross-gba'
  | 'payments-core-infra'
  | 'external'
  | 'other';

export const SQUAD_LABELS: Record<Squad, string> = {
  'money-in': 'Money In',
  'mb-account-xp': 'MB & Account XP',
  'payments-assistant': 'Payments Assistant',
  'troy': 'Troy (GBA Factory)',
  'tout': 'TOUT',
  'cross-gba': 'Cross GBA',
  'payments-core-infra': 'Payments & Core Infra',
  'external': 'External',
  'other': 'Other',
};

export const SQUAD_COLORS: Record<Squad, { bg: string; text: string; border: string }> = {
  'money-in':           { bg: '#FFF3E0', text: '#C45100', border: '#FFCC80' },
  'mb-account-xp':      { bg: '#FFFBEA', text: '#92610A', border: '#FCD44F' },
  'payments-assistant': { bg: '#ECFDF5', text: '#166534', border: '#86EFAC' },
  'troy':               { bg: '#EFF6FF', text: '#1D4ED8', border: '#93C5FD' },
  'tout':               { bg: '#F5F3FF', text: '#5B21B6', border: '#C4B5FD' },
  'cross-gba':          { bg: '#FDF2F8', text: '#9D174D', border: '#F9A8D4' },
  'payments-core-infra':{ bg: '#ECFEFF', text: '#155E75', border: '#67E8F9' },
  'external':           { bg: '#F0FDF4', text: '#15803D', border: '#86EFAC' },
  'other':              { bg: '#F9FAFB', text: '#6B7280', border: '#D1D5DB' },
};

export const RESEARCHERS = [
  'Anita',
  'Alan Paschoal',
  'Daniel Kaihara',
  'Deleu',
  'Erika Martinez',
  'Fernanda Mujica',
  'Matheus Rahme',
  'Miriam Matus',
  'Yas',
] as const;

export type Researcher = (typeof RESEARCHERS)[number];

export interface UsefulLink {
  name: string;
  url: string;
}

export interface Research {
  id: string;
  title: string;
  description: string;
  date: string;
  country: Country;
  squad?: Squad;
  researcher?: string;
  methodology: string;
  team: string[];
  tags: string[];
  keyLearnings: string[];
  presentationUrl?: string;
  pptFile?: { name: string; size: number; url?: string };
  planFile?: { name: string; size: number; url?: string };
  pptScreenshots?: string[];
  usefulLinks?: UsefulLink[];
  createdAt: string;
}

export const COUNTRY_LABELS: Record<Country, string> = {
  brasil: 'Brazil',
  mexico: 'Mexico',
  usa: 'USA',
  colombia: 'Colombia',
  global: 'Global',
};

export const COUNTRY_EMOJI: Record<Country, string> = {
  brasil: '🇧🇷',
  mexico: '🇲🇽',
  usa: '🇺🇸',
  colombia: '🇨🇴',
  global: '🌎',
};
