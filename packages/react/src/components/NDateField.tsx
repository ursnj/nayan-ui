import React, { ReactNode, memo } from 'react';
import { DateField, Description, FieldError, Label } from '@heroui/react';
import { cn } from '../lib/utils';

export interface NDateFieldProps {
  value?: any;
  defaultValue?: any;
  onChange?: (value: any) => void;
  label?: ReactNode;
  minValue?: any;
  maxValue?: any;
  granularity?: 'day' | 'hour' | 'minute' | 'second';
  disabled?: boolean;
  isInvalid?: boolean;
  variant?: 'primary' | 'secondary';
  fullWidth?: boolean;
  error?: ReactNode;
  helperText?: ReactNode;
  className?: string;
  labelClassName?: string;
  'aria-label'?: string;
}

/** A date typed in segments, with no calendar attached. `NDatePicker` is this plus a popover. */
const NDateFieldComponent: React.FC<NDateFieldProps> = memo(
  ({
    value,
    defaultValue,
    onChange,
    label,
    minValue,
    maxValue,
    granularity = 'day',
    disabled = false,
    isInvalid = false,
    variant = 'primary',
    fullWidth = false,
    error,
    helperText,
    className = '',
    labelClassName = '',
    'aria-label': ariaLabel = 'Date'
  }) => {
    return (
      <DateField
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        minValue={minValue}
        maxValue={maxValue}
        granularity={granularity}
        isDisabled={disabled}
        isInvalid={!!error || isInvalid}
        className={cn('nyn-date-field mb-3 w-full', className)}
        aria-label={ariaLabel}>
        {label && <Label className={cn(labelClassName)}>{label}</Label>}
        <DateField.Group variant={variant} fullWidth={fullWidth}>
          <DateField.Input>{(segment: any) => <DateField.Segment segment={segment} />}</DateField.Input>
        </DateField.Group>
        {helperText && <Description>{helperText}</Description>}
        {error && <FieldError>{error}</FieldError>}
      </DateField>
    );
  }
);

NDateFieldComponent.displayName = 'NDateField';

export const NDateField = NDateFieldComponent;
