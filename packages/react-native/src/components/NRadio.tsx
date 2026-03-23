import React from 'react';
import { View } from 'react-native';
import { RadioGroup } from 'heroui-native';
import { NText } from '@/components/NText';
import { cn } from '@/lib/utils';

export interface RadioItem {
  label: string;
  value: string;
}

export interface NRadioProps {
  label?: string;
  disabled?: boolean;
  value: string;
  items: RadioItem[];
  onChange: (value: string) => void;
  className?: string;
  labelClassName?: string;
  radioGroupClassName?: string;
  radioItemClassName?: string;
}

export const NRadio = React.memo<NRadioProps>(
  ({ label, value, items, disabled = false, onChange, className = '', labelClassName = '', radioGroupClassName = '', radioItemClassName }) => {
    return (
      <View className={cn('flex-1 mb-3', className)}>
        {label && <NText className={cn('mb-2', labelClassName)}>{label}</NText>}
        <RadioGroup value={value} onValueChange={onChange} isDisabled={disabled} className={cn('gap-3', radioGroupClassName)}>
          {items.map(item => (
            <RadioGroup.Item key={item.value} value={item.value} className={cn(radioItemClassName)}>
              {item.label}
            </RadioGroup.Item>
          ))}
        </RadioGroup>
      </View>
    );
  }
);

NRadio.displayName = 'NRadio';
