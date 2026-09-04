import React from 'react';
import Link from 'next/link';

export default function OfflineFallbackPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[75vh] text-center p-6 space-y-5">
      <div className="w-20 h-20 rounded-3xl bg-amber-50 border border-amber-200 flex items-center justify-center shadow-xs text-3xl">
        📡
      </div>
      <div className="space-y-1.5">
        <h1 className="text-xl font-bold text-gray-900">You are currently offline</h1>
        <p className="text-xs text-gray-500 max-w-[280px] leading-relaxed mx-auto">
          No internet connection detected. You can still report field hazards — all reports are stored locally in IndexedDB and automatically synced once connection returns.
        </p>
      </div>
      <Link
        href="/report"
        className="bg-emerald-800 hover:bg-emerald-700 text-white px-6 py-3.5 rounded-xl text-xs font-bold shadow-xs inline-flex items-center gap-2"
      >
        <span>⚠️</span> Create Offline Hazard Report
      </Link>
    </div>
  );
}
