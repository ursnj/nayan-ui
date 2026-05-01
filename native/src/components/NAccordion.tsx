import React, { useMemo } from 'react';
import { Accordion } from 'heroui-native';
import { NText } from './NText';
import { cn } from '../lib/utils';

export interface AccordionItemData {
  id?: string;
  title: string;
  content: string;
  disabled?: boolean;
}

export interface NAccordionProps {
  items: AccordionItemData[];
  multiple?: boolean;
  defaultValue?: string[];
  className?: string;
  itemClassName?: string;
  titleClassName?: string;
  contentClassName?: string;
}

export const NAccordion = React.memo<NAccordionProps>(
  ({ items, multiple = false, defaultValue, className, itemClassName, titleClassName, contentClassName }) => {
    const processedItems = useMemo(
      () =>
        items.map((item, index) => ({
          ...item,
          id: item.id || `item-${index}`,
        })),
      [items]
    );

    return (
      <Accordion
        className={cn('w-full', className)}
        selectionMode={multiple ? 'multiple' : 'single'}
        defaultValue={multiple ? defaultValue || [] : defaultValue?.[0]}>
        {processedItems.map((item) => (
          <Accordion.Item key={item.id} value={item.id} isDisabled={item.disabled} className={itemClassName}>
            <Accordion.Trigger className="px-4 py-3">
              <NText className={cn('text-lg font-medium', titleClassName)}>{item.title}</NText>
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
