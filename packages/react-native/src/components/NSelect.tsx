import React from 'react';
import { View } from 'react-native';
import { Select } from 'heroui-native';
import { NText } from '@/components/NText';
import { cn } from '@/lib/utils';

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
  presentation?: 'popover' | 'bottom-sheet' | 'dialog';
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
    presentation = 'popover'
  }) => {
    return (
      <View className={cn('flex-1 mb-3', className)}>
        {label && <NText className={cn('mb-1', labelClassName)}>{label}</NText>}
        <Select
          defaultSelectedKey={value?.value}
          onSelectionChange={key => {
            const selected = items.find(item => item.value === key);
            if (selected) onChange(selected);
          }}
          isDisabled={disabled}>
          <Select.Trigger className={cn(disabled && 'opacity-70')}>
            <Select.Value placeholder={placeholder} />
            <Select.TriggerIndicator />
          </Select.Trigger>
          <Select.Portal>
            <Select.Overlay />
            <Select.Content presentation={presentation} className={cn(inputClassName)}>
              {selectLabel && <Select.ListLabel>{selectLabel}</Select.ListLabel>}
              {items.map(item => (
                <Select.Item key={item.value} id={item.value} value={item.value} label={item.label}>
                  <Select.ItemLabel />
                  <Select.ItemIndicator />
                </Select.Item>
              ))}
            </Select.Content>
          </Select.Portal>
        </Select>
      </View>
    );
  }
);

NSelect.displayName = 'NSelect';
