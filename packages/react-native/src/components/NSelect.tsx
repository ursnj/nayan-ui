import React, { useMemo } from 'react';
import { FlatList, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NText } from '@/components/NText';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface SelectOption {
  label: string;
  value: string;
}

export interface NSelectProps {
  label?: string;
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
        <Select defaultValue={value} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger className={cn('w-full bg-card border-border', disabled && 'opacity-70')} disabled={disabled}>
            <SelectValue className="text-text text-sm native:text-lg" placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent insets={contentInsets} className={cn('w-full bg-card border-border shadow', inputClassName)}>
            <View style={{ maxHeight: 250 }}>
              <FlatList
                data={items}
                keyExtractor={(item) => item.value}
                showsVerticalScrollIndicator={true}
                nestedScrollEnabled={true}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                  <SelectItem className="text-text" key={item.value} label={item.label} value={item.value}>
                    {item.label}
                  </SelectItem>
                )}
              />
            </View>
          </SelectContent>
        </Select>
      </View>
    );
  }
);

NSelect.displayName = 'NSelect';
