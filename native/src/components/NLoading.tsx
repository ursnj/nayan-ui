import React from 'react';
import { View } from 'react-native';
import { Spinner } from 'heroui-native';
import { cn } from '../lib/utils';

export interface NLoadingProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const NLoading = React.memo<NLoadingProps>(({ className = '', size = 'md' }) => {
  return (
    <View className={cn('flex-1 justify-center items-center', className)}>
      <Spinner size={size} />
    </View>
  );
});

NLoading.displayName = 'NLoading';
