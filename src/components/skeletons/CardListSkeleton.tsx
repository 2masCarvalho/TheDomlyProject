import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

interface CardListSkeletonProps {
  rows?: number;
  className?: string;
}

export const CardListSkeleton: React.FC<CardListSkeletonProps> = ({
  rows = 5,
  className,
}) => {
  return (
    <div className={cn('space-y-3', className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border bg-card p-4 flex items-center gap-4"
        >
          <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-2/3" />
          </div>
          <Skeleton className="h-6 w-16 rounded-full" />
        </div>
      ))}
    </div>
  );
};

interface KpiGridSkeletonProps {
  count?: number;
  className?: string;
}

export const KpiGridSkeleton: React.FC<KpiGridSkeletonProps> = ({
  count = 4,
  className,
}) => {
  return (
    <div
      className={cn(
        'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4',
        className
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-xl border bg-card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-4 w-12" />
          </div>
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
};

export default CardListSkeleton;
