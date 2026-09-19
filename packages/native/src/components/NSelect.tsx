import React from "react";
import { View } from "react-native";
import { Select, cn } from "heroui-native";
import { NText } from "./NText";

export interface SelectOption {
  label: string;
  value: string;
}

export interface NSelectProps {
  label?: string;
  selectLabel?: string;
  placeholder?: string;
  isDisabled?: boolean;
  /** Alias of `isDisabled`. */
  disabled?: boolean;
  defaultValue?: SelectOption;
  /** The selected option, for a controlled select. */
  value?: SelectOption;
  items: SelectOption[];
  /** Alias of `items`, as the React package names it. */
  options?: SelectOption[];
  onValueChange?: (value: string) => void;
  /** Alias of `onValueChange`. */
  onChange?: (value: string) => void;
  containerClassName?: string;
  labelClassName?: string;
  triggerClassName?: string;
}

export const NSelect = React.memo<NSelectProps>(
  ({
    label = "",
    selectLabel = "",
    placeholder = "",
    isDisabled,
    disabled,
    defaultValue,
    value,
    items,
    options,
    onValueChange,
    onChange,
    containerClassName = "",
    labelClassName = "",
    triggerClassName = "",
  }) => {
    const list = items ?? options ?? [];
    const off = disabled ?? isDisabled ?? false;
    const change = onValueChange ?? onChange;

    return (
      <View className={cn("flex-1 mb-3", containerClassName)}>
        {label && <NText className={cn("mb-1", labelClassName)}>{label}</NText>}
        <Select
          value={value}
          defaultValue={defaultValue}
          onValueChange={(option: any) => change?.(option?.value ?? "")}
          isDisabled={off}
        >
          <Select.Trigger
            className={cn("w-full", isDisabled && "opacity-70", triggerClassName)}
            isDisabled={isDisabled}
          >
            <Select.Value placeholder={placeholder} />
            <Select.TriggerIndicator />
          </Select.Trigger>
          <Select.Portal>
            <Select.Overlay />
            <Select.Content presentation="popover" width="trigger">
              {selectLabel && <Select.ListLabel>{selectLabel}</Select.ListLabel>}
              {list.map((item) => (
                <Select.Item key={item.value} label={item.label} value={item.value} />
              ))}
            </Select.Content>
          </Select.Portal>
        </Select>
      </View>
    );
  },
);

NSelect.displayName = "NSelect";
