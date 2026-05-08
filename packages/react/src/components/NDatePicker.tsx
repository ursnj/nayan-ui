import React, { ReactNode, memo } from 'react';
import { Calendar, DateField, DatePicker, Description, FieldError, Label } from '@heroui/react';
import { cn } from '../lib/utils';

export interface NDatePickerProps {
  value?: any;
  defaultValue?: any;
  onChange?: (value: any) => void;
  label?: ReactNode;
  isDisabled?: boolean;
  isInvalid?: boolean;
  minValue?: any;
  maxValue?: any;
  granularity?: 'day' | 'hour' | 'minute' | 'second';
  className?: string;
  wrapperClassName?: string;
  labelClassName?: string;
  error?: ReactNode;
  helperText?: ReactNode;
  'aria-label'?: string;
}

const NDatePickerComponent: React.FC<NDatePickerProps> = memo(
  ({
    value,
    defaultValue,
    onChange,
    label,
    isDisabled = false,
    isInvalid = false,
    minValue,
    maxValue,
    granularity = 'day',
    className = '',
    wrapperClassName = '',
    labelClassName = '',
    error,
    helperText,
    'aria-label': ariaLabel = 'Date'
  }) => {
    return (
      <DatePicker
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        isDisabled={isDisabled}
        isInvalid={!!error || isInvalid}
        minValue={minValue}
        maxValue={maxValue}
        granularity={granularity}
        className={cn('nyn-date-picker mb-3 w-full', wrapperClassName, className)}
        aria-label={ariaLabel}>
        {label && <Label className={cn(labelClassName)}>{label}</Label>}
        <DateField.Group>
          <DateField.Input>{(segment: any) => <DateField.Segment segment={segment} />}</DateField.Input>
          <DateField.Suffix>
            <DatePicker.Trigger>
              <DatePicker.TriggerIndicator />
            </DatePicker.Trigger>
          </DateField.Suffix>
        </DateField.Group>
        {helperText && <Description>{helperText}</Description>}
        {error && <FieldError>{error}</FieldError>}
        <DatePicker.Popover>
          <Calendar>
            <Calendar.Header>
              <Calendar.NavButton slot="previous" />
              <Calendar.Heading />
              <Calendar.NavButton slot="next" />
            </Calendar.Header>
            <Calendar.Grid>
              <Calendar.GridHeader>{(day: any) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}</Calendar.GridHeader>
              <Calendar.GridBody>{(date: any) => <Calendar.Cell date={date} />}</Calendar.GridBody>
            </Calendar.Grid>
          </Calendar>
        </DatePicker.Popover>
      </DatePicker>
    );
  }
);

NDatePickerComponent.displayName = 'NDatePicker';

export const NDatePicker = NDatePickerComponent;
