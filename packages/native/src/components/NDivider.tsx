import React from 'react';
import { Separator, type SeparatorProps, cn } from 'heroui-native';

export interface NDividerProps extends SeparatorProps {}

export const NDivider = React.memo<NDividerProps>(({ orientation = 'horizontal', className, ...props }) => {
  return <Separator className={cn('bg-separator', className)} orientation={orientation} {...props} />;
});

NDivider.displayName = 'NDivider';
