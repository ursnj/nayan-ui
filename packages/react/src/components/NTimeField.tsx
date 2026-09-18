import React, { ReactNode, memo } from 'react';
import { Description, FieldError, Label, TimeField } from '@heroui/react';
import { cn } from '../lib/utils';

export interface NTimeFieldProps {
  value?: any;
  defaultValue?: any;
  onChange?: (value: any) => void;
  label?: ReactNode;
  minValue?: any;
  maxValue?: any;
  granularity?: 'hour' | 'minute' | 'second';
  /** 12- or 24-hour display. Defaults to the locale's own convention. */
  hourCycle?: 12 | 24;
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

const NTimeFieldComponent: React.FC<NTimeFieldProps> = memo(
  ({
    value,
    defaultValue,
    onChange,
    label,
    minValue,
    maxValue,
    granularity = 'minute',
    hourCycle,
    disabled = false,
    isInvalid = false,
    variant = 'primary',
    fullWidth = false,
    error,
    helperText,
    className = '',
    labelClassName = '',
    'aria-label': ariaLabel = 'Time'
  }) => {
    return (
      <TimeField
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        minValue={minValue}
        maxValue={maxValue}
        granularity={granularity}
        hourCycle={hourCycle}
        isDisabled={disabled}
        isInvalid={!!error || isInvalid}
        className={cn('nyn-time-field mb-3 w-full', className)}
        aria-label={ariaLabel}>
        {label && <Label className={cn(labelClassName)}>{label}</Label>}
        <TimeField.Group variant={variant} fullWidth={fullWidth}>
          <TimeField.Input>{(segment: any) => <TimeField.Segment segment={segment} />}</TimeField.Input>
        </TimeField.Group>
        {helperText && <Description>{helperText}</Description>}
        {error && <FieldError>{error}</FieldError>}
      </TimeField>
    );
  }
);

NTimeFieldComponent.displayName = 'NTimeField';

export const NTimeField = NTimeFieldComponent;
