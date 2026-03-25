import React, { useMemo } from 'react';
import { Select } from 'heroui-native';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NText } from '@/components/NText';
import { cn } from '@/lib/utils';

export interface SelectOption {
  label: string;
  value: string;
}

export interface NSelectProps {
  label?: string;
  selectLabel?: string;
  placeholder?: string;
  disabled?: boolean;
  value: SelectOption;
  items: SelectOption[];
  onChange: (value: any) => void;
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
}

export const NSelect = React.memo<NSelectProps>(
  ({
    label = '',
    selectLabel = '',
    placeholder = '',
    disabled = false,
    value,
    items,
    onChange,
    className = '',
    labelClassName = '',
    inputClassName = ''
  }) => {
    const insets = useSafeAreaInsets();

    const contentInsets = useMemo(
      () => ({
        top: insets.top,
        bottom: insets.bottom,
        left: 12,
        right: 12
      }),
      [insets.top, insets.bottom]
    );

    return (
      <View className={cn('flex-1 mb-3', className)}>
        {label && <NText className={cn('mb-1', labelClassName)}>{label}</NText>}
        <Select defaultValue={value} onValueChange={onChange} isDisabled={disabled}>
          <Select.Trigger className={cn('w-full bg-card border border-border', disabled && 'opacity-70')} isDisabled={disabled}>
            <Select.Value className="text-text text-sm native:text-lg" placeholder={placeholder} />
          </Select.Trigger>
          <Select.Content presentation="popover" insets={contentInsets} className={cn('w-full bg-card border-border shadow', inputClassName)}>
            <View style={{ maxHeight: 550 }}>
              <ScrollView
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
                persistentScrollbar={false}
                indicatorStyle="black"
                scrollIndicatorInsets={{ right: 1 }}
                keyboardShouldPersistTaps="handled"
                scrollEventThrottle={1}>
                <View>
                  {selectLabel && <Select.ListLabel className="text-text">{selectLabel}</Select.ListLabel>}
                  {items.map(item => (
                    <Select.Item className="text-text" key={item.value} label={item.label} value={item.value}>
                      {item.label}
                    </Select.Item>
                  ))}
                </View>
              </ScrollView>
            </View>
          </Select.Content>
        </Select>
      </View>
    );
  }
);

NSelect.displayName = 'NSelect';
