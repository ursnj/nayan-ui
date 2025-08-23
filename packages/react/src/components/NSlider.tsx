import React, { useCallback, useEffect, useId, useState } from 'react';
import { cn } from '../lib/utils';
import { Label } from './ui/label';
import { Slider } from './ui/slider';

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
    const [internalValue, setInternalValue] = useState<number[]>([typeof value === 'number' ? value : defaultValue]);

    // Sync internal value with controlled value
    useEffect(() => {
      if (typeof value === 'number') setInternalValue([value]);
    }, [value]);

    const handleValueChange = useCallback((v: number[]) => {
      setInternalValue(v);
    }, []);

    const handleValueCommit = useCallback(
      (v: number[]) => {
        if (onChange) onChange(v[0]);
      },
      [onChange]
    );

    return (
      <div className={cn('nyn-slider-block mb-3', className)} {...rest}>
        {label && (
          <Label htmlFor={sliderId} className={cn('nyn-slider-label block pb-4 text-text', labelClassName)}>
            {label}
          </Label>
        )}
        <Slider
          id={sliderId}
          value={internalValue}
          defaultValue={[defaultValue]}
          min={min}
          max={max}
          step={step}
          disabled={disabled}
          orientation={orientation}
          onValueChange={handleValueChange}
          onValueCommit={handleValueCommit}
          className={cn('nyn-slider bg-border rounded', sliderClassName)}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledBy}
          aria-valuetext={ariaValueText}
        />
      </div>
    );
  }
);

NSlider.displayName = 'NSlider';
