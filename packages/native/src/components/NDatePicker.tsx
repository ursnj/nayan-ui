import React from 'react';
import { Platform, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { cn } from 'heroui-native';
import { CalendarIcon } from '../helpers/icons';
import { useNTheme } from '../hooks/useNTheme';
import { NPress } from './NPress';
import { NText } from './NText';

export interface NDatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  label?: string;
  placeholder?: string;
  mode?: 'date' | 'time' | 'datetime';
  display?: 'default' | 'spinner' | 'compact' | 'inline';
  minimumDate?: Date;
  maximumDate?: Date;
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
  iconColor?: string;
  iconSize?: number;
  icon?: React.ReactNode;
  format?: (date: Date) => string;
}

const defaultFormat = (date: Date, mode: string) => {
  if (mode === 'time') {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  return date.toISOString().split('T')[0];
};

export const NDatePicker = React.memo<NDatePickerProps>(
  ({
    value,
    onChange,
    label,
    placeholder = 'Select date',
    mode = 'date',
    display = 'default',
    minimumDate,
    maximumDate,
    disabled = false,
    className,
    labelClassName,
    iconColor,
    iconSize = 20,
    icon,
    format
  }) => {
    const { isDarkMode, colors } = useNTheme();
    const [showPicker, setShowPicker] = React.useState(false);
    const displayValue = format ? format(value) : defaultFormat(value, mode);
    const resolvedIconColor = iconColor || colors.muted;

    const handleChange = (_: DateTimePickerEvent, date?: Date) => {
      if (Platform.OS === 'android') {
        setShowPicker(false);
      }
      if (date) {
        onChange(date);
      }
    };

    if (Platform.OS === 'ios') {
      return (
        <View className={cn('mb-3', className)}>
          {label && <NText className={cn('mb-1 text-sm font-medium', labelClassName)}>{label}</NText>}
          <View className="min-h-12 flex-row items-center rounded-2xl border-[1.5px] border-border bg-field px-3">
            <View className="flex-1">
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
            {icon || <CalendarIcon size={iconSize} color={resolvedIconColor} />}
          </View>
        </View>
      );
    }

    return (
      <View className={cn('mb-3', className)}>
        {label && <NText className={cn('mb-1 text-sm font-medium', labelClassName)}>{label}</NText>}
        <NPress onPress={() => !disabled && setShowPicker(true)} disabled={disabled}>
          <View className="min-h-12 flex-row items-center justify-between rounded-2xl border-[1.5px] border-border bg-field px-3">
            <NText className={cn('flex-1 text-base', disabled && 'opacity-50')}>{displayValue || placeholder}</NText>
            {icon || <CalendarIcon size={iconSize} color={resolvedIconColor} />}
          </View>
        </NPress>
        {showPicker && (
          <DateTimePicker
            value={value}
            mode={mode}
            display={display}
            minimumDate={minimumDate}
            maximumDate={maximumDate}
            themeVariant={isDarkMode ? 'dark' : 'light'}
            onChange={handleChange}
          />
        )}
      </View>
    );
  }
);

NDatePicker.displayName = 'NDatePicker';
