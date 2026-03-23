import React, { useMemo } from 'react';
import { Text } from 'react-native';
import { Accordion } from 'heroui-native';
import { cn } from '@/lib/utils';

export interface AccordionItemData {
  id?: string;
  title: string;
  content: string;
  disabled?: boolean;
}

export interface NAccordionProps {
  items: AccordionItemData[];
  multiple?: boolean;
  defaultExpandedKeys?: string[];
  className?: string;
  itemClassName?: string;
  titleClassName?: string;
  contentClassName?: string;
}

export const NAccordion = React.memo<NAccordionProps>(
  ({ items, multiple = false, defaultExpandedKeys, className, itemClassName, titleClassName, contentClassName }) => {
    const processedItems = useMemo(
      () =>
        items.map((item, index) => ({
          ...item,
          id: item.id || `item-${index}`
        })),
      [items]
    );

    return (
      <Accordion selectionMode={multiple ? 'multiple' : 'single'} defaultExpandedKeys={defaultExpandedKeys} className={cn('w-full', className)}>
        {processedItems.map(item => (
          <Accordion.Item key={item.id} id={item.id} isDisabled={item.disabled} className={cn(itemClassName)}>
            <Accordion.Trigger className="px-4 py-3">
              <Text className={cn('text-lg font-medium text-foreground', titleClassName)}>{item.title}</Text>
              <Accordion.Indicator />
            </Accordion.Trigger>
            <Accordion.Content className="px-4 pb-3">
              <Text className={cn('text-muted', contentClassName)}>{item.content}</Text>
            </Accordion.Content>
          </Accordion.Item>
        ))}
      </Accordion>
    );
  }
);

NAccordion.displayName = 'NAccordion';
