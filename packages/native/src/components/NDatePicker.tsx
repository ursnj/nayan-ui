import React, { useCallback, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { cn } from 'heroui-native';
import { useNTheme } from '../hooks/useNTheme';
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
    const { isDarkMode, colors } = useNTheme();
    const [showPicker, setShowPicker] = useState(false);

    const handleChange = useCallback(
      (_: DateTimePickerEvent, date?: Date) => {
        if (Platform.OS === 'android') setShowPicker(false);
        if (date) onChange(date);
      },
      [onChange]
    );

    const isAndroid = Platform.OS === 'android';

    return (
      <View className={cn('mb-3', className)}>
        {label && <NText className={cn('mb-2 text-sm font-medium', labelClassName)}>{label}</NText>}
        {isAndroid ? (
          <>
            <Pressable
              onPress={() => !disabled && setShowPicker(true)}
              style={{ borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 12, opacity: disabled ? 0.5 : 1 }}>
              <NText>{mode === 'time' ? value.toLocaleTimeString() : value.toLocaleDateString()}</NText>
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
          </>
        ) : (
          <View style={{ marginLeft: -15 }}>
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
          </View>
        )}
      </View>
    );
  }
);

NDatePicker.displayName = 'NDatePicker';
