import React, { useCallback, useState } from "react";
import { Tabs, type TabsProps, cn } from "heroui-native";
import { NText } from "./NText";

export interface TabItem {
  label: string;
  value: string;
  isDisabled?: boolean;
  content?: React.ReactNode;
}

export interface NTabsProps extends Omit<TabsProps, "children" | "value" | "onValueChange"> {
  items: TabItem[];
  value?: string;
  /** Alias of `value`, as the React package names it. */
  selected?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  /** Alias of `onValueChange`. */
  onChange?: (value: string) => void;
  listClassName?: string;
  triggerClassName?: string;
  contentClassName?: string;
}

export const NTabs = React.memo<NTabsProps>(
  ({
    items,
    value,
    selected,
    defaultValue,
    onValueChange,
    onChange,
    className,
    listClassName,
    triggerClassName,
    contentClassName,
    ...props
  }) => {
    const controlled = value ?? selected;
    const change = onValueChange ?? onChange;
    const [internalValue, setInternalValue] = useState(defaultValue || items[0]?.value || "");
    const activeValue = controlled ?? internalValue;

    const handleChange = useCallback(
      (v: string) => {
        if (controlled === undefined) setInternalValue(v);
        change?.(v);
      },
      [controlled, change],
    );

    return (
      <Tabs
        className={cn("w-full", className)}
        value={activeValue}
        onValueChange={handleChange}
        {...props}
      >
        <Tabs.List className={cn(listClassName)}>
          <Tabs.Indicator />
          {items.map((item) => (
            <Tabs.Trigger
              key={item.value}
              value={item.value}
              isDisabled={item.isDisabled}
              className={cn(triggerClassName)}
            >
              <Tabs.Label>{item.label}</Tabs.Label>
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        {items.map((item) => (
          <Tabs.Content
            key={item.value}
            value={item.value}
            className={cn("mt-3", contentClassName)}
          >
            {typeof item.content === "string" ? <NText>{item.content}</NText> : item.content}
          </Tabs.Content>
        ))}
      </Tabs>
    );
  },
);

NTabs.displayName = "NTabs";
