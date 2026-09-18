import React, { ReactNode, memo } from 'react';
import { DateField, DateRangePicker, Description, FieldError, Label, RangeCalendar } from '@heroui/react';
import { cn } from '../lib/utils';

export interface NDateRangePickerProps {
  /** `{ start, end }` as react-aria date values. */
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

const NDateRangePickerComponent: React.FC<NDateRangePickerProps> = memo(
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
    fullWidth = true,
    error,
    helperText,
    className = '',
    labelClassName = '',
    'aria-label': ariaLabel = 'Date range'
  }) => {
    return (
      <DateRangePicker
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        minValue={minValue}
        maxValue={maxValue}
        granularity={granularity}
        isDisabled={disabled}
        isInvalid={!!error || isInvalid}
        className={cn('nyn-date-range-picker mb-3 w-full', className)}
        aria-label={ariaLabel}>
        {label && <Label className={cn(labelClassName)}>{label}</Label>}
        <DateField.Group variant={variant} fullWidth={fullWidth}>
          <DateField.Input slot="start">{(segment: any) => <DateField.Segment segment={segment} />}</DateField.Input>
          <DateRangePicker.RangeSeparator />
          <DateField.Input slot="end">{(segment: any) => <DateField.Segment segment={segment} />}</DateField.Input>
          <DateField.Suffix>
            <DateRangePicker.Trigger>
              <DateRangePicker.TriggerIndicator />
            </DateRangePicker.Trigger>
          </DateField.Suffix>
        </DateField.Group>
        {helperText && <Description>{helperText}</Description>}
        {error && <FieldError>{error}</FieldError>}
        <DateRangePicker.Popover>
          <RangeCalendar>
            <RangeCalendar.Header>
              <RangeCalendar.NavButton slot="previous" />
              <RangeCalendar.Heading />
              <RangeCalendar.NavButton slot="next" />
            </RangeCalendar.Header>
            <RangeCalendar.Grid>
              <RangeCalendar.GridHeader>{(day: any) => <RangeCalendar.HeaderCell>{day}</RangeCalendar.HeaderCell>}</RangeCalendar.GridHeader>
              <RangeCalendar.GridBody>{(date: any) => <RangeCalendar.Cell date={date} />}</RangeCalendar.GridBody>
            </RangeCalendar.Grid>
          </RangeCalendar>
        </DateRangePicker.Popover>
      </DateRangePicker>
    );
  }
);

NDateRangePickerComponent.displayName = 'NDateRangePicker';

export const NDateRangePicker = NDateRangePickerComponent;
