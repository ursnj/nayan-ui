import React from "react";
import { View } from "react-native";
import { Checkbox, type CheckboxProps, Label, cn } from "heroui-native";

export interface NCheckProps extends Omit<CheckboxProps, "children"> {
  label?: string;
  /** Alias of `label`, so the same markup works against the React package. */
  children?: React.ReactNode;
  /** Alias of `isSelected`. */
  checked?: boolean;
  /** Alias of `onSelectedChange`. */
  onChange?: (checked: boolean) => void;
  /** Alias of `isDisabled`. */
  disabled?: boolean;
  containerClassName?: string;
  labelClassName?: string;
}

export const NCheck = React.memo<NCheckProps>(
  ({
    label,
    children,
    checked,
    onChange,
    disabled,
    isSelected,
    isDisabled,
    onSelectedChange,
    containerClassName,
    labelClassName,
    ...props
  }) => {
    const text = label ?? children;
    const selected = checked ?? isSelected ?? false;
    const off = disabled ?? isDisabled ?? false;
    const change = onChange ?? onSelectedChange;
    return (
      <View className={cn("flex-row items-center gap-2 mb-3", containerClassName)}>
        <Checkbox isSelected={selected} isDisabled={off} onSelectedChange={change} {...props} />
        {text && (
          <Label
            isDisabled={off}
            className={cn("pl-3 text-foreground text-base", off && "opacity-70", labelClassName)}
            nativeID={typeof text === "string" ? "check-" + text : undefined}
            onPress={() => !off && change?.(!selected)}
          >
            {text}
          </Label>
        )}
      </View>
    );
  },
);

NCheck.displayName = "NCheck";
