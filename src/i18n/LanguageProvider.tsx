'use client';

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  codeLabel,
  defaultLocale,
  dictionaries,
  guessLocale,
  hazardCodeMap,
  isLocale,
  localeMeta,
  severityCodeMap,
  statusCodeMap,
  STORAGE_KEY,
  translate,
  type Locale,
  type TKey,
} from './config';

export interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  /** Translate a key with optional {param} interpolation. Falls back to English. */
  t: (key: TKey, params?: Record<string, string | number>) => string;
  /** Translated label for a hazard category code (e.g. "LANDSLIDE"). */
  hazardName: (code: string) => string;
  /** Translated label for a severity code (e.g. "HIGH"). */
  severityName: (code: string) => string;
  /** Translated label for a report status code (e.g. "UNDER_REVIEW"). */
  statusName: (code: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  // SSR-safe: always start on the default locale, then hydrate from storage/browser.
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  // On mount: honor a previously saved choice, otherwise auto-detect from the browser.
  useEffect(() => {
    let detected: Locale | null = null;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored && isLocale(stored)) {
        detected = stored;
      }
    } catch (e) {
      console.warn('[I18n] Could not read stored locale:', e);
    }
    if (!detected) {
      detected = guessLocale(
        typeof navigator !== 'undefined' && navigator.languages ? navigator.languages : []
      );
    }
    setLocaleState(detected);
  }, []);

  // Persist the choice and keep <html lang> in sync (PWA + accessibility).
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, locale);
    } catch (e) {
      console.warn('[I18n] Could not persist locale:', e);
    }
    document.documentElement.lang = locale;
    document.documentElement.setAttribute('data-locale', locale);
  }, [locale]);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
  }, []);

  const value = useMemo<I18nContextValue>(() => {
    const dict = dictionaries[locale];
    return {
      locale,
      setLocale,
      t: (key, params) => translate(dict, key, params),
      hazardName: (code: string) => codeLabel(dict, hazardCodeMap, code),
      severityName: (code: string) => codeLabel(dict, severityCodeMap, code),
      statusName: (code: string) => codeLabel(dict, statusCodeMap, code),
    };
  }, [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used inside <LanguageProvider>');
  }
  return ctx;
}

export { localeMeta };
