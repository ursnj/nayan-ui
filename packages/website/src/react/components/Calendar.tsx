'use client';

import { useState } from 'react';
import { getLocalTimeZone, today } from '@internationalized/date';
import { NCalendar } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const Calendar = () => {
  const [value, setValue] = useState<any>(today(getLocalTimeZone()));

  return (
    <ComponentWrapper>
      <NCalendar value={value} onChange={setValue} aria-label="Pick a date" />
    </ComponentWrapper>
  );
};

export default Calendar;
