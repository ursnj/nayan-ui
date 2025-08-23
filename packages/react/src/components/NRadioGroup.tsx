import React, { forwardRef, memo, useId } from 'react';
import { cn } from '../lib/utils';
import { RadioItem } from './Types';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';

export interface NRadioGroupProps
  extends Omit<React.ComponentPropsWithoutRef<typeof RadioGroup>, 'onValueChange' | 'value' | 'defaultValue' | 'onChange'> {
  orientation?: 'horizontal' | 'vertical';
  items: RadioItem[];
  className?: string;
  id?: string;
  label?: string;
  itemClassName?: string;
  radioClassName?: string;
  labelClassName?: string;
  disabled?: boolean;
  value: string;
  onChange: (selected: string) => void;
  showLabel?: boolean;
}

export const NRadioGroup = memo(
  forwardRef<HTMLDivElement, NRadioGroupProps>((props, ref) => {
    const {
      items,
      value,
      onChange,
      orientation = 'horizontal',
      id,
      label,
      className = '',
      itemClassName = '',
      radioClassName = '',
      labelClassName = '',
      disabled = false,
      showLabel = true,
      ...rest
    } = props;
    const groupId = id || useId();
    return (
      <div className={cn('nyn-radio-block mb-3', className)} ref={ref}>
        {label && showLabel && (
          <Label htmlFor={groupId} className={cn('nyn-radio-label block pb-2 text-text', labelClassName)}>
            {label}
          </Label>
        )}
        <RadioGroup
          id={groupId}
          orientation={orientation}
          value={value}
          disabled={disabled}
          onValueChange={onChange}
          aria-label={label}
          className={cn(orientation === 'horizontal' ? 'flex flex-row flex-wrap' : 'flex flex-col', className)}
          {...rest}>
          {items.map((item, index) => {
            const itemId = `${groupId}-radio-${index}`;
            return (
              <div key={item.value} className={cn('flex items-center space-x-2', itemClassName)}>
                <RadioGroupItem
                  className={cn(radioClassName)}
                  value={item.value}
                  id={itemId}
                  aria-checked={value === item.value}
                  aria-labelledby={itemId + '-label'}
                />
                <Label id={itemId + '-label'} htmlFor={itemId} className={cn('text-text', labelClassName)}>
                  {item.label}
                </Label>
              </div>
            );
          })}
        </RadioGroup>
      </div>
    );
  })
);

NRadioGroup.displayName = 'NRadioGroup';
