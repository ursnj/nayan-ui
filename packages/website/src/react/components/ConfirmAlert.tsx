'use client';

import { useState } from 'react';
import { NButton, NConfirmAlert } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const ConfirmAlert = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <ComponentWrapper>
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
