import React, { memo, useCallback } from 'react';
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
  ariaLabel,
  size = 'md',
  ...rest
}: NButtonGroupProps<T>) {
  const selectedKeys = new Set([String(selected)]);

  const handleSelectionChange = useCallback(
    (keys: Selection) => {
      if (keys === 'all') return;
      const selectedKey = [...keys][0] as string;
      if (selectedKey !== undefined) {
        const item = items.find(i => String(i) === selectedKey);
        if (item !== undefined) onChange(item);
      }
    },
    [items, onChange]
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
        const key = String(typeof item === 'string' ? item : idx);
        return (
          <ToggleButton key={key} id={key} className={cn('nyn-button-group-item', buttonClassName)}>
            {String(item)}
          </ToggleButton>
        );
      })}
    </ToggleButtonGroup>
  );
}

export const NButtonGroup = memo(NButtonGroupComponent) as typeof NButtonGroupComponent;
