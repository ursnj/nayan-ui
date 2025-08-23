import React from 'react';
import { cn } from '../lib/utils';
import { Skeleton } from './ui/skeleton';

export interface NSkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  role?: string;
  'aria-busy'?: boolean;
  'aria-live'?: 'off' | 'polite' | 'assertive';
}

export const NSkeleton: React.FC<NSkeletonProps> = React.memo(
  ({ className = '', role = 'status', 'aria-busy': ariaBusy = true, 'aria-live': ariaLive = 'polite', ...rest }) => {
    return <Skeleton className={cn('nyn-skeleton bg-border', className)} role={role} aria-busy={ariaBusy} aria-live={ariaLive} {...rest} />;
  }
);

NSkeleton.displayName = 'NSkeleton';
