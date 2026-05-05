import React, { useMemo } from 'react';
import { Accordion, cn } from 'heroui-native';
import { NText } from './NText';

export interface AccordionItemData {
  id?: string;
  title: string;
  content: string;
  isDisabled?: boolean;
}

export interface NAccordionProps {
  items: AccordionItemData[];
  selectionMode?: 'single' | 'multiple';
  defaultValue?: string | string[];
  variant?: 'default' | 'surface';
  hideSeparator?: boolean;
  isCollapsible?: boolean;
  isDisabled?: boolean;
  className?: string;
  itemClassName?: string;
  titleClassName?: string;
  contentClassName?: string;
}

export const NAccordion = React.memo<NAccordionProps>(
  ({
    items,
    selectionMode = 'single',
    defaultValue,
    variant,
    hideSeparator,
    isCollapsible,
    isDisabled,
    className,
    itemClassName,
    titleClassName,
    contentClassName
  }) => {
    const processedItems = useMemo(
      () =>
        items.map((item, index) => ({
          ...item,
          id: item.id || `item-${index}`
        })),
      [items]
    );

    return (
      <Accordion
        className={cn('w-full', className)}
        selectionMode={selectionMode}
        defaultValue={defaultValue}
        variant={variant}
        hideSeparator={hideSeparator}
        isCollapsible={isCollapsible}
        isDisabled={isDisabled}>
        {processedItems.map(item => (
          <Accordion.Item key={item.id} value={item.id} isDisabled={item.isDisabled} className={itemClassName}>
            <Accordion.Trigger className="px-4 py-3">
              <NText className={cn('text-lg font-medium', titleClassName)}>{item.title}</NText>
              <Accordion.Indicator />
            </Accordion.Trigger>
            <Accordion.Content className="px-4 pb-3">
              <NText className={cn('text-muted', contentClassName)}>{item.content}</NText>
            </Accordion.Content>
          </Accordion.Item>
        ))}
      </Accordion>
    );
  }
);

NAccordion.displayName = 'NAccordion';
