import React from 'react';
import { cn } from '@/lib/cn';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon = '📋', title, description, action, className }) => {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center animate-fade-in', className)}>
      <div className="w-16 h-16 rounded-[20px] bg-shield-elevated border border-shield-border flex items-center justify-center text-3xl mb-4">
        {icon}
      </div>
      <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
      {description && <p className="text-xs text-slate-400 max-w-[240px] leading-relaxed">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};
