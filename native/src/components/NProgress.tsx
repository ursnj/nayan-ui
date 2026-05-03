import React from 'react';
import { View } from 'react-native';
import { cn } from '../helpers/utils';

export interface NProgressProps {
  value: number;
  className?: string;
  indicatorClassName?: string;
}

export const NProgress = React.memo<NProgressProps>(({ value, className = '', indicatorClassName = '' }) => {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <View className={cn('w-full bg-surface rounded-full overflow-hidden', className)} style={{ height: 8 }}>
      <View className={cn('w-full bg-accent rounded-full', indicatorClassName)} style={{ height: 8, width: `${clampedValue}%` }} />
    </View>
  );
});

NProgress.displayName = 'NProgress';
