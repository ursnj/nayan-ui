import React, { useId } from "react";
import { Switch } from "@heroui/react";
import { cn } from "../lib/utils";

export interface NSwitchProps {
  enabled?: boolean;
  /** Alias of `enabled`, as the React Native package names it. */
  checked?: boolean;
  defaultChecked?: boolean;
  label?: React.ReactNode;
  className?: string;
  labelClassName?: string;
  switchClassName?: string;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  id?: string;
}

export const NSwitch: React.FC<NSwitchProps> = React.memo(
  ({
    label,
    enabled,
    checked,
    defaultChecked,
    disabled = false,
    onChange,
    className = "",
    switchClassName = "",
    labelClassName = "",
    id,
  }) => {
    const generatedId = useId();
    const switchId = id || `nyn-switch-${generatedId}`;
    const selected = checked ?? enabled;

    return (
      <Switch
        id={switchId}
        {...(selected !== undefined ? { isSelected: selected } : {})}
        defaultSelected={defaultChecked}
        isDisabled={disabled}
        onChange={onChange}
        className={cn("nyn-switch", className, switchClassName)}
      >
        <Switch.Content className="flex w-full items-center justify-between gap-3">
          {label && <span className={cn("text-sm font-medium", labelClassName)}>{label}</span>}
          <Switch.Control>
            <Switch.Thumb />
          </Switch.Control>
        </Switch.Content>
      </Switch>
    );
  },
);

NSwitch.displayName = "NSwitch";
