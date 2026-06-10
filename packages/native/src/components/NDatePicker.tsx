import React, { useCallback, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { cn, useThemeColor } from 'heroui-native';
import { useNTheme } from '../hooks/useNTheme';
import { CalendarIcon } from '../helpers/icons';
import { NText } from './NText';

export interface NDatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  label?: string;
  mode?: 'date' | 'time' | 'datetime';
  display?: 'default' | 'spinner' | 'compact' | 'inline';
  minimumDate?: Date;
  maximumDate?: Date;
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
}

export const NDatePicker = React.memo<NDatePickerProps>(
  ({ value, onChange, label, mode = 'date', display = 'default', minimumDate, maximumDate, disabled = false, className, labelClassName }) => {
    const { isDarkMode } = useNTheme();
    const [mutedColor] = useThemeColor(['muted']);
    const [showPicker, setShowPicker] = useState(false);

    const handleChange = useCallback(
      (_: DateTimePickerEvent, date?: Date) => {
        if (Platform.OS === 'android') setShowPicker(false);
        if (date) onChange(date);
      },
      [onChange]
    );

    const displayText = mode === 'time' ? value.toLocaleTimeString() : value.toLocaleDateString();

    return (
      <View className={cn('mb-3 gap-1.5', className)}>
        {label && <NText className={cn('px-1.5 text-base font-medium text-foreground', labelClassName)}>{label}</NText>}
        <Pressable
          onPress={() => !disabled && setShowPicker(true)}
          className={cn(
            'min-h-12 justify-center rounded-2xl border-[1.5px] border-field-border bg-field px-3 ios:shadow-field android:shadow-sm',
            disabled && 'opacity-50'
          )}>
          <View className="flex-row items-center justify-between">
            <NText className="text-[16px]">{displayText}</NText>
            <CalendarIcon size={18} color={mutedColor} />
          </View>
        </Pressable>
        {showPicker && (
          <DateTimePicker
            value={value}
            mode={mode}
            display={display}
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            disabled={disabled}
            themeVariant={isDarkMode ? 'dark' : 'light'}
            onChange={handleChange}
          />
        )}
      </View>
    );
  }
);

NDatePicker.displayName = 'NDatePicker';
