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
          /*
           * `[&>[data-slot=radio]]:mt-0` on the vertical group: HeroUI's
           * `.radio-group[data-orientation="vertical"]` puts `mt-4` on every
           * radio, the first one included, which stacked on top of the `gap-2`
           * here — options ended up 24px apart with a 16px hole between the
           * group's label and its first option. Clearing the margin leaves the
           * gap as the only thing setting the rhythm, so the two orientations
           * are spaced by the same mechanism.
           */
          className={cn(orientation === 'horizontal' ? 'flex flex-row flex-wrap gap-4' : 'flex flex-col gap-2 [&>[data-slot=radio]]:mt-0')}
          {...(rest as any)}>
          {/*
           * The control goes *inside* `Radio.Content`, not beside it.
           *
           * `Radio` is React Aria's `RadioField`, and HeroUI styles it
           * `flex flex-col`: it is the field wrapper, whose children stack so
           * that a description or an error can sit under the option. The
           * clickable row is `Radio.Content` — HeroUI's own source calls it
           * "the clickable RadioButton label wrapping the control + Label" —
           * and it is the element styled `inline-flex items-center gap-3`.
           *
           * With the control and the content as siblings of the column, every
           * option rendered as a circle on one line and its text on the next.
           * It was most obvious in the vertical group, where the result was six
           * rows for three options, but the horizontal one was stacking each
           * pair too.
           *
           * The text is a `Label` rather than bare children so it carries
           * `data-slot="label"`, which is what gives it the pointer cursor and
           * the no-select behaviour; `Radio.Content` supplies a `LabelContext`
           * that renders it as a `span`, so this nests nothing illegal.
           */}
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
