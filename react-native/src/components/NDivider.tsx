import React from 'react';
import { Separator } from 'heroui-native';
import { cn } from '@/lib/utils';

export interface NDividerProps {
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export const NDivider = React.memo<NDividerProps>(({ orientation = 'horizontal', className }) => {
  return <Separator className={cn('bg-border', className)} orientation={orientation as any} />;
});

NDivider.displayName = 'NDivider';
