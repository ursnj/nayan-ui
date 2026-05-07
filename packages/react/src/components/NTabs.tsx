import React, { ReactNode, memo, useCallback } from 'react';
import { cn } from '../lib/utils';

export interface NTabsProps {
  isFull?: boolean;
  items: string[];
  children: ReactNode;
  selected: string;
  className?: string;
  itemClassName?: string;
  activeItemClassName?: string;
  onChange: (selected: string) => void;
  ariaLabel?: string;
  id?: string;
}

export const NTabs = memo((props: NTabsProps) => {
  const {
    isFull = false,
    items,
    selected,
    children,
    className = '',
    itemClassName = '',
    activeItemClassName = '',
    onChange,
    ariaLabel,
    id = 'tabs'
  } = props;

  const isActive = useCallback((tab: string) => selected === tab, [selected]);

  return (
    <div className="w-full">
      <div
        id={id}
        role="tablist"
        aria-label={ariaLabel}
        className={cn(
          `nyn-tabs bg-transparent border-0 border-b border-border p-0 rounded-none ${
            isFull ? 'grid grid-flow-col justify-stretch' : 'flex flex-row justify-start'
          }`,
          className
        )}>
        {items.map(item => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={isActive(item)}
            tabIndex={isActive(item) ? 0 : -1}
            onClick={() => onChange(item)}
            className={cn(
              'px-4 py-2 h-full border-0 border-b-4 transition-colors',
              isActive(item) ? `text-primary border-primary ${activeItemClassName}` : `text-text border-transparent ${itemClassName}`
            )}>
            {item}
          </button>
        ))}
      </div>
      {children}
    </div>
  );
});

NTabs.displayName = 'NTabs';
