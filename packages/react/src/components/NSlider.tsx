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
  /** Show the current value at the end of the label row. */
  showOutput?: boolean;
  /** Formats the value for display, e.g. `v => `${v}%``. */
  output?: (value: number) => React.ReactNode;
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
    showOutput = true,
    output,
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
          {/* `internalValue`, not the `value` prop: an uncontrolled slider has no
              `value`, so the output rendered empty. */}
          {showOutput && <Slider.Output>{output ? output(internalValue) : internalValue}</Slider.Output>}
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
