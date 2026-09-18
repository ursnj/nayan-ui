'use client';

import { useState } from 'react';
import { getLocalTimeZone, today } from '@internationalized/date';
import { NCalendar } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const Calendar = () => {
  const [value, setValue] = useState<any>(today(getLocalTimeZone()));

  return (
    <ComponentWrapper code={code}>
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
