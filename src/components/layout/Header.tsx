'use client';

import React from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import Link from 'next/link';

export const Header: React.FC = () => {
  const isOnline = useOnlineStatus();

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-[#E5EDE8] text-gray-900 px-4 py-3 shadow-xs flex items-center justify-between">
      <Link href="/home" className="flex items-center gap-2.5">
        <div className="bg-emerald-800 text-white font-black rounded-xl p-2 text-xs tracking-wider shadow-sm flex items-center justify-center">
          <svg className="w-4 h-4 text-emerald-200" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <h1 className="font-bold text-base leading-none tracking-tight text-gray-900 flex items-center gap-1.5">
            NE-SHIELD <span className="text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200/80 px-1.5 py-0.5 rounded-md font-semibold">CROWD</span>
          </h1>
          <p className="text-[11px] text-gray-500 font-medium leading-tight mt-0.5">Disaster Hazard Reporting</p>
        </div>
      </Link>

      <div className="flex items-center gap-2">
        {/* Network status badge */}
        <div
          className={`flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full border transition-all ${
            isOnline
              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              isOnline ? 'bg-emerald-500 shadow-[0_0_6px_rgba(34,197,94,0.6)]' : 'bg-amber-500'
            }`}
          />
          {isOnline ? 'Online' : 'Offline'}
        </div>
      </div>
    </header>
  );
};
