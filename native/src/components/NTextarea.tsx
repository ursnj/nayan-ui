import React from 'react';
import { type TextInputProps, View } from 'react-native';
import { TextArea } from 'heroui-native';
import { NText } from './NText';
import { cn } from '../lib/utils';

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
        <TextArea
          value={value}
          editable={!disabled}
          placeholder={placeholder}
          onChangeText={onChangeText}
          textAlignVertical="top"
          className={cn(inputClassName)}
          {...props}
        />
      </View>
    );
  }
);

NTextarea.displayName = 'NTextarea';
