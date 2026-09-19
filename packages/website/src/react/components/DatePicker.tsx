'use client';

import { NDatePicker } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const DatePicker = () => {
  return (
    <ComponentWrapper code={code} attributes={datePickerAttributes}>
      <div className="w-full">
        <NDatePicker label="Date of birth" helperText="Select your date of birth" />
      </div>
    </ComponentWrapper>
  );
};

export default DatePicker;

/** The usage sample on this component's page, kept beside the demo it documents. */
export const code = `import { NDatePicker } from '@nayan-ui/react';

const DatePicker = () => {
  return (
    <div>
      <div className="w-full">
        <NDatePicker label="Date of birth" helperText="Select your date of birth" />
      </div>
    </div>
  );
};

export default DatePicker;`;

export const datePickerAttributes = [
  { name: 'value', type: 'DateValue', default: 'Optional', details: 'Controlled date value.' },
  { name: 'defaultValue', type: 'DateValue', default: 'Optional', details: 'Default date value.' },
  { name: 'onChange', type: '(value: DateValue) => void', default: 'Optional', details: 'Callback when date changes.' },
  { name: 'label', type: 'React.ReactNode', default: 'Optional', details: 'Label for the date picker.' },
  { name: 'disabled', type: 'boolean', default: 'false', details: 'Disables the date picker.' },
  { name: 'isInvalid', type: 'boolean', default: 'false', details: 'Marks as invalid.' },
  { name: 'minValue', type: 'DateValue', default: 'Optional', details: 'Minimum selectable date.' },
  { name: 'maxValue', type: 'DateValue', default: 'Optional', details: 'Maximum selectable date.' },
  { name: 'granularity', type: "'day' | 'hour' | 'minute' | 'second'", default: "'day'", details: 'Date granularity.' },
  { name: 'className', type: 'string', default: "' '", details: 'Additional CSS classes.' },
  { name: 'wrapperClassName', type: 'string', default: "' '", details: 'Wrapper CSS classes.' },
  { name: 'labelClassName', type: 'string', default: "' '", details: 'Label CSS classes.' },
  { name: 'error', type: 'React.ReactNode', default: 'Optional', details: 'Error message to display.' },
  { name: 'helperText', type: 'React.ReactNode', default: 'Optional', details: 'Helper text below the input.' }
];
