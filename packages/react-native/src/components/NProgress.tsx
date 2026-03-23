import React from 'react';
import { View } from 'react-native';
import { cn } from '@/lib/utils';

export interface NProgressProps {
  value: number;
  className?: string;
  indicatorClassName?: string;
}

export const NProgress = React.memo<NProgressProps>(({ value, className = '', indicatorClassName = '' }) => {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <View className={cn('w-full h-3 rounded-full bg-default overflow-hidden', className)}>
      <View className={cn('h-full rounded-full bg-accent', indicatorClassName)} style={{ width: `${clampedValue}%` }} />
    </View>
  );
});

NProgress.displayName = 'NProgress';
