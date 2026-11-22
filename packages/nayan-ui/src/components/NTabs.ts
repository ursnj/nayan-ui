'use client';

import { Children, createElement, isValidElement, type ReactNode } from 'react';
import { component } from './component';
import { NTabsContent } from './NTabsContent';
import type { ComponentControlProps, ComponentOption } from './types';

export interface NTabsItem extends ComponentOption {
  /** Panel content for this item. An explicit NTabsContent with the same item takes precedence. */
  content?: ReactNode;
}

export interface NTabsProps extends Omit<ComponentControlProps<string>, 'items' | 'options' | 'variant'> {
  items?: readonly (string | NTabsItem)[];
  options?: readonly (string | NTabsItem)[];
  /** Fill the available width of a horizontal tab list. */
  isFull?: boolean;
  /** Primary uses a rounded track. Secondary marks the active tab with an underline. */
  variant?: 'primary' | 'secondary';
  listClassName?: string;
  tabClassName?: string;
  /** Alias for tabClassName. */
  itemClassName?: string;
  /** Alias for tabClassName. */
  triggerClassName?: string;
  activeItemClassName?: string;
  contentClassName?: string;
}

const Tabs = /* @__PURE__ */ component<NTabsProps>('NTabs');

export function NTabs({ items, options, children, ...props }: NTabsProps) {
  const choices = options ?? items;
  if (!choices?.some((item) => typeof item !== 'string' && item.content != null)) {
    return createElement(Tabs, { ...props, items: choices }, children);
  }
  const explicitPanels = new Set(
    Children.toArray(children).flatMap((child) => (isValidElement<{ item?: string }>(child) && child.props.item ? [child.props.item] : []))
  );
  const panels: ReactNode[] = [];
  const triggers = choices.map((item) => {
    if (typeof item === 'string') return item;
    const { content, ...trigger } = item;
    if (content != null && !explicitPanels.has(item.value)) {
      panels.push(createElement(NTabsContent, { item: item.value, key: item.value }, content));
    }
    return trigger;
  });
  return createElement(Tabs, { ...props, items: triggers }, children, ...panels);
}
