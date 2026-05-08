'use client';

import { NButton, useNToast } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const Toast = () => {
  const toast = useNToast();

  return (
    <ComponentWrapper>
      <NButton onClick={() => toast('This is a toast notification!', 'Success')}>Show Toast</NButton>
    </ComponentWrapper>
  );
};

export default Toast;
