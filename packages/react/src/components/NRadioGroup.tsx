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

/**
 * A radio group.
 *
 * Three separate problems, all of which made it look and behave broken:
 *
 *   `Radio` is compound. The root supplies state and the accessible label;
 *   the circle you click is `Radio.Control` wrapping `Radio.Indicator`, and
 *   the text belongs in `Radio.Content`. With the label passed as plain
 *   children and no sub-parts, the group rendered three bare words and no
 *   radio buttons at all.
 *
 *   `onChange` read `event.target.value`. React Aria's `RadioGroup` hands its
 *   handler the selected value as a plain string, so `.target` was undefined
 *   and selecting an option threw. It is read defensively below, because a
 *   string is what arrives today and an event is what the old signature
 *   assumed.
 *
 *   `useId()` sat behind `id || useId()`, so the hook was called only when no
 *   `id` was passed — a conditional hook call, which breaks the hook order if
 *   a caller ever switches `id` between renders. The value was then never
 *   used. It is called unconditionally now and actually wires the label to the
 *   group.
 */
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
          className={cn(orientation === 'horizontal' ? 'flex flex-row flex-wrap gap-4' : 'flex flex-col gap-2')}
          {...(rest as any)}>
          {items.map(item => (
            <Radio key={item.value} value={item.value} className={cn(radioClassName, itemClassName)}>
              <Radio.Control>
                <Radio.Indicator />
              </Radio.Control>
              <Radio.Content>{item.label}</Radio.Content>
            </Radio>
          ))}
        </RadioGroup>
      </div>
    );
  })
);

NRadioGroup.displayName = 'NRadioGroup';
