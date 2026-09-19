import React, { memo, useId } from "react";
import { Checkbox, CheckboxGroup, Label } from "@heroui/react";
import { cn } from "../lib/utils";

export interface NCheckGroupItem {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface NCheckGroupProps {
  items: NCheckGroupItem[];
  value: string[];
  onChange: (selected: string[]) => void;
  orientation?: "horizontal" | "vertical";
  label?: string;
  showLabel?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
  labelClassName?: string;
  itemClassName?: string;
}

const NCheckGroupComponent: React.FC<NCheckGroupProps> = memo(
  ({
    items,
    value,
    onChange,
    orientation = "vertical",
    label,
    showLabel = true,
    disabled = false,
    id,
    className = "",
    labelClassName = "",
    itemClassName = "",
  }) => {
    const generatedId = useId();
    const groupId = id || `nyn-check-group-${generatedId}`;

    return (
      <div className={cn("nyn-check-group-block mb-3", className)}>
        {label && showLabel && (
          <Label htmlFor={groupId} className={cn(labelClassName)}>
            {label}
          </Label>
        )}
        <CheckboxGroup
          id={groupId}
          value={value}
          isDisabled={disabled}
          onChange={onChange}
          aria-label={label}
          className={cn(
            "nyn-check-group",
            orientation === "horizontal" ? "flex flex-row flex-wrap gap-4" : "flex flex-col gap-2",
          )}
        >
          {items.map((item) => (
            <Checkbox
              key={item.value}
              value={item.value}
              isDisabled={item.disabled}
              className={cn(itemClassName)}
            >
              <Checkbox.Content>
                <Checkbox.Control>
                  <Checkbox.Indicator />
                </Checkbox.Control>
                <Label>{item.label}</Label>
              </Checkbox.Content>
            </Checkbox>
          ))}
        </CheckboxGroup>
      </div>
    );
  },
);

NCheckGroupComponent.displayName = "NCheckGroup";

export const NCheckGroup = NCheckGroupComponent;
