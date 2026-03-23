import React from 'react';
import { View } from 'react-native';
import { Checkbox, Label } from 'heroui-native';
import { cn } from '@/lib/utils';

export interface NCheckProps {
  checked: boolean;
  disabled?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
  className?: string;
  labelClassName?: string;
}

export const NCheck = React.memo<NCheckProps>(({ checked = false, disabled = false, label = '', onChange, className, labelClassName }) => {
  return (
    <View className={cn('flex-row items-center mb-3', className)}>
      <Checkbox isSelected={checked} isDisabled={disabled} onValueChange={onChange} />
      {label && <Label className={cn('pl-3 text-foreground', labelClassName)}>{label}</Label>}
    </View>
  );
});

NCheck.displayName = 'NCheck';
