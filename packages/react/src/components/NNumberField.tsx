import React, { memo } from 'react';
import { Label, NumberField } from '@heroui/react';
import { cn } from '../lib/utils';

export interface NNumberFieldProps {
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  minValue?: number;
  maxValue?: number;
  step?: number;
  label?: string;
  disabled?: boolean;
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
    disabled = false,
    isInvalid = false,
    variant = 'primary',
    fullWidth = false,
    formatOptions,
    className = '',
    'aria-label': ariaLabel
  }) => {
    return (
      <NumberField
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        minValue={minValue}
        maxValue={maxValue}
        step={step}
        isDisabled={disabled}
        isInvalid={isInvalid}
        variant={variant}
        fullWidth={fullWidth}
        formatOptions={formatOptions}
        className={cn('nyn-number-field', className)}
        aria-label={ariaLabel || (!label ? 'Number' : undefined)}>
        {label && <Label>{label}</Label>}
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
