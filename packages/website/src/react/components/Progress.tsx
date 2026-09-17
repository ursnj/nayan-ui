'use client';

import { NProgress } from '@nayan-ui/react';
import { H3_DOC } from '@/design/system';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const Progress = () => {
  return (
    <ComponentWrapper>
      <h3 className={H3_DOC}>Bar only</h3>
      <NProgress value={30} />

      <h3 className={H3_DOC}>With a visible label</h3>
      <NProgress value={72} label="Uploading" showLabel />
    </ComponentWrapper>
  );
};

export default Progress;
