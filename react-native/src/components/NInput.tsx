import React from 'react';
import { Input } from 'heroui-native';
import { type TextInputProps } from 'react-native';
import { NText } from './NText';
import { cn } from '../lib/utils';
import { View } from 'uniwind/components';

export interface NInputProps extends TextInputProps {
  value: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  onChangeText: (text: string) => void;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
}

export const NInput = React.memo<NInputProps>(
  ({
    value,
    label = '',
    placeholder = '',
    className = '',
    labelClassName = '',
    inputClassName = '',
    onChangeText,
    disabled = false,
    ...remaining
  }) => {
    return (
      <View className={cn('flex mb-3', className)}>
        {label && <NText className={cn('mb-1', labelClassName)}>{label}</NText>}
        <Input
          value={value}
          editable={!disabled}
          isDisabled={disabled}
          placeholder={placeholder}
          onChangeText={onChangeText}
          className={cn('text-text text-base border border-border bg-card', inputClassName)}
          {...remaining}
        />
      </View>
    );
  }
);

NInput.displayName = 'NInput';
