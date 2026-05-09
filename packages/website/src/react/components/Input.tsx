'use client';

import { useState } from 'react';
import { NInput } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const Input = () => {
  const [value, setValue] = useState('');

  return (
    <ComponentWrapper>
      <NInput label="Email" type="email" placeholder="Enter email" value={value} onChange={e => setValue(e.target.value)} />
    </ComponentWrapper>
  );
};

export default Input;
