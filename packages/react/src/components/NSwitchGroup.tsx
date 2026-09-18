import React, { memo, useId } from 'react';
import { Label, Switch, SwitchGroup } from '@heroui/react';
import { cn } from '../lib/utils';

export interface NSwitchGroupItem {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface NSwitchGroupProps {
  items: NSwitchGroupItem[];
  /** The values currently switched on. */
  value: string[];
  onChange: (selected: string[]) => void;
  orientation?: 'horizontal' | 'vertical';
  label?: string;
  showLabel?: boolean;
  disabled?: boolean;
  id?: string;
  className?: string;
  labelClassName?: string;
  itemClassName?: string;
  switchClassName?: string;
}

const NSwitchGroupComponent: React.FC<NSwitchGroupProps> = memo(
  ({
    items,
    value,
    onChange,
    orientation = 'vertical',
    label,
    showLabel = true,
    disabled = false,
    id,
    className = '',
    labelClassName = '',
    itemClassName = '',
    switchClassName = ''
  }) => {
    const generatedId = useId();
    const groupId = id || `nyn-switch-group-${generatedId}`;

    const toggle = (item: NSwitchGroupItem, on: boolean) => {
      onChange(on ? [...value.filter(v => v !== item.value), item.value] : value.filter(v => v !== item.value));
    };

    return (
      <div className={cn('nyn-switch-group-block mb-3', className)}>
        {label && showLabel && (
          <Label htmlFor={groupId} className={cn(labelClassName)}>
            {label}
          </Label>
        )}
        <SwitchGroup
          id={groupId}
          orientation={orientation}
          aria-label={label}
          className={cn('nyn-switch-group', orientation === 'horizontal' ? 'flex flex-row flex-wrap gap-4' : 'flex flex-col gap-2')}>
          {items.map(item => {
            const itemId = `${groupId}-${item.value}`;
            return (
              <Switch
                key={item.value}
                id={itemId}
                isSelected={value.includes(item.value)}
                isDisabled={disabled || item.disabled}
                onChange={on => toggle(item, on)}
                className={cn('nyn-switch flex items-center justify-between gap-3', itemClassName, switchClassName)}>
                <Switch.Content className="flex w-full items-center justify-between gap-3">
                  <Label>{item.label}</Label>
                  <Switch.Control>
                    <Switch.Thumb />
                  </Switch.Control>
                </Switch.Content>
              </Switch>
            );
          })}
        </SwitchGroup>
      </div>
    );
  }
);

NSwitchGroupComponent.displayName = 'NSwitchGroup';

export const NSwitchGroup = NSwitchGroupComponent;
