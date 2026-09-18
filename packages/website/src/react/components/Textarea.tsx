'use client';

import React, { useState } from 'react';
import { NTextarea } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const Textarea = () => {
  const [value, setValue] = useState('');

  return (
    <ComponentWrapper code={code}>
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

/** The usage sample on this component's page, kept beside the demo it documents. */
export const code = `import React, { useState } from 'react';
import { NTextarea } from '@nayan-ui/react';

const Textarea = () => {
  const [value, setValue] = useState('');

  return (
    <div>
      <NTextarea
        label="Message"
        placeholder="Type your message here..."
        value={value}
        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setValue(e.target.value)}
      />
    </div>
  );
};

export default Textarea;`;
