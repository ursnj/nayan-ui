import React from 'react';
import { View } from 'react-native';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
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
          <Label className={cn('flex-1 text-text text-base pr-3', labelClassName)} nativeID={'switch-' + label} onPress={handleToggle}>
            {label}
          </Label>
        )}
        <Switch
          disabled={disabled}
          className={cn(`${checked ? 'bg-primary' : 'bg-muted opacity-80'} border-border`, inputClassName)}
          checked={checked}
          onCheckedChange={handleToggle}
          nativeID={'switch-' + label}
        />
      </View>
    );
  }
);

NSwitch.displayName = 'NSwitch';
