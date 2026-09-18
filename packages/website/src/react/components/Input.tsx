'use client';

import { useState } from 'react';
import { NInput } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const Input = () => {
  const [value, setValue] = useState('');

  return (
    <ComponentWrapper code={code}>
      <NInput label="Email" type="email" placeholder="Enter email" value={value} onChange={e => setValue(e.target.value)} />
    </ComponentWrapper>
  );
};

export default Input;

/** The usage sample on this component's page, kept beside the demo it documents. */
export const code = `import { useState } from 'react';
import { NInput } from '@nayan-ui/react';

const Input = () => {
  const [value, setValue] = useState('');

  return (
    <div>
      <NInput label="Email" type="email" placeholder="Enter email" value={value} onChange={e => setValue(e.target.value)} />
    </div>
  );
};

export default Input;`;
