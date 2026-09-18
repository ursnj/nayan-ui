'use client';

import { useState } from 'react';
import { getLocalTimeZone, today } from '@internationalized/date';
import { NDateField } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const DateField = () => {
  const [value, setValue] = useState<any>(today(getLocalTimeZone()));

  return (
    <ComponentWrapper code={code}>
      <div className="max-w-sm">
        <NDateField label="Starts" value={value} onChange={setValue} helperText="Type it, or step the segments with the arrow keys." />
      </div>
    </ComponentWrapper>
  );
};

export default DateField;

/** The usage sample on this component's page, kept beside the demo it documents. */
export const code = `import { useState } from 'react';
import { getLocalTimeZone, today } from '@internationalized/date';
import { NDateField } from '@nayan-ui/react';

const DateField = () => {
  const [value, setValue] = useState<any>(today(getLocalTimeZone()));

  return (
    <div>
      <div className="max-w-sm">
        <NDateField label="Starts" value={value} onChange={setValue} helperText="Type it, or step the segments with the arrow keys." />
      </div>
    </div>
  );
};

export default DateField;`;
