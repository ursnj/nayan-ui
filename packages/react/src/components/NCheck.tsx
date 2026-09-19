import React, { ReactNode, memo } from "react";
import { Checkbox } from "@heroui/react";
import { cn } from "../lib/utils";

export interface NCheckProps {
  id?: string;
  name?: string;
  value?: string;
  className?: string;
  checkClassName?: string;
  labelClassName?: string;
  disabled?: boolean;
  isRequired?: boolean;
  isIndeterminate?: boolean;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children?: ReactNode;
  /** Alias of `children`, as the React Native package names it. */
  label?: ReactNode;
  "aria-label"?: string;
}

const NCheckComponent: React.FC<NCheckProps> = memo(
  ({
    id,
    name,
    value,
    className = "",
    checkClassName = "",
    labelClassName = "",
    checked,
    disabled = false,
    isRequired = false,
    isIndeterminate = false,
    onChange,
    children,
    label,
    ...rest
  }) => {
    return (
      <Checkbox
        id={id}
        name={name}
        value={value}
        isSelected={checked}
        isDisabled={disabled}
        isRequired={isRequired}
        isIndeterminate={isIndeterminate}
        onChange={onChange}
        className={cn("nyn-check", className)}
        {...(rest as any)}
      >
        <Checkbox.Content className={cn(labelClassName)}>
          <Checkbox.Control className={cn(checkClassName)}>
            <Checkbox.Indicator />
          </Checkbox.Control>
          {children ?? label}
        </Checkbox.Content>
      </Checkbox>
    );
  },
);

NCheckComponent.displayName = "NCheck";

export const NCheck = NCheckComponent;
