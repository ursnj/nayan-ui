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

    const generatedId = useId();
    const groupId = id || `nyn-radio-${generatedId}`;

    return (
      <div className={cn('nyn-radio-block mb-3', className)} ref={ref}>
        {label && showLabel && (
          <Label htmlFor={groupId} className={cn(labelClassName)}>
            {label}
          </Label>
        )}
        <RadioGroup
          id={groupId}
          orientation={orientation}
          value={value}
          isDisabled={disabled}
          onChange={(next: unknown) => onChange(typeof next === 'string' ? next : ((next as any)?.target?.value ?? ''))}
          aria-label={label}
          // mt-0: HeroUI puts mt-4 on every radio in a vertical group, including the first, which doubles up with the gap.
          className={cn(orientation === 'horizontal' ? 'flex flex-row flex-wrap gap-4' : 'flex flex-col gap-2 [&>[data-slot=radio]]:mt-0')}
          {...(rest as any)}>
          {/* The control belongs inside Radio.Content: Radio itself is the field wrapper, and HeroUI styles it as a column. */}
          {items.map(item => (
            <Radio key={item.value} value={item.value} className={cn(radioClassName, itemClassName)}>
              <Radio.Content>
                <Radio.Control>
                  <Radio.Indicator />
                </Radio.Control>
                <Label>{item.label}</Label>
              </Radio.Content>
            </Radio>
          ))}
        </RadioGroup>
      </div>
    );
  })
);

NRadioGroup.displayName = 'NRadioGroup';
