import React from 'react';
import { View } from 'react-native';
import { Select } from 'heroui-native';
import { cn } from '../helpers/utils';
import { NText } from './NText';

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
  onValueChange: (value: string) => void;
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
    triggerClassName = ''
  }) => {
    return (
      <View className={cn('flex-1 mb-3', containerClassName)}>
        {label && <NText className={cn('mb-1', labelClassName)}>{label}</NText>}
        <Select defaultValue={defaultValue} onValueChange={(option: any) => onValueChange(option?.value ?? '')} isDisabled={isDisabled}>
          <Select.Trigger className={cn('w-full', isDisabled && 'opacity-70', triggerClassName)} isDisabled={isDisabled}>
            <Select.Value placeholder={placeholder} />
            <Select.TriggerIndicator />
          </Select.Trigger>
          <Select.Portal>
            <Select.Overlay />
            <Select.Content presentation="popover" width="trigger">
              {selectLabel && <Select.ListLabel>{selectLabel}</Select.ListLabel>}
              {items.map(item => (
                <Select.Item key={item.value} label={item.label} value={item.value} />
              ))}
            </Select.Content>
          </Select.Portal>
        </Select>
      </View>
    );
  }
);

NSelect.displayName = 'NSelect';
