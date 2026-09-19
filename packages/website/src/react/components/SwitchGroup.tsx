'use client';

import { useState } from 'react';
import { NSwitchGroup } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const items = [
  { label: 'Release notes', value: 'releases' },
  { label: 'Security alerts', value: 'security' },
  { label: 'Weekly digest', value: 'digest' }
];

const SwitchGroup = () => {
  const [value, setValue] = useState<string[]>(['releases', 'security']);

  return (
    <ComponentWrapper code={code} attributes={switchGroupAttributes}>
      <div className="max-w-sm">
        <NSwitchGroup label="Email me about" items={items} value={value} onChange={setValue} />
      </div>
    </ComponentWrapper>
  );
};

export default SwitchGroup;

/** The usage sample on this component's page, kept beside the demo it documents. */
export const code = `import { useState } from 'react';
import { NSwitchGroup } from '@nayan-ui/react';

const items = [
  { label: 'Release notes', value: 'releases' },
  { label: 'Security alerts', value: 'security' },
  { label: 'Weekly digest', value: 'digest' }
];

const SwitchGroup = () => {
  const [value, setValue] = useState<string[]>(['releases', 'security']);

  return (
    <div>
      <div className="max-w-sm">
        <NSwitchGroup label="Email me about" items={items} value={value} onChange={setValue} />
      </div>
    </div>
  );
};

export default SwitchGroup;`;

export const switchGroupAttributes = [
  { name: 'items', type: 'NSwitchGroupItem[]', default: 'Required', details: 'The items prop.' },
  { name: 'value', type: 'string[]', default: 'Required', details: 'The values currently switched on.' },
  { name: 'onChange', type: '(selected: string[]) => void', default: 'Required', details: 'The onChange prop.' },
  { name: 'orientation', type: "'horizontal' | 'vertical'", default: "'vertical'", details: 'The orientation prop.' },
  { name: 'label', type: 'string', default: 'Optional', details: 'The label prop.' },
  { name: 'showLabel', type: 'boolean', default: 'true', details: 'The showLabel prop.' },
  { name: 'disabled', type: 'boolean', default: 'false', details: 'The disabled prop.' },
  { name: 'id', type: 'string', default: 'Optional', details: 'The id prop.' },
  { name: 'className', type: 'string', default: "''", details: 'The className prop.' },
  { name: 'labelClassName', type: 'string', default: "''", details: 'The labelClassName prop.' },
  { name: 'itemClassName', type: 'string', default: "''", details: 'The itemClassName prop.' },
  { name: 'switchClassName', type: 'string', default: "''", details: 'The switchClassName prop.' }
];
