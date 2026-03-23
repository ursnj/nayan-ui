import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Button } from 'heroui-native';
import { NText } from '@/components/NText';
import { cn } from '@/lib/utils';

export interface ButtonGroupItem {
  label: string;
  value: string;
  icon?: React.ComponentType<any> | React.ReactElement;
  disabled?: boolean;
}

export interface NButtonGroupProps {
  items: ButtonGroupItem[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  labelClassName?: string;
}

export const NButtonGroup = React.memo<NButtonGroupProps>(
  ({ items, value, onChange, label, disabled = false, className, buttonClassName, labelClassName }) => {
    const renderIcon = useMemo(() => {
      return (icon: React.ComponentType<any> | React.ReactElement | undefined) => {
        if (!icon) return null;

        if (React.isValidElement(icon)) {
          return icon;
        }

        const IconComponent = icon as React.ComponentType<any>;
        return <IconComponent size={16} />;
      };
    }, []);

    return (
      <View className="w-full">
        {label && <NText className={cn('mb-2 font-medium', labelClassName)}>{label}</NText>}
        <View className={cn('flex-row rounded overflow-hidden', className)}>
          {items.map((item, index) => {
            const isSelected = item.value === value;
            const isDisabled = disabled || item.disabled;
            const buttonIcon = renderIcon(item.icon);

            return (
              <Button
                key={item.value}
                isDisabled={isDisabled}
                onPress={() => onChange(item.value)}
                variant={isSelected ? 'primary' : 'ghost'}
                className={cn(
                  'rounded-none border-r border-separator',
                  index === 0 && 'rounded-l',
                  index === items.length - 1 && 'rounded-r border-r-0',
                  buttonClassName
                )}>
                {buttonIcon}
                <Button.Label>{item.label}</Button.Label>
              </Button>
            );
          })}
        </View>
      </View>
    );
  }
);

NButtonGroup.displayName = 'NButtonGroup';
