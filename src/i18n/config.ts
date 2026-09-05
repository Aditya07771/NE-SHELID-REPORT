import { en } from './dictionaries/en';
import { hi } from './dictionaries/hi';
import { as } from './dictionaries/as';
import { bn } from './dictionaries/bn';

export const locales = ['en', 'hi', 'as', 'bn'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';
export const STORAGE_KEY = 'neshield.locale';

export const localeMeta: Record<Locale, { name: string; nativeName: string; intl: string }> = {
  en: { name: 'English', nativeName: 'English', intl: 'en' },
  hi: { name: 'Hindi', nativeName: 'हिन्दी', intl: 'hi' },
  as: { name: 'Assamese', nativeName: 'অসমীয়া', intl: 'as' },
  bn: { name: 'Bengali', nativeName: 'বাংলা', intl: 'bn' },
};

export type Dictionary = typeof en;
export type TKey = keyof Dictionary;

export const dictionaries: Record<Locale, Dictionary> = { en, hi, as, bn };

export function isLocale(value: unknown): value is Locale {
  return typeof value === 'string' && (locales as readonly string[]).includes(value);
}

/**
 * Guess a non-English locale from the browser's preferred languages
 * (e.g. "hi-IN" -> "hi"). Falls back to the default locale (English).
 */
export function guessLocale(preferred: readonly string[] = []): Locale {
  for (const tag of preferred) {
    const base = tag.toLowerCase().split('-')[0];
    if (base !== 'en' && isLocale(base)) return base;
  }
  return defaultLocale;
}

/** Resolve a dictionary value, falling back to the English dictionary when a key is missing. */
export function translate(dict: Dictionary, key: TKey, params?: Record<string, string | number>): string {
  let value: string | undefined = dict[key];
  if (value === undefined) value = en[key];
  if (value === undefined) return String(key);

  if (params) {
    value = value.replace(/\{(\w+)\}/g, (match, name: string) => {
      const replacement = params[name];
      return replacement === undefined ? match : String(replacement);
    });
  }
  return value;
}

/** Human readable, translated label for hazard category codes stored in the DB. */
export const hazardCodeMap: Record<string, TKey> = {
  LANDSLIDE: 'hz.landslide',
  VISIBLE_CRACK: 'hz.visibleCrack',
  ROAD_BLOCKAGE: 'hz.roadBlockage',
  ROCKFALL: 'hz.rockfall',
  FLOODING: 'hz.flooding',
  OTHER_HAZARD: 'hz.otherHazard',
};

/** Human readable, translated label for severity codes stored in the DB. */
export const severityCodeMap: Record<string, TKey> = {
  LOW: 'sev.low',
  MEDIUM: 'sev.medium',
  HIGH: 'sev.high',
  CRITICAL: 'sev.critical',
};

/** Human readable, translated label for report status codes stored in the DB. */
export const statusCodeMap: Record<string, TKey> = {
  RECEIVED: 'st.received',
  UNDER_REVIEW: 'st.underReview',
  VALIDATED: 'st.validated',
  IN_PROGRESS: 'st.inProgress',
  RESOLVED: 'st.resolved',
  REJECTED: 'st.rejected',
  'PENDING SYNC': 'st.pendingSync',
  SYNCED: 'st.synced',
};

export function codeLabel(
  dict: Dictionary,
  map: Record<string, TKey>,
  code: string
): string {
  const key = map[code] || map[code.toUpperCase()];
  if (!key) return code.replace(/_/g, ' ');
  return translate(dict, key);
}
