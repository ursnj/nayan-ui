import React, { useCallback, useId } from 'react';
import { Label, Slider } from '@heroui/react';
import { cn } from '../lib/utils';

export interface NSliderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  label?: React.ReactNode;
  className?: string;
  labelClassName?: string;
  sliderClassName?: string;
  id?: string;
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  orientation?: 'horizontal' | 'vertical';
  onChange?: (value: number) => void;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-valuetext'?: string;
}

export const NSlider: React.FC<NSliderProps> = React.memo(
  ({
    className = '',
    labelClassName = '',
    sliderClassName = '',
    label,
    id,
    value,
    defaultValue = 0,
    min = 0,
    max = 100,
    step = 1,
    disabled = false,
    orientation = 'horizontal',
    onChange,
    'aria-label': ariaLabel,
    'aria-labelledby': ariaLabelledBy,
    'aria-valuetext': ariaValueText,
    ...rest
  }) => {
    const generatedId = useId();
    const sliderId = id || `nyn-slider-${generatedId}`;
    const labelId = `${sliderId}-label`;

    const handleChange = useCallback(
      (v: number | number[]) => {
        const val = Array.isArray(v) ? v[0] : v;
        if (onChange) onChange(val);
      },
      [onChange]
    );

    return (
      <div className={cn('nyn-slider-block mb-3', className)} {...rest}>
        <Slider
          id={sliderId}
          value={value}
          defaultValue={value === undefined ? defaultValue : undefined}
          minValue={min}
          maxValue={max}
          step={step}
          isDisabled={disabled}
          orientation={orientation}
          onChange={handleChange as any}
          className={cn('nyn-slider rounded', sliderClassName)}
          aria-label={ariaLabel || (!label ? 'Slider' : undefined)}
          aria-labelledby={ariaLabelledBy || (label ? labelId : undefined)}
          aria-valuetext={ariaValueText}>
          {label && (
            <Label id={labelId} className={cn(labelClassName)}>
              {label}
            </Label>
          )}
          <Slider.Track>
            <Slider.Fill />
            <Slider.Thumb />
          </Slider.Track>
        </Slider>
      </div>
    );
  }
);

NSlider.displayName = 'NSlider';
