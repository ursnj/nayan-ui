import React, { useCallback, useEffect, useId, useState } from 'react';
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
    const [internalValue, setInternalValue] = useState<number>(typeof value === 'number' ? value : defaultValue);

    useEffect(() => {
      if (typeof value === 'number') setInternalValue(value);
    }, [value]);

    const handleChange = useCallback(
      (v: number | number[]) => {
        const val = Array.isArray(v) ? v[0] : v;
        setInternalValue(val);
        if (onChange) onChange(val);
      },
      [onChange]
    );

    /*
     * Slider is a compound component: the root renders only the grid that its
     * label, track and thumb sit in. Rendering it childless — as this did —
     * produces an empty div, so the control is invisible and there is nothing
     * to drag, while any value readout beside it still looks perfectly fine.
     *
     * The label belongs inside the root rather than above it: that is the grid
     * area the stylesheet gives it, and react-aria only names the slider from
     * a label it owns.
     */
    return (
      <div className={cn('nyn-slider-block mb-3', className)} {...rest}>
        <Slider
          value={internalValue}
          minValue={min}
          maxValue={max}
          step={step}
          isDisabled={disabled}
          orientation={orientation}
          onChange={handleChange as any}
          className={cn('nyn-slider rounded', sliderClassName)}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          aria-valuetext={ariaValueText}>
          {label && <Label className={cn(labelClassName)}>{label}</Label>}
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
