import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  message?: string;
  cta?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon,
  title,
  message,
  cta,
  className,
  compact = false,
}) => {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-border bg-muted/30',
        compact ? 'py-8 px-4' : 'py-14 px-6',
        className
      )}
    >
      <div
        className={cn(
          'flex items-center justify-center rounded-full bg-muted/50 mb-4',
          compact ? 'h-10 w-10' : 'h-14 w-14'
        )}
      >
        <Icon
          className={cn('text-muted-foreground/60', compact ? 'h-5 w-5' : 'h-7 w-7')}
        />
      </div>
      <h3 className={cn('font-semibold text-foreground', compact ? 'text-sm' : 'text-base')}>
        {title}
      </h3>
      {message && (
        <p
          className={cn(
            'text-muted-foreground max-w-sm',
            compact ? 'text-xs mt-1' : 'text-sm mt-2'
          )}
        >
          {message}
        </p>
      )}
      {cta && <div className="mt-5">{cta}</div>}
    </div>
  );
};

export default EmptyState;
