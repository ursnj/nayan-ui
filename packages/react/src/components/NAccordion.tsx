import React, { memo } from 'react';
import { Accordion } from '@heroui/react';
import { cn } from '../lib/utils';
import { AccordionListItem, AccordionTypes } from './Types';

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
    <Accordion allowsMultipleExpanded={type === AccordionTypes.MULTIPLE} className={cn('w-full', className)}>
      {items.map((item, index) => {
        const key = item.id || `item-${index}`;
        return (
          <Accordion.Item key={key} id={key} className={cn('nyn-accordion border border-default px-3 bg-surface rounded mb-2.5', itemClassName)}>
            <Accordion.Trigger className={cn('nyn-accordion-title text-foreground', triggerClassName)}>{item.title}</Accordion.Trigger>
            <Accordion.Panel className={cn('nyn-accordion-message text-foreground', contentClassName)}>{item.message}</Accordion.Panel>
          </Accordion.Item>
        );
      })}
    </Accordion>
  );
}

export const NAccordion = memo(NAccordionComponent) as typeof NAccordionComponent;
