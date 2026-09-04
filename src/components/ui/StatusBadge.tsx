'use client';

import React from 'react';
import { cn } from '@/lib/cn';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  RECEIVED: { bg: 'bg-blue-500/15', text: 'text-blue-400', dot: 'bg-blue-400', label: 'Received' },
  UNDER_REVIEW: { bg: 'bg-purple-500/15', text: 'text-purple-400', dot: 'bg-purple-400', label: 'Under Review' },
  VALIDATED: { bg: 'bg-cyan-500/15', text: 'text-cyan-400', dot: 'bg-cyan-400', label: 'Validated' },
  IN_PROGRESS: { bg: 'bg-orange-500/15', text: 'text-orange-400', dot: 'bg-orange-400', label: 'In Progress' },
  RESOLVED: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', dot: 'bg-emerald-400', label: 'Resolved' },
  REJECTED: { bg: 'bg-rose-500/15', text: 'text-rose-400', dot: 'bg-rose-400', label: 'Rejected' },
  'PENDING SYNC': { bg: 'bg-amber-500/15', text: 'text-amber-400', dot: 'bg-amber-400 animate-pulse', label: 'Pending Sync' },
  SYNCED: { bg: 'bg-blue-500/15', text: 'text-blue-400', dot: 'bg-blue-400', label: 'Synced' },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const config = statusConfig[status] || { bg: 'bg-slate-500/15', text: 'text-slate-400', dot: 'bg-slate-400', label: status };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full',
        config.bg,
        config.text,
        className
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full', config.dot)} />
      {config.label}
    </span>
  );
};
