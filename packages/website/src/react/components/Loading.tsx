'use client';

import { NLoading } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const Loading = () => {
  return (
    <ComponentWrapper code={code}>
      <div className="flex items-center gap-4">
        <NLoading size="sm" />
        <NLoading size="md" />
        <NLoading size="lg" />
      </div>
    </ComponentWrapper>
  );
};

export default Loading;

/** The usage sample on this component's page, kept beside the demo it documents. */
export const code = `import { NLoading } from '@nayan-ui/react';

const Loading = () => {
  return (
    <div>
      <div className="flex items-center gap-4">
        <NLoading size="sm" />
        <NLoading size="md" />
        <NLoading size="lg" />
      </div>
    </div>
  );
};

export default Loading;`;
