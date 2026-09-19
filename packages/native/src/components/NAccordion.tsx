import React, { useMemo } from "react";
import { Accordion, cn } from "heroui-native";
import { NText } from "./NText";

export interface AccordionItemData {
  id?: string;
  title: string;
  content: string;
  isDisabled?: boolean;
}

export interface NAccordionProps {
  items: AccordionItemData[];
  selectionMode?: "single" | "multiple";
  /** Alias of `selectionMode`; the React package calls it `type`. */
  type?: "single" | "multiple";
  defaultValue?: string | string[];
  variant?: "default" | "surface";
  hideSeparator?: boolean;
  isCollapsible?: boolean;
  isDisabled?: boolean;
  /** Alias of `isDisabled`. */
  disabled?: boolean;
  className?: string;
  itemClassName?: string;
  titleClassName?: string;
  contentClassName?: string;
}

export const NAccordion = React.memo<NAccordionProps>(
  ({
    items,
    selectionMode,
    type,
    defaultValue,
    variant,
    hideSeparator,
    isCollapsible,
    isDisabled,
    disabled,
    className,
    itemClassName,
    titleClassName,
    contentClassName,
  }) => {
    const mode = selectionMode ?? type ?? "single";
    const off = disabled ?? isDisabled;

    const processedItems = useMemo(
      () =>
        items.map((item, index) => ({
          ...item,
          id: item.id || `item-${index}`,
        })),
      [items],
    );

    return (
      <Accordion
        className={cn("w-full", className)}
        selectionMode={mode}
        defaultValue={defaultValue}
        variant={variant}
        hideSeparator={hideSeparator}
        isCollapsible={isCollapsible}
        isDisabled={off}
      >
        {processedItems.map((item) => (
          <Accordion.Item
            key={item.id}
            value={item.id}
            isDisabled={item.isDisabled}
            className={itemClassName}
          >
            <Accordion.Trigger className="px-4 py-3">
              <NText className={cn("text-lg font-medium", titleClassName)}>{item.title}</NText>
              <Accordion.Indicator />
            </Accordion.Trigger>
            <Accordion.Content className="px-4 pb-3">
              <NText className={cn("text-muted", contentClassName)}>{item.content}</NText>
            </Accordion.Content>
          </Accordion.Item>
        ))}
      </Accordion>
    );
  },
);

NAccordion.displayName = "NAccordion";
