'use client';

import { useState } from 'react';
import { NInput } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const Input = () => {
  const [value, setValue] = useState('');

  return (
    <ComponentWrapper code={code} attributes={inputAttributes}>
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

export const inputAttributes = [
  { name: 'id', type: 'string', default: 'Optional', details: 'You can pass id to create unique identifier.' },
  { name: 'label', type: 'React.ReactNode', default: 'Optional', details: 'Label for the input field.' },
  { name: 'labelClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'inputClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'wrapperClassName', type: 'string', default: "' '", details: 'You can customise wrapper by passing tailwind classes.' },
  { name: 'error', type: 'React.ReactNode', default: 'Optional', details: 'Error message to display.' },
  { name: 'helperText', type: 'React.ReactNode', default: 'Optional', details: 'Helper text to display.' },
  { name: 'onChange', type: '(e: React.ChangeEvent<HTMLInputElement>) => void', default: 'Optional', details: 'Change event handler.' }
];
