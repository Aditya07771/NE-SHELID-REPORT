import React from 'react';
import { cn } from '@/lib/cn';

interface SectionHeaderProps {
  title: string;
  action?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({ title, action, className }) => {
  return (
    <div className={cn('flex items-center justify-between', className)}>
      <h3 className="section-title">{title}</h3>
      {action}
    </div>
  );
};
