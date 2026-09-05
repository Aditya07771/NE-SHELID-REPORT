'use client';

import React, { useState } from 'react';
import { Check, Languages } from 'lucide-react';
import { locales, localeMeta, type Locale } from '@/i18n/config';
import { useI18n } from '@/i18n/LanguageProvider';

export const LanguageSwitcher: React.FC = () => {
  const { locale, setLocale, t } = useI18n();
  const [open, setOpen] = useState(false);

  const choose = (next: Locale) => {
    setLocale(next);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t('header.languageAria')}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center justify-center w-8 h-8 rounded-full bg-white border border-[#E5EDE8] text-gray-600 hover:text-emerald-800 hover:border-emerald-300 hover:bg-emerald-50 transition-all"
      >
        <Languages className="w-4 h-4" />
      </button>

      {open && (
        <>
          {/* Invisible backdrop to close on outside tap */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            role="menu"
            className="absolute right-0 top-full mt-2 z-50 w-44 bg-white border border-[#E5EDE8] rounded-2xl shadow-lg overflow-hidden py-1.5"
          >
            <p className="px-3.5 pt-1.5 pb-1 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
              {t('header.languageName')}
            </p>
            {locales.map((code) => (
              <button
                key={code}
                type="button"
                role="menuitemradio"
                aria-checked={code === locale}
                onClick={() => choose(code)}
                className={`w-full flex items-center justify-between px-3.5 py-2 text-left text-xs font-semibold transition-colors ${
                  code === locale
                    ? 'bg-[#F0FDF4] text-emerald-800'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span>{localeMeta[code].nativeName}</span>
                {code === locale && <Check className="w-3.5 h-3.5 text-emerald-700" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
