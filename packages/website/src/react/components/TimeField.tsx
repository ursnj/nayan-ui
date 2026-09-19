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

export const timeFieldAttributes = [
  { name: 'value', type: 'any', default: 'Optional', details: 'The value prop.' },
  { name: 'defaultValue', type: 'any', default: 'Optional', details: 'The defaultValue prop.' },
  { name: 'onChange', type: '(value: any) => void', default: 'Optional', details: 'The onChange prop.' },
  { name: 'label', type: 'ReactNode', default: 'Optional', details: 'The label prop.' },
  { name: 'minValue', type: 'any', default: 'Optional', details: 'The minValue prop.' },
  { name: 'maxValue', type: 'any', default: 'Optional', details: 'The maxValue prop.' },
  { name: 'granularity', type: "'hour' | 'minute' | 'second'", default: "'minute'", details: 'The granularity prop.' },
  { name: 'hourCycle', type: '12 | 24', default: 'Optional', details: "12- or 24-hour display. Defaults to the locale's own convention." },
  { name: 'disabled', type: 'boolean', default: 'false', details: 'The disabled prop.' },
  { name: 'isInvalid', type: 'boolean', default: 'false', details: 'The isInvalid prop.' },
  { name: 'variant', type: "'primary' | 'secondary'", default: "'primary'", details: 'The variant prop.' },
  { name: 'fullWidth', type: 'boolean', default: 'false', details: 'The fullWidth prop.' },
  { name: 'error', type: 'ReactNode', default: 'Optional', details: 'The error prop.' },
  { name: 'helperText', type: 'ReactNode', default: 'Optional', details: 'The helperText prop.' },
  { name: 'className', type: 'string', default: "''", details: 'The className prop.' },
  { name: 'labelClassName', type: 'string', default: "''", details: 'The labelClassName prop.' },
  { name: 'aria-label', type: 'string', default: "'Time'", details: 'The aria-label prop.' }
];
