import React from 'react';
import { View } from 'react-native';
import { Input, type InputProps } from 'heroui-native';
import { NText } from './NText';
import { cn } from '../lib/utils';

export interface NInputProps extends InputProps {
  label?: string;
  containerClassName?: string;
  labelClassName?: string;
}

export const NInput = React.memo<NInputProps>(
  ({
    label = '',
    containerClassName = '',
    labelClassName = '',
    className = '',
    ...props
  }) => {
    return (
      <View className={cn('flex mb-3', containerClassName)}>
        {label && <NText className={cn('mb-1', labelClassName)}>{label}</NText>}
        <Input
          className={cn(className)}
          {...props}
        />
      </View>
    );
  }
);

NInput.displayName = 'NInput';
