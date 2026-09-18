'use client';

import { useState } from 'react';
import { NCheckGroup } from '@nayan-ui/react';
import { H3_DOC } from '@/design/system';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const items = [
  { label: 'Email', value: 'email' },
  { label: 'Push', value: 'push' },
  { label: 'SMS', value: 'sms', disabled: true }
];

const CheckboxGroup = () => {
  const [value, setValue] = useState<string[]>(['email']);

  return (
    <ComponentWrapper>
      <h3 className={H3_DOC}>Vertical:</h3>
      <div className="mb-5">
        <NCheckGroup label="Notify me by" items={items} value={value} onChange={setValue} />
      </div>

      <h3 className={H3_DOC}>Horizontal:</h3>
      <NCheckGroup label="Notify me by" items={items} value={value} onChange={setValue} orientation="horizontal" />
    </ComponentWrapper>
  );
};

export default CheckboxGroup;
