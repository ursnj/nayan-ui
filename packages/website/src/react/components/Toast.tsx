'use client';

import { NButton, useNToast } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const Toast = () => {
  const toast = useNToast();

  return (
    <ComponentWrapper code={code}>
      <NButton onClick={() => toast('This is a toast notification!', 'Success')}>Show Toast</NButton>
    </ComponentWrapper>
  );
};

export default Toast;

/** The usage sample on this component's page, kept beside the demo it documents. */
export const code = `import { NButton, useNToast } from '@nayan-ui/react';

const Toast = () => {
  const toast = useNToast();

  return (
    <div>
      <NButton onClick={() => toast('This is a toast notification!', 'Success')}>Show Toast</NButton>
    </div>
  );
};

export default Toast;`;

export const toastAttributes = [
  { name: 'description', type: 'string', default: 'Required', details: 'Toast message description.' },
  { name: 'title', type: 'string', default: 'Optional', details: 'Toast title.' }
];
