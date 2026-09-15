import React from 'react';
import { View } from 'react-native';
import { cn } from 'heroui-native';

export interface NProgressProps {
  value: number;
  className?: string;
  indicatorClassName?: string;
}

export const NProgress = React.memo<NProgressProps>(({ value, className, indicatorClassName }) => {
  const clampedValue = Math.min(100, Math.max(0, value));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: Math.round(clampedValue) }}
      className={cn('h-2 w-full overflow-hidden rounded-full bg-border', className)}>
      <View className={cn('h-full rounded-full bg-accent', indicatorClassName)} style={{ width: `${clampedValue}%` }} />
    </View>
  );
});

NProgress.displayName = 'NProgress';
