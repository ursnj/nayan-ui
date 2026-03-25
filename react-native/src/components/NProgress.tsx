import React from 'react';
import { View } from 'uniwind/components';

import { cn } from '../lib/utils';

export interface NProgressProps {
  value: number;
  className?: string;
  indicatorClassName?: string;
}

export const NProgress = React.memo<NProgressProps>(({ value, className = '', indicatorClassName = '' }) => {
  const safeValue = Math.max(0, Math.min(100, value));

  return (
    <View className={cn('w-full h-4 overflow-hidden rounded-full bg-card border border-border', className)}>
      <View className={cn('h-full bg-primary', indicatorClassName)} style={{ width: `${safeValue}%` }} />
    </View>
  );
});

NProgress.displayName = 'NProgress';
