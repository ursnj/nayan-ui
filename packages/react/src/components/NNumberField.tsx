import React, { memo } from 'react';
import { NumberField } from '@heroui/react';
import { cn } from '../lib/utils';

export interface NNumberFieldProps {
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  minValue?: number;
  maxValue?: number;
  step?: number;
  label?: string;
  isDisabled?: boolean;
  isInvalid?: boolean;
  variant?: 'primary' | 'secondary';
  fullWidth?: boolean;
  formatOptions?: Intl.NumberFormatOptions;
  className?: string;
  'aria-label'?: string;
}

const NNumberFieldComponent: React.FC<NNumberFieldProps> = memo(
  ({
    value,
    defaultValue,
    onChange,
    minValue,
    maxValue,
    step = 1,
    label,
    isDisabled = false,
    isInvalid = false,
    variant = 'primary',
    fullWidth = false,
    formatOptions,
    className = '',
    'aria-label': ariaLabel = 'Number'
  }) => {
    return (
      <NumberField
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        minValue={minValue}
        maxValue={maxValue}
        step={step}
        isDisabled={isDisabled}
        isInvalid={isInvalid}
        variant={variant}
        fullWidth={fullWidth}
        formatOptions={formatOptions}
        className={cn('nyn-number-field', className)}
        aria-label={ariaLabel}>
        <NumberField.Group>
          <NumberField.DecrementButton>-</NumberField.DecrementButton>
          <NumberField.Input />
          <NumberField.IncrementButton>+</NumberField.IncrementButton>
        </NumberField.Group>
      </NumberField>
    );
  }
);

NNumberFieldComponent.displayName = 'NNumberField';

export const NNumberField = NNumberFieldComponent;
