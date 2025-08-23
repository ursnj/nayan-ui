import React, { memo } from 'react';
import { cn } from '../lib/utils';
import { AccordionListItem, AccordionTypes } from './Types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from './ui/accordion';

export interface NAccordionProps<T = AccordionListItem> {
  className?: string;
  itemClassName?: string;
  triggerClassName?: string;
  contentClassName?: string;
  type?: AccordionTypes;
  items: { id?: string; title: string; message: string }[];
}

function NAccordionComponent<T = AccordionListItem>({
  type = AccordionTypes.SINGLE,
  items,
  className = '',
  itemClassName = '',
  triggerClassName = '',
  contentClassName = ''
}: NAccordionProps<T>) {
  return (
    <Accordion type={type} className={cn('w-full', className)}>
      {items.map((item, index) => {
        const key = item.id || `item-${index}`;
        return (
          <AccordionItem
            key={key}
            value={`item-${key}`}
            className={cn('nyn-accordion border border-border px-3 bg-card rounded mb-2.5', itemClassName)}>
            <AccordionTrigger className={cn('nyn-accordion-title text-text hover:no-underline', triggerClassName)}>{item.title}</AccordionTrigger>
            <AccordionContent className={cn('nyn-accordion-message text-text', contentClassName)}>{item.message}</AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}

export const NAccordion = memo(NAccordionComponent) as typeof NAccordionComponent;
