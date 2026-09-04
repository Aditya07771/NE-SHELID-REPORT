import React from 'react';
import { cn } from '@/lib/cn';

interface LoadingStateProps {
  text?: string;
  className?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({ text = 'Loading...', className }) => {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 animate-fade-in', className)}>
      <div className="relative w-10 h-10 mb-3">
        <div className="absolute inset-0 border-2 border-primary/20 rounded-full" />
        <div className="absolute inset-0 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
      <p className="text-xs text-slate-400 font-medium">{text}</p>
    </div>
  );
};
