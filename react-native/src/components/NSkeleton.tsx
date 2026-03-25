import React from 'react';
import { Skeleton } from 'heroui-native';
import { cn } from '@/lib/utils';

export interface NSkeletonProps {
  className?: string;
}

export const NSkeleton = React.memo<NSkeletonProps>(({ className }) => {
  return <Skeleton className={cn('bg-muted dark:bg-muted', className)} isLoading={true} />;
});

NSkeleton.displayName = 'NSkeleton';
