'use client';

import React, { useState } from 'react';
import { NTextarea } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const Textarea = () => {
  const [value, setValue] = useState('');

  return (
    <ComponentWrapper code={code} attributes={textareaAttributes}>
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

export const textareaAttributes = [
  { name: 'id', type: 'string', default: 'Optional', details: 'You can pass id to create unique identifier.' },
  { name: 'label', type: 'React.ReactNode', default: 'Optional', details: 'Label for the textarea.' },
  { name: 'labelClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'textareaClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'error', type: 'React.ReactNode', default: 'Optional', details: 'Error message to display.' },
  { name: 'helperText', type: 'React.ReactNode', default: 'Optional', details: 'Helper text to display.' },
  { name: 'onChange', type: '(e: React.ChangeEvent<HTMLTextAreaElement>) => void', default: 'Optional', details: 'Change event handler.' }
];
