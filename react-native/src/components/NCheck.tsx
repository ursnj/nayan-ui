import React from 'react';
import { View } from 'uniwind/components';

import { Checkbox } from 'heroui-native';
import { NText } from './NText';
import { cn } from '../lib/utils';

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
      <Checkbox isSelected={checked} isDisabled={disabled} onSelectedChange={onChange} />
      {label && <NText className={cn('pl-3', labelClassName)}>{label}</NText>}
    </View>
  );
});

NCheck.displayName = 'NCheck';
