import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Button, cn } from 'heroui-native';
import { NText } from './NText';

export interface ButtonGroupItem {
  label: string;
  value: string;
  icon?: React.ComponentType<any> | React.ReactElement;
  isDisabled?: boolean;
}

export interface NButtonGroupProps {
  items: ButtonGroupItem[];
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  isDisabled?: boolean;
  className?: string;
  buttonClassName?: string;
  labelClassName?: string;
}

export const NButtonGroup = React.memo<NButtonGroupProps>(
  ({ items, value, onValueChange, label, isDisabled = false, className, buttonClassName, labelClassName }) => {
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
        <View className={cn('flex-row rounded-lg overflow-hidden', className)}>
          {items.map((item, index) => {
            const isSelected = item.value === value;
            const itemDisabled = isDisabled || item.isDisabled;
            const buttonIcon = renderIcon(item.icon);

            return (
              <Button
                key={item.value}
                isDisabled={itemDisabled}
                onPress={() => onValueChange(item.value)}
                variant={isSelected ? 'primary' : 'secondary'}
                style={{
                  borderTopLeftRadius: index === 0 ? 8 : 0,
                  borderBottomLeftRadius: index === 0 ? 8 : 0,
                  borderTopRightRadius: index === items.length - 1 ? 8 : 0,
                  borderBottomRightRadius: index === items.length - 1 ? 8 : 0
                }}
                className={cn('border-r border-border', !isSelected && 'bg-surface', index === items.length - 1 && 'border-r-0', buttonClassName)}>
                {buttonIcon && <View className="mr-1">{buttonIcon}</View>}
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
