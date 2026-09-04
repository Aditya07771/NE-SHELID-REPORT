import React from 'react';
import { cn } from '@/lib/cn';

interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ title = 'Something went wrong', message, onRetry, className }) => {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center animate-fade-in', className)}>
      <div className="w-16 h-16 rounded-[20px] bg-danger/10 border border-danger/20 flex items-center justify-center text-3xl mb-4">
        ⚠️
      </div>
      <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
      <p className="text-xs text-slate-400 max-w-[260px] leading-relaxed">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-4 btn-ghost px-5 py-2.5 text-xs"
        >
          Try Again
        </button>
      )}
    </div>
  );
};
