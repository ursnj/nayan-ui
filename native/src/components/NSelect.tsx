import React from 'react';
import { View } from 'react-native';
import { Select } from 'heroui-native';
import { NText } from './NText';
import { cn } from '../lib/utils';

export interface SelectOption {
  label: string;
  value: string;
}

export interface NSelectProps {
  label?: string;
  selectLabel?: string;
  placeholder?: string;
  isDisabled?: boolean;
  defaultValue?: SelectOption;
  items: SelectOption[];
  onValueChange: (value: any) => void;
  containerClassName?: string;
  labelClassName?: string;
  triggerClassName?: string;
}

export const NSelect = React.memo<NSelectProps>(
  ({
    label = '',
    selectLabel = '',
    placeholder = '',
    isDisabled = false,
    defaultValue,
    items,
    onValueChange,
    containerClassName = '',
    labelClassName = '',
    triggerClassName = '',
  }) => {
    return (
      <View className={cn('flex-1 mb-3', containerClassName)}>
        {label && <NText className={cn('mb-1', labelClassName)}>{label}</NText>}
        <Select defaultValue={defaultValue} onValueChange={onValueChange} isDisabled={isDisabled}>
          <Select.Trigger className={cn('w-full', isDisabled && 'opacity-70', triggerClassName)} isDisabled={isDisabled}>
            <Select.Value placeholder={placeholder} />
          </Select.Trigger>
          <Select.Content presentation="popover">
            {selectLabel && <Select.ListLabel>{selectLabel}</Select.ListLabel>}
            {items.map((item) => (
              <Select.Item key={item.value} label={item.label} value={item.value}>
                {item.label}
              </Select.Item>
            ))}
          </Select.Content>
        </Select>
      </View>
    );
  }
);

NSelect.displayName = 'NSelect';
