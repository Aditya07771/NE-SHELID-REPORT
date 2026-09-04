'use client';

import React from 'react';
import { cn } from '@/lib/cn';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

export const OfflineBanner: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="mx-4 mb-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl px-4 py-3 flex items-start gap-3 animate-fade-in">
      <div className="w-2 h-2 rounded-full bg-amber-400 mt-1.5 shrink-0 animate-pulse-dot" />
      <div>
        <p className="text-xs font-semibold text-amber-300">You are offline</p>
        <p className="text-[11px] text-amber-200/60 mt-0.5 leading-relaxed">
          Reports will be securely saved on this device and synchronized when connectivity returns.
        </p>
      </div>
    </div>
  );
};
