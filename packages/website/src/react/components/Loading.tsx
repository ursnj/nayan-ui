'use client';

import { NLoading } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const Loading = () => {
  return (
    <ComponentWrapper code={code} attributes={loadingAttributes}>
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

export const loadingAttributes = [
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'aria-label', type: 'string', default: 'Optional', details: 'ARIA label for accessibility.' }
];
