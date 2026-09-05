'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { saveDemoSession } from '@/lib/auth';
import { useI18n } from '@/i18n/LanguageProvider';

export default function LoginPage() {
  const router = useRouter();
  const { t } = useI18n();
  const [phone, setPhone] = useState('+919876543210');
  const [password, setPassword] = useState('demo1234');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!phone || phone.trim().length < 6) {
      setError(t('login.errPhone'));
      return;
    }
    if (!password) {
      setError(t('login.errPassword'));
      return;
    }

    setLoading(true);

    setTimeout(() => {
      saveDemoSession(phone);
      router.push('/home');
    }, 400);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] py-6 px-2">
      <div className="w-full max-w-sm bg-white border border-[#E5EDE8] rounded-3xl p-6 shadow-xs">
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-800 text-white font-black text-xl shadow-md shadow-emerald-800/20 mb-3">
            <svg className="w-7 h-7 text-emerald-200" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900 tracking-tight">NE-SHIELD CROWD</h2>
          <p className="text-xs text-gray-500 font-medium mt-1">{t('login.tagline')}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <svg className="w-4 h-4 shrink-0 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">{t('login.phoneLabel')}</label>
            <div className="relative">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+919876543210"
                className="w-full bg-white border border-[#E5EDE8] rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 transition-all font-mono"
                required
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">{t('login.phoneHelper')}</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">{t('login.passwordLabel')}</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-white border border-[#E5EDE8] rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-700 focus:ring-2 focus:ring-emerald-700/20 transition-all font-mono"
              required
            />
            <p className="text-[11px] text-gray-400 mt-1">{t('login.passwordHelper')}</p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 bg-emerald-800 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold py-3.5 px-4 rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                {t('login.signingIn')}
              </>
            ) : (
              t('login.cta')
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <p className="text-[11px] text-gray-400 font-medium">
            {t('login.footer')}
          </p>
        </div>
      </div>
    </div>
  );
}
