import React from 'react';
import { type TextInputProps, View } from 'react-native';
import { NText } from '@/components/NText';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

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
