'use client';

import { useState } from 'react';
import { NRadioGroup } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const items = [
  { label: 'Startup', value: 'startup' },
  { label: 'Business', value: 'business' },
  { label: 'Enterprise', value: 'enterprise' }
];

const RadioGroup = () => {
  const [value, setValue] = useState('startup');

  return (
    <ComponentWrapper code={code}>
      <h1 className="text-foreground mb-3 text-base">Horizontal:</h1>
      <NRadioGroup label="Plan" items={items} value={value} onChange={setValue} />
      <div className="mt-5" />
      <h1 className="text-foreground mb-3 text-base">Vertical:</h1>
      <NRadioGroup orientation="vertical" label="Plan" items={items} value={value} onChange={setValue} />
    </ComponentWrapper>
  );
};

export default RadioGroup;

/** The usage sample on this component's page, kept beside the demo it documents. */
export const code = `import { useState } from 'react';
import { NRadioGroup } from '@nayan-ui/react';

const items = [
  { label: 'Startup', value: 'startup' },
  { label: 'Business', value: 'business' },
  { label: 'Enterprise', value: 'enterprise' }
];

const RadioGroup = () => {
  const [value, setValue] = useState('startup');

  return (
    <div>
      <h1 className="text-foreground mb-3 text-base">Horizontal:</h1>
      <NRadioGroup label="Plan" items={items} value={value} onChange={setValue} />
      <div className="mt-5" />
      <h1 className="text-foreground mb-3 text-base">Vertical:</h1>
      <NRadioGroup orientation="vertical" label="Plan" items={items} value={value} onChange={setValue} />
    </div>
  );
};

export default RadioGroup;`;
