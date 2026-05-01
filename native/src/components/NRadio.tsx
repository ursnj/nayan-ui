import React from 'react';
import { View } from 'react-native';
import { RadioGroup, Label } from 'heroui-native';
import { NText } from './NText';
import { cn } from '../helpers/utils';

export interface RadioItem {
  label: string;
  value: string;
}

interface RadioGroupItemInternalProps {
  isDisabled?: boolean;
  item: RadioItem;
  onLabelPress: (value: string) => void;
  radioItemClassName?: string;
  radioLabelClassName?: string;
}

const RadioGroupItemWithLabel = React.memo<RadioGroupItemInternalProps>(
  ({ isDisabled, item, onLabelPress, radioItemClassName = '', radioLabelClassName = '' }) => {
    return (
      <View className={cn('flex-row gap-2 items-center', radioItemClassName)}>
        <RadioGroup.Item isDisabled={isDisabled} value={item.value} />
        <Label
          isDisabled={isDisabled}
          className={cn('text-foreground text-lg', isDisabled && 'opacity-70', radioLabelClassName)}
          nativeID={`label-for-${item.value}`}
          onPress={() => !isDisabled && onLabelPress(item.value)}>
          {item.label}
        </Label>
      </View>
    );
  }
);

RadioGroupItemWithLabel.displayName = 'RadioGroupItemWithLabel';

export interface NRadioProps {
  label?: string;
  isDisabled?: boolean;
  value: string;
  items: RadioItem[];
  onValueChange: (value: string) => void;
  containerClassName?: string;
  labelClassName?: string;
  radioGroupClassName?: string;
  radioItemClassName?: string;
  radioLabelClassName?: string;
}

export const NRadio = React.memo<NRadioProps>(
  ({
    label,
    value,
    items,
    isDisabled = false,
    onValueChange,
    containerClassName = '',
    labelClassName = '',
    radioGroupClassName = '',
    radioItemClassName,
    radioLabelClassName,
  }) => {
    return (
      <View className={cn('flex-1 mb-3', containerClassName)}>
        {label && <NText className={cn('mb-2', labelClassName)}>{label}</NText>}
        <RadioGroup value={value} onValueChange={onValueChange} isDisabled={isDisabled} className={cn('gap-3 flex-row flex-wrap', radioGroupClassName)}>
          {items.map((item) => (
            <RadioGroupItemWithLabel
              key={item.value}
              isDisabled={isDisabled}
              item={item}
              onLabelPress={onValueChange}
              radioItemClassName={radioItemClassName}
              radioLabelClassName={radioLabelClassName}
            />
          ))}
        </RadioGroup>
      </View>
    );
  }
);

NRadio.displayName = 'NRadio';
