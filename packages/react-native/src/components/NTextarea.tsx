import React from 'react';
import { type TextInputProps, View } from 'react-native';
import { NText } from '@/components/NText';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export interface NTextareaProps extends TextInputProps {
  value: string;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
  onChangeText: (text: string) => void;
}

export const NTextarea = React.memo<NTextareaProps>(
  ({ value, label = '', placeholder = '', className = '', labelClassName = '', inputClassName = '', onChangeText, disabled = false, ...props }) => {
    return (
      <View className={cn('flex-1 mb-3', className)}>
        {label && <NText className={cn('mb-1', labelClassName)}>{label}</NText>}
        <Textarea
          value={value}
          editable={!disabled}
          placeholder={placeholder}
          onChangeText={onChangeText}
          placeholderClassName="text-muted"
          textAlignVertical="top"
          className={cn('text-text text-base border border-border bg-card', inputClassName)}
          {...props}
        />
      </View>
    );
  }
);

NTextarea.displayName = 'NTextarea';
