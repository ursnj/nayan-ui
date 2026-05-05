import React from 'react';
import { Skeleton, type SkeletonProps, cn } from 'heroui-native';

export interface NSkeletonProps extends SkeletonProps {}

export const NSkeleton = React.memo<NSkeletonProps>(({ className, ...props }) => {
  return <Skeleton className={cn(className)} {...props} />;
});

NSkeleton.displayName = 'NSkeleton';
