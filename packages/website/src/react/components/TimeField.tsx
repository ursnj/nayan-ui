'use client';

import { useState } from 'react';
import { Time } from '@internationalized/date';
import { NTimeField } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const TimeField = () => {
  const [value, setValue] = useState<any>(new Time(9, 30));

  return (
    <ComponentWrapper code={code}>
      <div className="max-w-sm">
        <NTimeField label="Starts at" value={value} onChange={setValue} />
        <NTimeField label="24-hour" value={value} onChange={setValue} hourCycle={24} />
      </div>
    </ComponentWrapper>
  );
};

export default TimeField;

/** The usage sample on this component's page, kept beside the demo it documents. */
export const code = `import { useState } from 'react';
import { Time } from '@internationalized/date';
import { NTimeField } from '@nayan-ui/react';

const TimeField = () => {
  const [value, setValue] = useState<any>(new Time(9, 30));

  return (
    <div>
      <div className="max-w-sm">
        <NTimeField label="Starts at" value={value} onChange={setValue} />
        <NTimeField label="24-hour" value={value} onChange={setValue} hourCycle={24} />
      </div>
    </div>
  );
};

export default TimeField;`;
