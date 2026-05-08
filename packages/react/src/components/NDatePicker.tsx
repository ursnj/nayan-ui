import React, { memo } from 'react';
import { Calendar, DateField, DatePicker } from '@heroui/react';
import { cn } from '../lib/utils';

export interface NDatePickerProps {
  value?: any;
  defaultValue?: any;
  onChange?: (value: any) => void;
  label?: string;
  isDisabled?: boolean;
  isInvalid?: boolean;
  minValue?: any;
  maxValue?: any;
  granularity?: 'day' | 'hour' | 'minute' | 'second';
  className?: string;
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
    'aria-label': ariaLabel = 'Date'
  }) => {
    return (
      <DatePicker
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        isDisabled={isDisabled}
        isInvalid={isInvalid}
        minValue={minValue}
        maxValue={maxValue}
        granularity={granularity}
        className={cn('nyn-date-picker', className)}
        aria-label={ariaLabel}>
        <DateField>
          <DateField.Group>
            <DateField.InputContainer>
              <DateField.Input>{(segment: any) => <DateField.Segment segment={segment} />}</DateField.Input>
            </DateField.InputContainer>
            <DateField.Suffix>
              <DatePicker.Trigger>
                <DatePicker.TriggerIndicator />
              </DatePicker.Trigger>
            </DateField.Suffix>
          </DateField.Group>
        </DateField>
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
