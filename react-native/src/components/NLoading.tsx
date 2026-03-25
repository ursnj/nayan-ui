import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useNTheme } from '@/hooks/useNTheme';
import { cn } from '@/lib/utils';

export interface NLoadingProps {
  color?: string;
  className?: string;
  size?: number | 'small' | 'large';
}

export const NLoading = React.memo<NLoadingProps>(({ className = '', size = 'large', color }) => {
  const { colors } = useNTheme();
  const loadingColor = color || colors.primary;

  return (
    <View className={cn('flex-1 justify-center items-center', className)}>
      <ActivityIndicator animating={true} size={size as any} color={loadingColor} />
    </View>
  );
});

NLoading.displayName = 'NLoading';
