import React from 'react';
import { View } from 'react-native';
import { Spinner, type SpinnerProps } from 'heroui-native';
import { cn } from '../lib/utils';

export interface NLoadingProps extends Omit<SpinnerProps, 'children'> {
  containerClassName?: string;
}

export const NLoading = React.memo<NLoadingProps>(({ containerClassName = '', ...props }) => {
  return (
    <View className={cn('flex-1 justify-center items-center', containerClassName)}>
      <Spinner {...props} />
    </View>
  );
});

NLoading.displayName = 'NLoading';
