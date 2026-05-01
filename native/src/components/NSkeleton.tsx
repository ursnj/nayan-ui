import React from 'react';
import { Skeleton, type SkeletonProps } from 'heroui-native';
import { cn } from '../helpers/utils';

export interface NSkeletonProps extends SkeletonProps {}

export const NSkeleton = React.memo<NSkeletonProps>(({ className, ...props }) => {
  return <Skeleton className={cn('bg-surface', className)} {...props} />;
});

NSkeleton.displayName = 'NSkeleton';
