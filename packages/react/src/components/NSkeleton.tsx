import React from 'react';
import { Skeleton } from '@heroui/react';
import { cn } from '../lib/utils';

export interface NSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  role?: string;
  'aria-busy'?: boolean;
  'aria-live'?: 'off' | 'polite' | 'assertive';
}

export const NSkeleton: React.FC<NSkeletonProps> = React.memo(
  ({ className = '', role = 'status', 'aria-busy': ariaBusy = true, 'aria-live': ariaLive = 'polite', ...rest }) => {
    return <Skeleton className={cn('nyn-skeleton', className)} {...(rest as any)} />;
  }
);

NSkeleton.displayName = 'NSkeleton';
