import { forwardRef, memo, useId } from 'react';
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
  'aria-label'?: string;
  'aria-labelledby'?: string;
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
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledBy,
      ...rest
    } = props;
    const generatedId = useId();
    const groupId = id || `nyn-radio-group-${generatedId}`;
    const labelId = `${groupId}-label`;
    return (
      <div className={cn('nyn-radio-block mb-3', className)} ref={ref}>
        {label && showLabel && (
          <Label id={labelId} className={cn(labelClassName)}>
            {label}
          </Label>
        )}
        <RadioGroup
          id={groupId}
          orientation={orientation}
          value={value}
          isDisabled={disabled}
          onChange={onChange}
          aria-label={ariaLabel || (!showLabel ? label : undefined) || (!label ? 'Options' : undefined)}
          aria-labelledby={ariaLabelledBy || (label && showLabel ? labelId : undefined)}
          className={cn(orientation === 'horizontal' ? 'flex flex-row flex-wrap gap-3' : 'flex flex-col gap-2')}
          {...(rest as any)}>
          {items.map(item => (
            <Radio key={item.value} value={item.value} className={cn(radioClassName, itemClassName)}>
              <Radio.Content>
                <Radio.Control>
                  <Radio.Indicator />
                </Radio.Control>
                {item.label}
              </Radio.Content>
            </Radio>
          ))}
        </RadioGroup>
      </div>
    );
  })
);

NRadioGroup.displayName = 'NRadioGroup';
