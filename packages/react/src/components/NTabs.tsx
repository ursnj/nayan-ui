import React, { Key, ReactNode, memo } from 'react';
import { Tabs } from '@heroui/react';
import { cn } from '../lib/utils';

export interface NTabsProps {
  items: string[];
  children: ReactNode;
  selected: string;
  className?: string;
  listClassName?: string;
  tabClassName?: string;
  variant?: 'primary' | 'secondary';
  orientation?: 'horizontal' | 'vertical';
  onChange: (selected: string) => void;
  ariaLabel?: string;
}

export const NTabs = memo((props: NTabsProps) => {
  const {
    items,
    selected,
    children,
    className = '',
    listClassName = '',
    tabClassName = '',
    variant = 'primary',
    orientation = 'horizontal',
    onChange,
    ariaLabel
  } = props;

  const handleSelectionChange = (key: Key) => {
    onChange(String(key));
  };

  return (
    <Tabs
      selectedKey={selected}
      onSelectionChange={handleSelectionChange}
      variant={variant}
      orientation={orientation}
      className={cn('nyn-tabs w-full', className)}>
      <Tabs.ListContainer>
        <Tabs.List aria-label={ariaLabel} className={cn(listClassName)}>
          {items.map(item => (
            <Tabs.Tab key={item} id={item} className={cn(tabClassName)}>
              {item}
            </Tabs.Tab>
          ))}
        </Tabs.List>
      </Tabs.ListContainer>
      {children}
    </Tabs>
  );
});

NTabs.displayName = 'NTabs';
