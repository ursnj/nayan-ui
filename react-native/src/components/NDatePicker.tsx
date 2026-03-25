import React, { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { format } from 'date-fns';
import { NPress } from '@/components/NPress';
import { NText } from '@/components/NText';
import { useNTheme } from '@/hooks/useNTheme';
import { Calendar } from '@/lib/icons/Calender';
import { cn } from '@/lib/utils';

export interface NDatePickerProps {
  value: Date;
  label?: string;
  isDarkMode?: boolean;
  disabled?: boolean;
  type?: 'date' | 'time' | 'datetime';
  onChange: (date: Date) => void;
  icon?: React.ComponentType<any> | React.ReactElement;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
  inputTextClassName?: string;
  inputIconClassName?: string;
}

export const NDatePicker = React.memo<NDatePickerProps>(
  ({
    label = '',
    type = 'date',
    disabled = false,
    className = '',
    labelClassName = '',
    inputClassName = '',
    inputTextClassName = '',
    inputIconClassName = '',
    value,
    onChange,
    icon,
    isDarkMode: propIsDarkMode
  }) => {
    const { isDarkMode: themeIsDarkMode } = useNTheme();
    const isDarkMode = propIsDarkMode ?? themeIsDarkMode;
    const [isVisible, setIsVisible] = useState(false);

    const hideDatePicker = useCallback(() => {
      setIsVisible(false);
    }, []);

    const showDatePicker = useCallback(() => {
      if (!disabled) {
        setIsVisible(true);
      }
    }, [disabled]);

    const handleConfirm = useCallback(
      (date: Date) => {
        onChange(date);
        hideDatePicker();
      },
      [onChange, hideDatePicker]
    );

    const formatValue = useCallback(
      (date: Date) => {
        if (type === 'time') {
          return format(date, 'HH:mm:ss');
        }
        if (type === 'date') {
          return format(date, 'yyyy-MM-dd');
        }
        return format(date, 'yyy-MM-dd HH:mm:ss');
      },
      [type]
    );

    const dateIcon = useMemo(() => {
      if (icon) {
        if (React.isValidElement(icon)) {
          return icon;
        }
        const IconComponent = icon as React.ComponentType<any>;
        return <IconComponent strokeWidth={1} className={cn('w-5 h-5 text-text', inputIconClassName)} />;
      }
      return <Calendar strokeWidth={1} className={cn('w-5 h-5 text-text', inputIconClassName)} />;
    }, [icon, inputIconClassName]);

    return (
      <View className={cn('w-full mb-3', className)}>
        {label && <NText className={cn('mb-1', labelClassName)}>{label}</NText>}
        <DateTimePickerModal
          isVisible={isVisible}
          mode={type as any}
          date={value}
          disabled={disabled}
          isDarkModeEnabled={isDarkMode}
          onConfirm={handleConfirm}
          onCancel={hideDatePicker}
        />
        <NPress
          onPress={showDatePicker}
          className={cn(
            'flex-row justify-between items-center bg-card border border-border rounded px-3 py-2.5',
            disabled && 'opacity-50',
            inputClassName
          )}>
          <NText className={cn('text-lg', inputTextClassName)}>{formatValue(value)}</NText>
          {dateIcon}
        </NPress>
      </View>
    );
  }
);

NDatePicker.displayName = 'NDatePicker';
