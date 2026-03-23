import React from 'react';
import { View } from 'react-native';
import { Label, Switch } from 'heroui-native';
import { cn } from '@/lib/utils';

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
          <Label className={cn('flex-1 text-foreground text-base pr-3', labelClassName)} onPress={handleToggle}>
            {label}
          </Label>
        )}
        <Switch isDisabled={disabled} isSelected={checked} onSelectedChange={handleToggle} className={cn(inputClassName)} />
      </View>
    );
  }
);

NSwitch.displayName = 'NSwitch';
