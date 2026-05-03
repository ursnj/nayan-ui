import React, { useCallback, useState } from 'react';
import { Tabs, type TabsProps } from 'heroui-native';
import { cn } from '../helpers/utils';
import { NText } from './NText';

export interface TabItem {
  label: string;
  value: string;
  isDisabled?: boolean;
  content?: React.ReactNode;
}

export interface NTabsProps extends Omit<TabsProps, 'children' | 'value' | 'onValueChange'> {
  items: TabItem[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  listClassName?: string;
  triggerClassName?: string;
  contentClassName?: string;
}

export const NTabs = React.memo<NTabsProps>(
  ({ items, value, defaultValue, onValueChange, className, listClassName, triggerClassName, contentClassName, ...props }) => {
    const [internalValue, setInternalValue] = useState(defaultValue || items[0]?.value || '');
    const activeValue = value ?? internalValue;

    const handleChange = useCallback(
      (v: string) => {
        if (value === undefined) setInternalValue(v);
        onValueChange?.(v);
      },
      [value, onValueChange]
    );

    return (
      <Tabs className={cn('w-full', className)} value={activeValue} onValueChange={handleChange} {...props}>
        <Tabs.List className={cn(listClassName)}>
          {items.map(item => (
            <Tabs.Trigger key={item.value} value={item.value} isDisabled={item.isDisabled} className={cn(triggerClassName)}>
              <Tabs.Label>{item.label}</Tabs.Label>
            </Tabs.Trigger>
          ))}
          <Tabs.Indicator />
        </Tabs.List>
        {items.map(item => (
          <Tabs.Content key={item.value} value={item.value} className={cn('mt-3', contentClassName)}>
            {typeof item.content === 'string' ? <NText>{item.content}</NText> : item.content}
          </Tabs.Content>
        ))}
      </Tabs>
    );
  }
);

NTabs.displayName = 'NTabs';
