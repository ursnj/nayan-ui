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
    <ComponentWrapper>
      <div className="max-w-sm">
        <NSwitchGroup label="Email me about" items={items} value={value} onChange={setValue} />
      </div>
    </ComponentWrapper>
  );
};

export default SwitchGroup;
