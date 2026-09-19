'use client';

import { useState } from 'react';
import { getLocalTimeZone, today } from '@internationalized/date';
import { NCalendar } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const Calendar = () => {
  const [value, setValue] = useState<any>(today(getLocalTimeZone()));

  return (
    <ComponentWrapper code={code} attributes={calendarAttributes}>
      <NCalendar value={value} onChange={setValue} aria-label="Pick a date" />
    </ComponentWrapper>
  );
};

export default Calendar;

/** The usage sample on this component's page, kept beside the demo it documents. */
export const code = `import { useState } from 'react';
import { getLocalTimeZone, today } from '@internationalized/date';
import { NCalendar } from '@nayan-ui/react';

const Calendar = () => {
  const [value, setValue] = useState<any>(today(getLocalTimeZone()));

  return (
    <div>
      <NCalendar value={value} onChange={setValue} aria-label="Pick a date" />
    </div>
  );
};

export default Calendar;`;

export const calendarAttributes = [
  { name: 'value', type: 'any', default: 'Optional', details: 'The value prop.' },
  { name: 'defaultValue', type: 'any', default: 'Optional', details: 'The defaultValue prop.' },
  { name: 'onChange', type: '(value: any) => void', default: 'Optional', details: 'The onChange prop.' },
  { name: 'minValue', type: 'any', default: 'Optional', details: 'The minValue prop.' },
  { name: 'maxValue', type: 'any', default: 'Optional', details: 'The maxValue prop.' },
  {
    name: 'isDateUnavailable',
    type: '(date: any) => boolean',
    default: 'Optional',
    details: 'Dates the user cannot pick, e.g. `date => date.day === 1`.'
  },
  { name: 'disabled', type: 'boolean', default: 'false', details: 'The disabled prop.' },
  { name: 'visibleMonths', type: 'number', default: 'Optional', details: 'Months shown side by side.' },
  { name: 'label', type: 'ReactNode', default: 'Optional', details: 'The label prop.' },
  { name: 'className', type: 'string', default: "''", details: 'The className prop.' },
  { name: 'headerClassName', type: 'string', default: "''", details: 'The headerClassName prop.' },
  { name: 'gridClassName', type: 'string', default: "''", details: 'The gridClassName prop.' },
  { name: 'aria-label', type: 'string', default: "'Calendar'", details: 'The aria-label prop.' }
];
