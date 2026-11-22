'use client';

import { useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { NIcon } from './NIcon';
import { NPress } from './NPress';
import { NText } from './NText';
import { NView } from './NView';

export interface AccordionListItem {
  id?: string;
  title: ReactNode;
  message: ReactNode;
  disabled?: boolean;
}

export interface NAccordionProps<T extends AccordionListItem = AccordionListItem> {
  /** Panels with a title, message, and optional id and disabled flag. */
  items: readonly T[];
  /** How many panels can be open at once. Default: single. */
  type?: 'single' | 'multiple';
  /** Open the first enabled panel initially when expansion is uncontrolled. */
  defaultExpanded?: boolean;
  /** Control whether any panel is open. Opening selects the first enabled panel if no selection is saved. */
  expanded?: boolean;
  /** Called when a user action opens the first panel or closes the last one. */
  onExpandedChange?: (expanded: boolean) => void;
  /** Surface gives each panel its own background and border. Default: default. */
  variant?: 'default' | 'surface';
  className?: string;
  itemClassName?: string;
  triggerClassName?: string;
  contentClassName?: string;
  indicatorClassName?: string;
}

export function NAccordion<T extends AccordionListItem>({
  items,
  type = 'single',
  defaultExpanded = false,
  expanded,
  onExpandedChange,
  variant = 'default',
  className = '',
  itemClassName = '',
  triggerClassName = '',
  contentClassName = '',
  indicatorClassName = ''
}: NAccordionProps<T>) {
  const id = useId();
  const entries = items.map((item, index) => ({ item, key: item.id ? `id:${item.id}` : `index:${index}` }));
  const first = entries.find(({ item }) => !item.disabled)?.key;
  const [selected, setSelected] = useState<string[]>(() => (defaultExpanded && first ? [first] : []));
  const keys = new Set(entries.map(({ key }) => key));
  const available = selected.filter((key) => keys.has(key));
  const open = expanded === false ? [] : expanded === true && !available.length && first ? [first] : available;
  const openItems = type === 'single' ? open.slice(-1) : open;
  const currentOpenItems = useRef(openItems);
  useLayoutEffect(() => {
    currentOpenItems.current = openItems;
  }, [openItems]);
  const surface = variant === 'surface';
  const container = surface ? 'gap-2' : 'gap-0 overflow-hidden rounded-xl border border-border bg-surface';

  function toggle(key: string) {
    const current = currentOpenItems.current;
    const next = current.includes(key) ? current.filter((item) => item !== key) : type === 'single' ? [key] : [...current, key];
    const isExpanded = next.length > 0;
    if (expanded === undefined || expanded === isExpanded) currentOpenItems.current = next;
    if (expanded === undefined || next.length) setSelected(next);
    if (Boolean(current.length) !== isExpanded) onExpandedChange?.(isExpanded);
  }

  return (
    <NView className={`w-full ${container} ${className}`}>
      {entries.map(({ item: { title, message, disabled }, key }, index) => {
        const panelId = `${id}-panel-${index}`;
        const isOpen = openItems.includes(key);
        const panel = surface ? 'overflow-hidden rounded-xl border border-border bg-surface-secondary' : index > 0 ? 'border-t border-border' : '';
        return (
          <NView key={key} className={`gap-0 ${panel} ${itemClassName}`}>
            <NPress
              className={`flex w-full min-h-12 flex-row items-center justify-between gap-3 px-3.5 py-2.5 hover:bg-surface-secondary focus-visible:outline-2 focus-visible:outline-accent disabled:opacity-50 ${triggerClassName}`}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityState={{ expanded: isOpen, disabled }}
              aria-controls={panelId}
              onPress={() => toggle(key)}
            >
              {typeof title === 'string' || typeof title === 'number' ? (
                <NText className="min-w-0 shrink text-sm font-semibold text-foreground">{title}</NText>
              ) : (
                title
              )}
              <NIcon
                name={isOpen ? 'chevron-up' : 'chevron-down'}
                size={16}
                className={`${isOpen ? 'text-accent' : 'text-muted'} ${indicatorClassName}`}
              />
            </NPress>
            <NView id={panelId} className={`gap-0 px-3.5 pb-3.5 ${contentClassName}`} style={isOpen ? undefined : { display: 'none' }}>
              {isOpen &&
                (typeof message === 'string' || typeof message === 'number' ? <NText className="text-sm text-muted">{message}</NText> : message)}
            </NView>
          </NView>
        );
      })}
    </NView>
  );
}
