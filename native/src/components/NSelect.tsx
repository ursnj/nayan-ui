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
  disabled?: boolean;
  value: SelectOption;
  items: SelectOption[];
  onChange: (value: any) => void;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
}

export const NSelect = React.memo<NSelectProps>(
  ({
    label = '',
    selectLabel = '',
    placeholder = '',
    disabled = false,
    value,
    items,
    onChange,
    className = '',
    labelClassName = '',
    inputClassName = '',
  }) => {
    return (
      <View className={cn('flex-1 mb-3', className)}>
        {label && <NText className={cn('mb-1', labelClassName)}>{label}</NText>}
        <Select defaultValue={value} onValueChange={onChange} isDisabled={disabled}>
          <Select.Trigger className={cn('w-full', disabled && 'opacity-70', inputClassName)} isDisabled={disabled}>
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
