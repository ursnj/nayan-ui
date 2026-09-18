'use client';

import { NButton, NTooltip } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const Tooltip = () => {
  return (
    <ComponentWrapper code={code}>
      <NTooltip message="This is a tooltip!">
        <NButton>Hover me</NButton>
      </NTooltip>
    </ComponentWrapper>
  );
};

export default Tooltip;

/** The usage sample on this component's page, kept beside the demo it documents. */
export const code = `import { NButton, NTooltip } from '@nayan-ui/react';

const Tooltip = () => {
  return (
    <div>
      <NTooltip message="This is a tooltip!">
        <NButton>Hover me</NButton>
      </NTooltip>
    </div>
  );
};

export default Tooltip;`;
