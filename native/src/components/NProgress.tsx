import React from 'react';
import { View } from 'react-native';
import { cn } from '../helpers/utils';

export interface NProgressProps {
  value: number;
  className?: string;
  indicatorClassName?: string;
}

export const NProgress = React.memo<NProgressProps>(({ value, className = '', indicatorClassName = '' }) => {
  return (
    <View className={cn('w-full h-2 bg-default rounded-full overflow-hidden', className)}>
      <View className={cn('h-full bg-accent rounded-full', indicatorClassName)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </View>
  );
});

NProgress.displayName = 'NProgress';
