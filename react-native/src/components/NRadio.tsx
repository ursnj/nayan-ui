import React from 'react';
import { Label, RadioGroup } from 'heroui-native';
import { View } from 'react-native';
import { NText } from '@/components/NText';
import { cn } from '@/lib/utils';

export interface RadioItem {
  label: string;
  value: string;
}

export interface RadioGroupItemProps {
  disabled?: boolean;
  item: RadioItem;
  onLabelPress: (value: string) => void;
  radioItemClassName?: string;
  radioClassName?: string;
  radioLabelClassName?: string;
}

const RadioGroupItemWithLabel = React.memo<RadioGroupItemProps>(
  ({ disabled, item, onLabelPress, radioItemClassName = '', radioLabelClassName = '', radioClassName = '' }) => {
    return (
      <View className={cn('flex-row gap-2 items-center', radioItemClassName)}>
        <RadioGroup.Item className={radioClassName} isDisabled={disabled} aria-labelledby={`label-for-${item.value}`} value={item.value} />
        <Label
          isDisabled={disabled}
          className={cn('text-text native:text-lg', disabled && 'opacity-70', radioLabelClassName)}
          nativeID={`label-for-${item.value}`}
          onPress={() => !disabled && onLabelPress(item.value)}>
          {item.label}
        </Label>
      </View>
    );
  }
);

RadioGroupItemWithLabel.displayName = 'RadioGroupItemWithLabel';

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
  radioClassName?: string;
  radioLabelClassName?: string;
}

export const NRadio = React.memo<NRadioProps>(
  ({
    label,
    value,
    items,
    disabled = false,
    onChange,
    className = '',
    labelClassName = '',
    radioGroupClassName = '',
    radioItemClassName,
    radioClassName,
    radioLabelClassName
  }) => {
    return (
      <View className={cn('flex-1 mb-3', className)}>
        {label && <NText className={cn('mb-2', labelClassName)}>{label}</NText>}
        <RadioGroup value={value} onValueChange={onChange} isDisabled={disabled} className={cn('gap-3 flex-row flex-wrap', radioGroupClassName)}>
          {items.map(item => (
            <RadioGroupItemWithLabel
              key={item.value}
              disabled={disabled}
              item={item}
              onLabelPress={onChange}
              radioItemClassName={radioItemClassName}
              radioClassName={radioClassName}
              radioLabelClassName={radioLabelClassName}
            />
          ))}
        </RadioGroup>
      </View>
    );
  }
);

NRadio.displayName = 'NRadio';
