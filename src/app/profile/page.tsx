'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getDemoSession, clearDemoSession, DemoSession } from '@/lib/auth';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { syncManager } from '@/lib/sync';
import { getPendingOfflineReports } from '@/lib/db';

export default function ProfilePage() {
  const router = useRouter();
  const [session, setSession] = useState<DemoSession | null>(null);
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [syncMessage, setSyncMessage] = useState<string>('');
  const isOnline = useOnlineStatus();

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
      setSyncMessage('Device is currently offline. Connect to internet to sync.');
      return;
    }
    setSyncing(true);
    setSyncMessage('');

    try {
      const result = await syncManager.syncAllPending();
      setSyncMessage(`Successfully synced ${result.synced} report(s). ${result.failed > 0 ? `${result.failed} failed.` : ''}`);
      await checkPending();
    } catch (e: any) {
      setSyncMessage(`Sync failed: ${e?.message || 'Network error'}`);
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
            VERIFIED REPORTER
          </span>
          <h2 className="text-base font-bold text-gray-900 font-mono">{session?.phone || '+91 Demo User'}</h2>
          <p className="text-xs text-gray-400">NE-SHIELD Field Crowd Network</p>
        </div>
      </div>

      {/* Offline Sync Card */}
      <div className="bg-white border border-[#E5EDE8] rounded-3xl p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-gray-900">IndexedDB Offline Queue</h3>
            <p className="text-xs text-gray-500">Local pending submissions stored on device</p>
          </div>
          <span
            className={`text-xs font-bold font-mono px-3 py-1 rounded-full border ${
              pendingCount > 0
                ? 'bg-amber-50 text-amber-700 border-amber-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            {pendingCount} Pending
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
              SYNCING WITH MONGODB...
            </>
          ) : (
            `SYNC NOW (${pendingCount} REPORT${pendingCount === 1 ? '' : 'S'})`
          )}
        </button>
      </div>

      {/* App & System Status */}
      <div className="bg-white border border-[#E5EDE8] rounded-3xl p-5 shadow-xs space-y-3 text-xs">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">SYSTEM & DEVICE HEALTH</h3>

        <div className="space-y-2 font-mono">
          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500">INTERNET CONNECTIVITY:</span>
            <span className={isOnline ? 'text-emerald-700 font-bold' : 'text-amber-700 font-bold'}>
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>

          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500">GPS ACCURACY:</span>
            <span className="text-emerald-800 font-bold">HIGH PRECISION</span>
          </div>

          <div className="flex justify-between py-1.5 border-b border-gray-100">
            <span className="text-gray-500">STORAGE ENGINE:</span>
            <span className="text-gray-800">IndexedDB + MongoDB</span>
          </div>

          <div className="flex justify-between py-1.5 text-[11px] text-gray-400">
            <span>APP VERSION:</span>
            <span>NE-SHIELD PWA v2.0.0</span>
          </div>
        </div>
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="w-full bg-white border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold py-3.5 rounded-2xl text-xs transition-colors shadow-xs"
      >
        LOGOUT DEMO SESSION
      </button>
    </div>
  );
}
