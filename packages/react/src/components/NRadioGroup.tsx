import React, { forwardRef, memo, useId } from 'react';
import { Label, Radio, RadioGroup } from '@heroui/react';
import { cn } from '../lib/utils';
import { RadioItem } from './Types';

export interface NRadioGroupProps {
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
        {label && showLabel && <Label className={cn(labelClassName)}>{label}</Label>}
        <RadioGroup
          orientation={orientation}
          value={value}
          isDisabled={disabled}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
          aria-label={label}
          className={cn(orientation === 'horizontal' ? 'flex flex-row flex-wrap gap-3' : 'flex flex-col gap-2')}
          {...(rest as any)}>
          {items.map((item, index) => (
            <Radio key={item.value} value={item.value} className={cn(radioClassName, itemClassName)}>
              {item.label}
            </Radio>
          ))}
        </RadioGroup>
      </div>
    );
  })
);

NRadioGroup.displayName = 'NRadioGroup';
