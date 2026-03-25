import React from 'react';
import { Pressable, View } from 'react-native';
import ColorPicker from 'react-native-wheel-color-picker';
import { NPopover } from '@/components/NPopover';
import { NText } from '@/components/NText';
import { cn } from '@/lib/utils';

export interface NColorPickerProps {
  value: string;
  label?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
  className?: string;
  labelClassName?: string;
  triggerClassName?: string;
}

export const NColorPicker = React.memo<NColorPickerProps>(
  ({ label = '', value = '#ffffff', disabled = false, onChange, className, labelClassName, triggerClassName }) => {
    return (
      <View className={cn('w-full flex-row justify-between items-center mb-3', className)}>
        {label && <NText className={cn('mb-1 text-lg', labelClassName)}>{label}</NText>}
        <NPopover
          trigger={
            <Pressable
              className={cn('w-7 h-7 rounded border border-border', disabled && 'opacity-70', triggerClassName)}
              style={{ backgroundColor: value }}
              disabled={disabled}
            />
          }>
          <View className="w-full p-3">
            <ColorPicker
              color={value}
              swatchesLast={false}
              onColorChangeComplete={onChange}
              thumbSize={30}
              sliderSize={20}
              gapSize={10}
              noSnap={true}
              row={false}
              swatches={true}
              useNativeDriver={true}
            />
          </View>
        </NPopover>
      </View>
    );
  }
);

NColorPicker.displayName = 'NColorPicker';
