import React, { useMemo } from 'react';
import { NText } from '@/components/NText';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
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
          id: item.id || `item-${index}`
        })),
      [items]
    );

    const accordionProps = useMemo(
      () => ({
        className: cn('w-full', className),
        ...(multiple
          ? {
              type: 'multiple' as const,
              defaultValue: defaultValue || []
            }
          : {
              type: 'single' as const,
              collapsible: true,
              defaultValue: defaultValue?.[0]
            })
      }),
      [multiple, defaultValue, className]
    );

    return (
      <Accordion {...accordionProps}>
        {processedItems.map(item => (
          <AccordionItem key={item.id} value={item.id} disabled={item.disabled} className={itemClassName}>
            <AccordionTrigger className="px-4 py-3">
              <NText className={cn('text-lg font-medium', titleClassName)}>{item.title}</NText>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-3">
              <NText className={cn('text-muted', contentClassName)}>{item.content}</NText>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    );
  }
);

NAccordion.displayName = 'NAccordion';
