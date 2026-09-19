'use client';

import { useState } from 'react';
import { NButtonGroup } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const items = ['Startup', 'Business', 'Enterprise'];

const ButtonGroup = () => {
  const [selected, setSelected] = useState(items[0]);

  return (
    <ComponentWrapper code={code}>
      <NButtonGroup items={items} selected={selected} onChange={setSelected} />
    </ComponentWrapper>
  );
};

export default ButtonGroup;

/** The usage sample on this component's page, kept beside the demo it documents. */
export const code = `import { useState } from 'react';
import { NButtonGroup } from '@nayan-ui/react';

const items = ['Startup', 'Business', 'Enterprise'];

const ButtonGroup = () => {
  const [selected, setSelected] = useState(items[0]);

  return (
    <div>
      <NButtonGroup items={items} selected={selected} onChange={setSelected} />
    </div>
  );
};

export default ButtonGroup;`;

export const buttonGroupAttributes = [
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'buttonClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'items', type: 'T[]', default: 'Required', details: 'You can pass items for the button group.' },
  { name: 'selected', type: 'T', default: 'Required', details: 'You can pass default selected item.' },
  { name: 'disabled', type: 'boolean', default: 'false', details: 'You can pass disable state to disable items.' },
  { name: 'onChange', type: '(selected: T) => void', default: 'Required', details: 'You can get callback when button group changed.' },
  { name: 'keyExtractor', type: '(item: T, idx: number) => string | number', default: 'Optional', details: 'Custom key extractor function.' },
  {
    name: 'renderButton',
    type: '(item: T, selected: boolean, idx: number) => React.ReactNode',
    default: 'Optional',
    details: 'Custom render function for buttons.'
  },
  { name: 'ariaLabel', type: 'string', default: 'Optional', details: 'ARIA label for accessibility.' }
];
