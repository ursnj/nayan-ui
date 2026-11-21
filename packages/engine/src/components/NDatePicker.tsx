import { createElement } from 'react';
import { component } from './component';
import type { ComponentProps } from './types';

export interface NDatePickerProps extends Omit<ComponentProps, 'value' | 'defaultValue' | 'onChange'> {
  value?: Date;
  defaultValue?: Date;
  minimumDate?: Date;
  maximumDate?: Date;
  onChange?: (date: Date) => void;
}
const Calendar = /* @__PURE__ */ component<Record<string, unknown>>('NDatePicker');
function dateOnly(date: Date) {
  if (!Number.isFinite(date.getTime())) throw new RangeError('NDatePicker requires valid dates');
  return `${String(date.getFullYear()).padStart(4, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
/** A Rust calendar with month/year navigation. Dates cross the bridge as local calendar days. */
export function NDatePicker({ value, defaultValue, minimumDate, maximumDate, onChange, className = '', ...props }: NDatePickerProps) {
  const min = minimumDate && dateOnly(minimumDate);
  const max = maximumDate && dateOnly(maximumDate);
  if (min && max && min > max) throw new RangeError('minimumDate must precede maximumDate');
  return createElement(Calendar, {
    ...props,
    className: `w-full rounded-xl border border-field-border bg-field-background ${className}`,
    value: value && dateOnly(value),
    defaultValue: dateOnly(defaultValue ?? new Date()),
    minimumDate: min,
    maximumDate: max,
    onChange: (value: string) => {
      const [year, month, day] = value.split('-').map(Number);
      const date = new Date(0);
      date.setFullYear(year!, month! - 1, day!);
      date.setHours(0, 0, 0, 0);
      onChange?.(date);
    }
  });
}
