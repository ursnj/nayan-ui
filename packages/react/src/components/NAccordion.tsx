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
  variant?: 'default' | 'surface';
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
  indicatorClassName = '',
  variant = 'default'
}: NAccordionProps<T>) {
  return (
    <Accordion allowsMultipleExpanded={type === AccordionTypes.MULTIPLE} variant={variant} className={cn('w-full', className)}>
      {items.map((item, index) => {
        const key = item.id || `item-${index}`;
        return (
          <Accordion.Item key={key} id={key} className={cn(itemClassName)}>
            <Accordion.Heading>
              <Accordion.Trigger className={cn(triggerClassName)}>
                {item.title}
                <Accordion.Indicator className={cn(indicatorClassName)} />
              </Accordion.Trigger>
            </Accordion.Heading>
            <Accordion.Panel className={cn(contentClassName)}>
              <Accordion.Body>{item.message}</Accordion.Body>
            </Accordion.Panel>
          </Accordion.Item>
        );
      })}
    </Accordion>
  );
}

export const NAccordion = memo(NAccordionComponent) as typeof NAccordionComponent;
