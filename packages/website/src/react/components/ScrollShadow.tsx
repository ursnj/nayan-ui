'use client';

import { NScrollShadow } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const ScrollShadow = () => {
  return (
    <ComponentWrapper>
      <NScrollShadow className="h-40 max-w-sm rounded-xl border border-default p-3">
        <div className="space-y-2 text-sm text-muted">
          {Array.from({ length: 16 }, (_, index) => (
            <p key={index}>Row {index + 1} — scroll to see the shadows come and go.</p>
          ))}
        </div>
      </NScrollShadow>
    </ComponentWrapper>
  );
};

export default ScrollShadow;
