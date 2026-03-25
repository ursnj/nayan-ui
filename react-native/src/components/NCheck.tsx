import React from 'react';
import { View } from 'react-native';
import { NText } from '@/components/NText';
import { Checkbox } from '@/components/ui/checkbox';
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
      <Checkbox checked={checked} disabled={disabled} onCheckedChange={onChange} />
      {label && <NText className={cn('pl-3', labelClassName)}>{label}</NText>}
    </View>
  );
});

NCheck.displayName = 'NCheck';
