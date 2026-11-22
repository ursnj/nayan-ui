'use client';

import { useState, type Key, type ReactNode } from 'react';
import { NPress } from './NPress';
import { NText } from './NText';
import { NView } from './NView';
import type { ComponentControlProps, ComponentOption } from './types';

type Selection<T> = T extends ComponentOption ? T['value'] : T;

export interface NButtonGroupProps<T = string> extends Omit<ComponentControlProps<Selection<T>>, 'items' | 'options' | 'value' | 'selected'> {
  /** Plain labels, item objects, or options with a string value. */
  items?: readonly T[];
  /** Alias for items. */
  options?: readonly T[];
  /** The controlled selection. Option objects can be selected by value. */
  selected?: T | Selection<T>;
  /** Alias for selected. */
  value?: T | Selection<T>;
  /** Utility classes for each segment. */
  buttonClassName?: string;
  /** Stable key for custom items. */
  keyExtractor?: (item: T, index: number) => Key;
  /** Alias for keyExtractor. */
  getKey?: (item: T, index: number) => Key;
  /** Render the contents of a segment. */
  renderButton?: (item: T, selected: boolean, index: number) => ReactNode;
  /** Render segment contents without using the selected state. */
  renderItem?: (item: T, index: number) => ReactNode;
}

const sizes = {
  sm: { padding: 'px-2 py-1.5', text: 'text-xs' },
  md: { padding: 'px-3 py-2.5', text: 'text-sm' },
  lg: { padding: 'px-4 py-3', text: 'text-base' }
};

function option(item: unknown): item is ComponentOption {
  return (
    typeof item === 'object' &&
    item !== null &&
    'label' in item &&
    typeof item.label === 'string' &&
    'value' in item &&
    typeof item.value === 'string'
  );
}

export function NButtonGroup<T = string>({
  items,
  options,
  selected,
  value,
  defaultValue,
  onChange,
  onValueChange,
  disabled,
  isDisabled,
  className = '',
  buttonClassName = '',
  keyExtractor,
  getKey,
  renderButton,
  renderItem,
  label,
  labelClassName,
  ariaLabel,
  accessibilityLabel,
  size,
  ...props
}: NButtonGroupProps<T>) {
  const [uncontrolled, setUncontrolled] = useState(() => defaultValue);
  const controlled = value ?? selected;
  const current = controlled ?? uncontrolled;
  const choices = options ?? items ?? [];
  const blocked = disabled || isDisabled;
  const keyFor = keyExtractor ?? getKey;
  const scale = size === 'sm' || size === 'lg' ? sizes[size] : sizes.md;
  const currentValue = option(current) ? current.value : current;
  const selectedIndex = choices.findIndex((item) => Object.is(currentValue, option(item) ? item.value : item));
  const selectedKey = selectedIndex < 0 && keyFor && typeof current === 'object' && current !== null ? keyFor(current as T, -1) : undefined;

  if (!choices.length) return null;
  return (
    <NView className="w-full gap-2">
      {label && <NText className={`text-sm font-medium ${labelClassName ?? ''}`}>{label}</NText>}
      <NView
        {...props}
        role="group"
        accessibilityLabel={accessibilityLabel ?? props['aria-label'] ?? ariaLabel ?? label ?? 'Options'}
        className={`flex min-w-0 flex-row items-stretch gap-0 rounded-full bg-default ${className}`}
      >
        {choices.map((item, index) => {
          const entry = option(item) ? item : undefined;
          const selection = (entry ? entry.value : item) as Selection<T>;
          const key = keyFor ? keyFor(item, index) : (entry?.value ?? index);
          const active = selectedIndex === index || (selectedKey !== undefined && selectedKey === key);
          const inactive = !!(blocked || entry?.disabled || entry?.isDisabled);
          const first = index === 0;
          const last = index === choices.length - 1;
          const edge = `${first ? 'rounded-l-full' : ''} ${last ? 'rounded-r-full' : ''}`;
          const content = renderButton ? renderButton(item, active, index) : renderItem ? renderItem(item, index) : (entry?.label ?? String(item));

          return (
            <NPress
              key={key}
              type="button"
              disabled={inactive}
              aria-pressed={active}
              accessibilityState={{ selected: active, disabled: inactive }}
              className={`flex min-w-0 flex-1 flex-row items-center justify-center rounded-none ${edge} ${scale.padding} ${scale.text} font-medium disabled:opacity-50 ${active ? 'bg-accent/15 text-accent' : 'text-foreground hover:bg-surface-secondary'} ${buttonClassName}`}
              onPress={() => {
                if (controlled === undefined) setUncontrolled(() => selection);
                (onChange ?? onValueChange)?.(selection);
              }}
            >
              {typeof content === 'string' || typeof content === 'number' ? (
                <NText className={`text-center font-medium ${scale.text}`}>{content}</NText>
              ) : (
                content
              )}
            </NPress>
          );
        })}
      </NView>
    </NView>
  );
}
