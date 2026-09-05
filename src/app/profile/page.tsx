'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getDemoSession, clearDemoSession, DemoSession } from '@/lib/auth';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { syncManager } from '@/lib/sync';
import { getPendingOfflineReports } from '@/lib/db';
import { useI18n } from '@/i18n/LanguageProvider';
import { locales, localeMeta } from '@/i18n/config';

export default function ProfilePage() {
  const router = useRouter();
  const [session, setSession] = useState<DemoSession | null>(null);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string>('');
  const isOnline = useOnlineStatus();
  const { t, locale, setLocale } = useI18n();

  useEffect(() => {
    const s = getDemoSession();
    if (!s) {
      router.push('/login');
      return;
    }
    setSession(s);
    checkPending();
  }, [router]);

  const checkPending = async () => {
    try {
      const pending = await getPendingOfflineReports();
      setPendingCount(pending.length);
    } catch (e) {
      console.warn('[Profile] Check pending error:', e);
    }
  };

  const handleManualSync = async () => {
    if (!isOnline) {
      setSyncMessage(t('profile.offlineMsg'));
      return;
    }
    setSyncing(true);
    setSyncMessage('');

    try {
      const result = await syncManager.syncAllPending();
      const failures = result.failed > 0 ? ` ${t('profile.syncFailures', { count: result.failed })}` : '';
      setSyncMessage(`${t('profile.syncSuccess', { count: result.synced })}${failures}`);
      await checkPending();
    } catch (e: any) {
      setSyncMessage(t('profile.syncError', { message: e?.message || 'Network error' }));
    } finally {
      setSyncing(false);
    }
  };

  const handleLogout = () => {
    clearDemoSession();
    router.push('/login');
  };

  return (
    <div className="space-y-5 pb-6">
      {/* Top Profile Header */}
      <div className="bg-white border border-[#E5EDE8] rounded-3xl p-5 shadow-xs flex items-center gap-4">
        <div className="w-14 h-14 bg-emerald-800 text-white rounded-2xl flex items-center justify-center font-bold text-2xl shadow-sm shrink-0">
          🛡️
        </div>
        <div className="space-y-0.5">
          <span className="text-[10px] font-bold text-emerald-800 bg-[#F0FDF4] border border-[#DCFCE7] px-2 py-0.5 rounded-md uppercase tracking-wider">
            {t('profile.verifiedReporter')}
          </span>
          <h2 className="text-base font-bold text-gray-900 font-mono">{session?.phone || t('common.demoUser')}</h2>
          <p className="text-xs text-gray-400">{t('profile.fieldNetwork')}</p>
        </div>
      </div>

      {/* Language Settings Card */}
      <div className="bg-white border border-[#E5EDE8] rounded-3xl p-5 shadow-xs space-y-3">
        <div>
          <h3 className="text-sm font-bold text-gray-900">{t('profile.languageTitle')}</h3>
          <p className="text-xs text-gray-500 mt-1">{t('profile.languageSub')}</p>
        </div>
        <div className="grid grid-cols-1 gap-2">
          {locales.map((code) => (
            <button
              key={code}
              type="button"
              onClick={() => setLocale(code)}
              className={`flex items-center justify-between px-4 py-3 rounded-xl border text-xs font-bold transition-all ${
                locale === code
                  ? 'bg-[#F0FDF4] border-emerald-700 text-emerald-800 ring-1 ring-emerald-700/20'
                  : 'bg-white border-[#E5EDE8] text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span>{localeMeta[code].nativeName}</span>
              {locale === code && <span className="text-emerald-700 text-sm">✓</span>}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-gray-400">{t('profile.autoDetect')}</p>
      </div>

      {/* Offline Sync Card */}
      <div className="bg-white border border-[#E5EDE8] rounded-3xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900">{t('profile.offlineQueueTitle')}</h3>
            <p className="text-xs text-gray-500">{t('profile.offlineQueueSub')}</p>
          </div>
          <span
            className={`text-xs font-bold font-mono px-3 py-1 rounded-full border ${
              pendingCount > 0
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            {t('profile.pendingCount', { count: pendingCount })}
          </span>
        </div>

        {syncMessage && (
          <div className="p-3 bg-[#F0FDF4] border border-[#DCFCE7] text-emerald-900 text-xs rounded-xl font-medium">
            {syncMessage}
          </div>
        )}

        <button
          onClick={handleManualSync}
          disabled={syncing || pendingCount === 0 || !isOnline}
          className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 ${
            pendingCount === 0 || !isOnline
              ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
              : 'bg-emerald-800 hover:bg-emerald-700 text-white'
          }`}
        >
          {syncing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {t('profile.syncing')}
            </>
          ) : (
            t('profile.syncNow', { count: pendingCount })
          )}
        </button>
      </div>

      {/* App & System Status */}
      <div className="bg-white border border-[#E5EDE8] rounded-3xl p-5 shadow-xs space-y-3 text-xs">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">{t('profile.systemHealth')}</h3>

        <div className="space-y-2 font-mono">
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500">{t('profile.internetConnectivity')}</span>
            <span className={isOnline ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
              {isOnline ? t('common.online') : t('common.offline')}
            </span>
          </div>

          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500">{t('profile.gpsAccuracy')}</span>
            <span className="text-emerald-800 font-bold">{t('profile.highPrecision')}</span>
          </div>

          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500">{t('profile.storageEngine')}</span>
            <span className="text-gray-800">{t('profile.storageValue')}</span>
          </div>

          <div className="flex justify-between py-1.5 text-[11px] text-gray-400">
            <span>{t('profile.appVersion')}</span>
            <span>{t('profile.appVersionValue')}</span>
          </div>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold py-3.5 rounded-2xl text-xs transition-colors shadow-xs"
      >
        {t('profile.logout')}
      </button>
    </div>
  );
}
