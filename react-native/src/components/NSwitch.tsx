import React from 'react';
import { Label, Switch } from 'heroui-native';
import { View } from 'uniwind/components';

import { cn } from '../lib/utils';

export interface NSwitchProps {
  label?: string;
  checked: boolean;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
  disabled?: boolean;
  onChange: (checked: boolean) => void;
}

export const NSwitch = React.memo<NSwitchProps>(
  ({ label, className = '', labelClassName = '', inputClassName = '', disabled = false, onChange, checked = false }) => {
    const handleToggle = () => {
      if (!disabled) {
        onChange(!checked);
      }
    };

    return (
      <View className={cn('w-full flex-row items-center justify-between mb-3', className)}>
        {label && (
          <Label className={cn('flex-1 text-text text-base pr-3', labelClassName)} nativeID={'switch-' + label} onPress={handleToggle}>
            {label}
          </Label>
        )}
        <Switch
          isDisabled={disabled}
          className={cn(`${checked ? 'bg-primary' : 'bg-muted opacity-80'} border-border`, inputClassName)}
          isSelected={checked}
          onSelectedChange={(next: boolean) => !disabled && onChange(next)}
          nativeID={'switch-' + label}
        />
      </View>
    );
  }
);

NSwitch.displayName = 'NSwitch';
