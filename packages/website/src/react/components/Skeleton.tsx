'use client';

import { NSkeleton } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const Skeleton = () => {
  return (
    <ComponentWrapper code={code}>
      <div className="space-y-3">
        <NSkeleton className="h-4 w-3/4 rounded" />
        <NSkeleton className="h-4 w-1/2 rounded" />
        <NSkeleton className="h-32 w-full rounded" />
      </div>
    </ComponentWrapper>
  );
};

export default Skeleton;

/** The usage sample on this component's page, kept beside the demo it documents. */
export const code = `import { NSkeleton } from '@nayan-ui/react';

const Skeleton = () => {
  return (
    <div>
      <div className="space-y-3">
        <NSkeleton className="h-4 w-3/4 rounded" />
        <NSkeleton className="h-4 w-1/2 rounded" />
        <NSkeleton className="h-32 w-full rounded" />
      </div>
    </div>
  );
};

export default Skeleton;`;
