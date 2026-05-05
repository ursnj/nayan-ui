import React from 'react';
import { View } from 'react-native';
import { Label, Radio, RadioGroup, cn } from 'heroui-native';
import { NText } from './NText';

export interface RadioItem {
  label: string;
  value: string;
}

export interface NRadioProps {
  label?: string;
  isDisabled?: boolean;
  value: string;
  items: RadioItem[];
  onValueChange: (value: string) => void;
  className?: string;
  labelClassName?: string;
  itemClassName?: string;
}

export const NRadio = React.memo<NRadioProps>(
  ({ label, value, items, isDisabled = false, onValueChange, className = '', labelClassName = '', itemClassName = '' }) => {
    return (
      <View className={cn('w-full', className)}>
        {label && <NText className={cn('mb-2 font-medium', labelClassName)}>{label}</NText>}
        <RadioGroup value={value} onValueChange={onValueChange} isDisabled={isDisabled} className="gap-3">
          {items.map(item => (
            <RadioGroup.Item key={item.value} value={item.value} className={cn('bg-surface px-4 py-3 rounded-xl', itemClassName)}>
              <Label>{item.label}</Label>
              <Radio variant="secondary" />
            </RadioGroup.Item>
          ))}
        </RadioGroup>
      </View>
    );
  }
);

NRadio.displayName = 'NRadio';
