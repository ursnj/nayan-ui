import React from 'react';
import { View } from 'react-native';
import { Switch, Label, type SwitchProps } from 'heroui-native';
import { cn } from '../helpers/utils';

export interface NSwitchProps extends Omit<SwitchProps, 'children'> {
  label?: string;
  containerClassName?: string;
  labelClassName?: string;
}

export const NSwitch = React.memo<NSwitchProps>(
  ({ label, containerClassName = '', labelClassName = '', className = '', isDisabled = false, isSelected = false, onSelectedChange, ...props }) => {
    const handleToggle = () => {
      if (!isDisabled) {
        onSelectedChange?.(!isSelected);
      }
    };

    return (
      <View className={cn('w-full flex-row items-center justify-between mb-3', containerClassName)}>
        {label && (
          <Label className={cn('flex-1 text-foreground text-base pr-3', labelClassName)} nativeID={'switch-' + label} onPress={handleToggle}>
            {label}
          </Label>
        )}
        <Switch
          isDisabled={isDisabled}
          isSelected={isSelected}
          onSelectedChange={handleToggle}
          className={cn(!isSelected && 'bg-surface', className)}
          nativeID={'switch-' + label}
          {...props}
        />
      </View>
    );
  }
);

NSwitch.displayName = 'NSwitch';
