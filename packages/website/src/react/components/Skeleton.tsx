'use client';

import { NSkeleton } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const Skeleton = () => {
  return (
    <ComponentWrapper>
      <div className="space-y-3">
        <NSkeleton className="h-4 w-3/4 rounded" />
        <NSkeleton className="h-4 w-1/2 rounded" />
        <NSkeleton className="h-32 w-full rounded" />
      </div>
    </ComponentWrapper>
  );
};

export default Skeleton;
