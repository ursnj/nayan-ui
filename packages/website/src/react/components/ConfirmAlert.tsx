'use client';

import { useState } from 'react';
import { NButton, NConfirmAlert } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const ConfirmAlert = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <ComponentWrapper code={code}>
      <NConfirmAlert
        isOpen={isOpen}
        title="Are you absolutely sure?"
        message="This action cannot be undone. This will permanently delete your account."
        onResult={result => console.log('Result:', result)}
        onClose={() => setIsOpen(false)}
      />
      <NButton onClick={() => setIsOpen(true)}>Show Confirm Alert</NButton>
    </ComponentWrapper>
  );
};

export default ConfirmAlert;

/** The usage sample on this component's page, kept beside the demo it documents. */
export const code = `import { useState } from 'react';
import { NButton, NConfirmAlert } from '@nayan-ui/react';

const ConfirmAlert = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <NConfirmAlert
        isOpen={isOpen}
        title="Are you absolutely sure?"
        message="This action cannot be undone. This will permanently delete your account."
        onResult={result => console.log('Result:', result)}
        onClose={() => setIsOpen(false)}
      />
      <NButton onClick={() => setIsOpen(true)}>Show Confirm Alert</NButton>
    </div>
  );
};

export default ConfirmAlert;`;
