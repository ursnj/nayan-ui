import React from 'react';
import { View } from 'react-native';
import { TextArea, type TextAreaProps } from 'heroui-native';
import { NText } from './NText';
import { cn } from '../helpers/utils';

export interface NTextareaProps extends TextAreaProps {
  label?: string;
  containerClassName?: string;
  labelClassName?: string;
}

export const NTextarea = React.memo<NTextareaProps>(
  ({ label = '', containerClassName = '', labelClassName = '', className = '', ...props }) => {
    return (
      <View className={cn('flex-1 mb-3', containerClassName)}>
        {label && <NText className={cn('mb-1', labelClassName)}>{label}</NText>}
        <TextArea
          className={cn(className)}
          {...props}
        />
      </View>
    );
  }
);

NTextarea.displayName = 'NTextarea';
