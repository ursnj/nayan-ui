'use client';

import { useState } from 'react';
import { DialogSize, NButton, NDialog } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const Dialog = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <ComponentWrapper code={code}>
      <NDialog isOpen={isOpen} onClose={() => setIsOpen(false)} size={DialogSize.MD} title="Payment confirmation">
        Your payment has been successfully submitted. We've sent you an email with all of the details of your order.
      </NDialog>
      <NButton onClick={() => setIsOpen(true)}>Show Dialog</NButton>
    </ComponentWrapper>
  );
};

export default Dialog;

/** The usage sample on this component's page, kept beside the demo it documents. */
export const code = `import { useState } from 'react';
import { DialogSize, NButton, NDialog } from '@nayan-ui/react';

const Dialog = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <NDialog isOpen={isOpen} onClose={() => setIsOpen(false)} size={DialogSize.MD} title="Payment confirmation">
        Your payment has been successfully submitted. We've sent you an email with all of the details of your order.
      </NDialog>
      <NButton onClick={() => setIsOpen(true)}>Show Dialog</NButton>
    </div>
  );
};

export default Dialog;`;
