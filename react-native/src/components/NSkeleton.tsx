import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export interface NSkeletonProps {
  className?: string;
}

export const NSkeleton = React.memo<NSkeletonProps>(({ className }) => {
  return <Skeleton className={cn('bg-muted dark:bg-muted', className)} />;
});

NSkeleton.displayName = 'NSkeleton';
