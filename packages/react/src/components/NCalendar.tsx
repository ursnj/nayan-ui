import React, { memo } from 'react';
import { Calendar } from '@heroui/react';
import { cn } from '../lib/utils';

export interface NCalendarProps {
  value?: any;
  defaultValue?: any;
  onChange?: (value: any) => void;
  minValue?: any;
  maxValue?: any;
  isDateUnavailable?: (date: any) => boolean;
  disabled?: boolean;
  visibleMonths?: number;
  className?: string;
  headerClassName?: string;
  gridClassName?: string;
  'aria-label'?: string;
}

const NCalendarComponent: React.FC<NCalendarProps> = memo(
  ({
    value,
    defaultValue,
    onChange,
    minValue,
    maxValue,
    isDateUnavailable,
    disabled = false,
    visibleMonths,
    className = '',
    headerClassName = '',
    gridClassName = '',
    'aria-label': ariaLabel = 'Calendar'
  }) => {
    return (
      <Calendar
        value={value}
        defaultValue={defaultValue}
        onChange={onChange}
        minValue={minValue}
        maxValue={maxValue}
        isDateUnavailable={isDateUnavailable}
        isDisabled={disabled}
        visibleDuration={visibleMonths ? { months: visibleMonths } : undefined}
        className={cn('nyn-calendar', className)}
        aria-label={ariaLabel}>
        <Calendar.Header className={cn(headerClassName)}>
          <Calendar.NavButton slot="previous" />
          <Calendar.Heading />
          <Calendar.NavButton slot="next" />
        </Calendar.Header>
        <Calendar.Grid className={cn(gridClassName)}>
          <Calendar.GridHeader>{(day: any) => <Calendar.HeaderCell>{day}</Calendar.HeaderCell>}</Calendar.GridHeader>
          <Calendar.GridBody>{(date: any) => <Calendar.Cell date={date} />}</Calendar.GridBody>
        </Calendar.Grid>
      </Calendar>
    );
  }
);

NCalendarComponent.displayName = 'NCalendar';

export const NCalendar = NCalendarComponent;
