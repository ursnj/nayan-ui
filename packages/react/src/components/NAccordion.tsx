import React, { memo } from 'react';
import { Accordion } from '@heroui/react';
import { cn } from '../lib/utils';
import { AccordionListItem, AccordionTypes } from './Types';

export interface NAccordionProps<T = AccordionListItem> {
  className?: string;
  itemClassName?: string;
  triggerClassName?: string;
  contentClassName?: string;
  indicatorClassName?: string;
  type?: AccordionTypes;
  items: { id?: string; title: string; message: string }[];
}

function NAccordionComponent<T = AccordionListItem>({
  type = AccordionTypes.SINGLE,
  items,
  className = '',
  itemClassName = '',
  triggerClassName = '',
  contentClassName = '',
  indicatorClassName = ''
}: NAccordionProps<T>) {
  return (
    <Accordion allowsMultipleExpanded={type === AccordionTypes.MULTIPLE} className={cn('w-full', className)}>
      {items.map((item, index) => {
        const key = item.id || `item-${index}`;
        return (
          <Accordion.Item key={key} id={key} className={cn('nyn-accordion border border-default bg-surface rounded mb-2.5', itemClassName)}>
            <Accordion.Heading>
              <Accordion.Trigger
                className={cn(
                  'nyn-accordion-title w-full flex items-center justify-between text-foreground text-left px-3 py-2.5 cursor-pointer',
                  triggerClassName
                )}>
                <span className="flex-1">{item.title}</span>
                <Accordion.Indicator className={cn('njn-accordion-icon text-muted transition-transform duration-200', indicatorClassName)} />
              </Accordion.Trigger>
            </Accordion.Heading>
            <Accordion.Panel className={cn('nyn-accordion-message text-foreground px-3 pb-3', contentClassName)}>{item.message}</Accordion.Panel>
          </Accordion.Item>
        );
      })}
    </Accordion>
  );
}

export const NAccordion = memo(NAccordionComponent) as typeof NAccordionComponent;
