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
    <ComponentWrapper code={code} attributes={radioGroupAttributes}>
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

export const radioGroupAttributes = [
  { name: 'orientation', type: "'horizontal' | 'vertical'", default: 'Optional', details: 'Orientation of radio group.' },
  { name: 'items', type: 'RadioItem[]', default: 'Required', details: 'Array of radio items.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'id', type: 'string', default: 'Optional', details: 'ID for the radio group.' },
  { name: 'label', type: 'string', default: 'Optional', details: 'Label for the radio group.' },
  { name: 'itemClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'radioClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'labelClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'disabled', type: 'boolean', default: 'false', details: 'Whether the radio group is disabled.' },
  { name: 'value', type: 'string', default: 'Required', details: 'Selected radio value.' },
  { name: 'onChange', type: '(selected: string) => void', default: 'Required', details: 'Callback when selection changes.' },
  { name: 'showLabel', type: 'boolean', default: 'Optional', details: 'Whether to show labels.' }
];
