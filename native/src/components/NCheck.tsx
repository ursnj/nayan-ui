import React from 'react';
import { View } from 'react-native';
import { Checkbox, Label, type CheckboxProps } from 'heroui-native';
import { cn } from '../helpers/utils';

export interface NCheckProps extends Omit<CheckboxProps, 'children'> {
  label: string;
  containerClassName?: string;
  labelClassName?: string;
}

export const NCheck = React.memo<NCheckProps>(
  ({ label = '', isSelected = false, isDisabled = false, onSelectedChange, containerClassName, labelClassName, ...props }) => {
    return (
      <View className={cn('flex-row items-center gap-2 mb-3', containerClassName)}>
        <Checkbox isSelected={isSelected} isDisabled={isDisabled} onSelectedChange={onSelectedChange} {...props} />
        {label && (
          <Label
            isDisabled={isDisabled}
            className={cn('pl-3 text-foreground text-base', isDisabled && 'opacity-70', labelClassName)}
            nativeID={'check-' + label}
            onPress={() => !isDisabled && onSelectedChange?.(!isSelected)}>
            {label}
          </Label>
        )}
      </View>
    );
  }
);

NCheck.displayName = 'NCheck';
