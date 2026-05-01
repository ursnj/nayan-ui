import React from 'react';
import { Tabs, type TabsProps } from 'heroui-native';
import { NText } from './NText';
import { cn } from '../lib/utils';

export interface TabItem {
  label: string;
  value: string;
  isDisabled?: boolean;
  content?: React.ReactNode;
}

export interface NTabsProps extends Omit<TabsProps, 'children'> {
  items: TabItem[];
  listClassName?: string;
  triggerClassName?: string;
  contentClassName?: string;
}

export const NTabs = React.memo<NTabsProps>(
  ({ items, className, listClassName, triggerClassName, contentClassName, ...props }) => {
    return (
      <Tabs className={cn('w-full', className)} {...props}>
        <Tabs.List className={cn(listClassName)}>
          {items.map((item) => (
            <Tabs.Trigger key={item.value} value={item.value} isDisabled={item.isDisabled} className={cn(triggerClassName)}>
              <Tabs.Label>{item.label}</Tabs.Label>
            </Tabs.Trigger>
          ))}
          <Tabs.Indicator />
        </Tabs.List>
        {items.map((item) => (
          <Tabs.Content key={item.value} value={item.value} className={cn('mt-3', contentClassName)}>
            {typeof item.content === 'string' ? <NText>{item.content}</NText> : item.content}
          </Tabs.Content>
        ))}
      </Tabs>
    );
  }
);

NTabs.displayName = 'NTabs';
