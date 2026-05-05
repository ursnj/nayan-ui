import React from 'react';
import { SkeletonGroup, type SkeletonGroupRootProps, cn } from 'heroui-native';

export interface NSkeletonGroupProps extends SkeletonGroupRootProps {}

export const NSkeletonGroup = React.memo<NSkeletonGroupProps>(({ children, className, ...props }) => {
  return (
    <SkeletonGroup className={cn(className)} {...props}>
      {children}
    </SkeletonGroup>
  );
});

NSkeletonGroup.displayName = 'NSkeletonGroup';
