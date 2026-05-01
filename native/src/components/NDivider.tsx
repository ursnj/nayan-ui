import React from 'react';
import { Separator, type SeparatorProps } from 'heroui-native';
import { cn } from '../lib/utils';

export interface NDividerProps extends SeparatorProps {}

export const NDivider = React.memo<NDividerProps>(({ orientation = 'horizontal', className, ...props }) => {
  return <Separator className={cn('bg-separator', className)} orientation={orientation} {...props} />;
});

NDivider.displayName = 'NDivider';
