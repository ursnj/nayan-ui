'use client';

import React, { useState } from 'react';
import { NTextarea } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const Textarea = () => {
  const [value, setValue] = useState('');

  return (
    <ComponentWrapper>
      <NTextarea
        label="Message"
        placeholder="Type your message here..."
        value={value}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setValue(e.target.value)}
      />
    </ComponentWrapper>
  );
};

export default Textarea;
