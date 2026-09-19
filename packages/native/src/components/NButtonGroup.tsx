import React from "react";
import { View } from "react-native";
import { Button, cn } from "heroui-native";
import { type NIcon, resolveIcon } from "../helpers/icons";
import { NText } from "./NText";

export interface ButtonGroupItem {
  label: string;
  value: string;
  icon?: NIcon;
  isDisabled?: boolean;
}

export interface NButtonGroupProps {
  items: ButtonGroupItem[];
  value?: string;
  /** Alias of `value`, as the React package names it. */
  selected?: string;
  onValueChange?: (value: string) => void;
  /** Alias of `onValueChange`. */
  onChange?: (value: string) => void;
  label?: string;
  isDisabled?: boolean;
  /** Alias of `isDisabled`. */
  disabled?: boolean;
  className?: string;
  buttonClassName?: string;
  labelClassName?: string;
}

export const NButtonGroup = React.memo<NButtonGroupProps>(
  ({
    items,
    value,
    selected,
    onValueChange,
    onChange,
    label,
    isDisabled,
    disabled,
    className,
    buttonClassName,
    labelClassName,
  }) => {
    const current = value ?? selected;
    const off = disabled ?? isDisabled ?? false;
    const change = onValueChange ?? onChange;
    return (
      <View className="w-full">
        {label && <NText className={cn("mb-2 font-medium", labelClassName)}>{label}</NText>}
        <View className={cn("flex-row rounded-xl overflow-hidden", className)}>
          {items.map((item, index) => {
            const isSelected = item.value === current;
            const itemDisabled = off || item.isDisabled;
            const buttonIcon = resolveIcon(item.icon, { size: 16 });

            return (
              <Button
                key={item.value}
                isDisabled={itemDisabled}
                onPress={() => change?.(item.value)}
                variant={isSelected ? "primary" : "secondary"}
                className={cn(
                  "rounded-none border-r border-border",
                  !isSelected && "bg-surface",
                  index === 0 && "rounded-l-xl",
                  index === items.length - 1 && "rounded-r-xl border-r-0",
                  buttonClassName,
                )}
              >
                {buttonIcon && <View className="mr-1">{buttonIcon}</View>}
                <Button.Label>{item.label}</Button.Label>
              </Button>
            );
          })}
        </View>
      </View>
    );
  },
);

NButtonGroup.displayName = "NButtonGroup";
