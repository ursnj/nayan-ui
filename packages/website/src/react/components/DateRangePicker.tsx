'use client';

import { useState } from 'react';
import { getLocalTimeZone, today } from '@internationalized/date';
import { NDateRangePicker } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const DateRangePicker = () => {
  const [value, setValue] = useState<any>({ start: today(getLocalTimeZone()), end: today(getLocalTimeZone()).add({ days: 6 }) });

  return (
    <ComponentWrapper code={code}>
      <div className="max-w-md">
        <NDateRangePicker label="Reporting period" value={value} onChange={setValue} />
      </div>
    </ComponentWrapper>
  );
};

export default DateRangePicker;

/** The usage sample on this component's page, kept beside the demo it documents. */
export const code = `import { useState } from 'react';
import { getLocalTimeZone, today } from '@internationalized/date';
import { NDateRangePicker } from '@nayan-ui/react';

const DateRangePicker = () => {
  const [value, setValue] = useState<any>({ start: today(getLocalTimeZone()), end: today(getLocalTimeZone()).add({ days: 6 }) });

  return (
    <div>
      <div className="max-w-md">
        <NDateRangePicker label="Reporting period" value={value} onChange={setValue} />
      </div>
    </div>
  );
};

export default DateRangePicker;`;
