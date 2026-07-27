import React, { ReactNode, memo, useCallback, useMemo } from 'react';
import type { Selection } from 'react-aria-components';
import { ToggleButton, ToggleButtonGroup } from '@heroui/react';
import { cn } from '../lib/utils';

export interface NButtonGroupProps<T = string> extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  className?: string;
  buttonClassName?: string;
  items: T[];
  selected: T;
  disabled?: boolean;
  onChange: (selected: T) => void;
  getKey?: (item: T, index: number) => React.Key;
  renderItem?: (item: T, index: number) => ReactNode;
  ariaLabel?: string;
  size?: 'sm' | 'md' | 'lg';
}

function NButtonGroupComponent<T = string>({
  className = '',
  buttonClassName = '',
  items,
  selected,
  disabled = false,
  onChange,
  getKey,
  renderItem,
  ariaLabel = 'Options',
  size = 'md',
  ...rest
}: NButtonGroupProps<T>) {
  const itemKeys = useMemo(
    () => items.map((item, index) => String(getKey ? getKey(item, index) : typeof item === 'string' || typeof item === 'number' ? item : index)),
    [getKey, items]
  );
  const selectedIndex = items.findIndex(item => Object.is(item, selected));
  const selectedKey =
    selectedIndex >= 0
      ? itemKeys[selectedIndex]
      : getKey
        ? String(getKey(selected, -1))
        : typeof selected === 'string' || typeof selected === 'number'
          ? String(selected)
          : undefined;
  const selectedKeys = useMemo(() => new Set(selectedKey === undefined ? [] : [selectedKey]), [selectedKey]);

  const handleSelectionChange = useCallback(
    (keys: Selection) => {
      if (keys === 'all') return;
      const selectedKey = [...keys][0] as string;
      if (selectedKey !== undefined) {
        const item = items[itemKeys.indexOf(selectedKey)];
        if (item !== undefined) onChange(item);
      }
    },
    [itemKeys, items, onChange]
  );

  return (
    <ToggleButtonGroup
      selectionMode="single"
      selectedKeys={selectedKeys}
      onSelectionChange={handleSelectionChange}
      isDisabled={disabled}
      size={size}
      className={cn('nyn-button-group', className)}
      aria-label={ariaLabel}
      {...(rest as any)}>
      {items.map((item, idx) => {
        const key = itemKeys[idx];
        return (
          <ToggleButton key={key} id={key} className={cn('nyn-button-group-item', buttonClassName)}>
            {renderItem ? renderItem(item, idx) : String(item)}
          </ToggleButton>
        );
      })}
    </ToggleButtonGroup>
  );
}

export const NButtonGroup = memo(NButtonGroupComponent) as typeof NButtonGroupComponent;
