import React, { KeyboardEvent, memo, useRef } from 'react';
import { cn } from '../lib/utils';
import { Button } from './ui/button';

export interface NButtonGroupProps<T = string> extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  className?: string;
  buttonClassName?: string;
  items: T[];
  selected: T;
  disabled?: boolean;
  onChange: (selected: T) => void;
  ariaLabel?: string;
}

function NButtonGroupComponent<T = string>({
  className = '',
  buttonClassName = '',
  items,
  selected,
  disabled = false,
  onChange,
  ariaLabel,
  ...rest
}: NButtonGroupProps<T>) {
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
    const idx = items.findIndex(item => item === selected);
    let nextIdx = idx;
    if (e.key === 'ArrowLeft') nextIdx = idx > 0 ? idx - 1 : items.length - 1;
    if (e.key === 'ArrowRight') nextIdx = idx < items.length - 1 ? idx + 1 : 0;
    if (nextIdx !== idx) {
      onChange(items[nextIdx]);
      setTimeout(() => {
        buttonRefs.current[nextIdx]?.focus();
      }, 0);
    }
  };

  return (
    <div className={cn('nyn-button-group rounded', className)} role="group" aria-label={ariaLabel} tabIndex={0} onKeyDown={handleKeyDown} {...rest}>
      {items.map((item, idx) => {
        const key = typeof item === 'string' ? item : idx;
        const isSelected = item === selected;
        return (
          <Button
            key={key}
            ref={el => {
              buttonRefs.current[idx] = el;
            }}
            type="button"
            disabled={disabled}
            aria-pressed={isSelected}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onChange(item)}
            className={cn(
              `nyn-button-group-item ${
                isSelected ? 'bg-primary text-white' : 'bg-card text-text'
              } hover:bg-primary hover:text-white border border-border first:border-r-0 last:border-l-0 first:rounded-l-lg rounded-none last:rounded-r-lg px-3 py-2 h-auto mx-0 outline-none focus:shadow-outline`,
              buttonClassName
            )}>
            {String(item)}
          </Button>
        );
      })}
    </div>
  );
}

export const NButtonGroup = memo(NButtonGroupComponent) as typeof NButtonGroupComponent;
