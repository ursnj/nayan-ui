import React from 'react';
import { type ViewProps } from 'react-native';
import { cn } from '../lib/utils';
import { View } from 'uniwind/components';

export interface NCardProps extends ViewProps {
  children?: React.ReactNode;
  className?: string;
}

export const NCard = React.memo<NCardProps>(({ children, className, ...props }) => {
  return (
    <View className={cn('bg-card border border-border rounded-lg p-4', className)} {...props}>
      {children}
    </View>
  );
});

NCard.displayName = 'NCard';
