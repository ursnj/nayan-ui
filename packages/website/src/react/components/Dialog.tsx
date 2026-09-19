'use client';

import { useState } from 'react';
import { DialogSize, NButton, NDialog } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const Dialog = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <ComponentWrapper code={code} attributes={dialogAttributes}>
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

export const dialogAttributes = [
  { name: 'isOpen', type: 'boolean', default: 'Required', details: 'Controls whether the dialog is open.' },
  { name: 'title', type: 'string', default: 'Required', details: 'Title for the dialog.' },
  { name: 'size', type: 'DialogSize', default: 'Optional', details: 'Size of the dialog.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'titleClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'headerClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'contentClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'children', type: 'React.ReactNode', default: 'Required', details: 'Content for the dialog.' },
  { name: 'onClose', type: '() => void', default: 'Required', details: 'Callback when dialog is closed.' },
  { name: 'renderHeader', type: '(title: string) => React.ReactNode', default: 'Optional', details: 'Custom render function for header.' },
  { name: 'renderFooter', type: '() => React.ReactNode', default: 'Optional', details: 'Custom render function for footer.' }
];
