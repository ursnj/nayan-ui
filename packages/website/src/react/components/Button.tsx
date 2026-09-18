'use client';

import { NButton } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const Button = () => {
  return (
    <ComponentWrapper code={code}>
      <div className="flex flex-wrap gap-3">
        <NButton onClick={() => console.log('clicked')}>Primary</NButton>
        <NButton isOutline>Outline</NButton>
        <NButton isLoading={true}>Loading</NButton>
        <NButton disabled>Disabled</NButton>
      </div>
    </ComponentWrapper>
  );
};

export default Button;

/** The usage sample on this component's page, kept beside the demo it documents. */
export const code = `import { NButton } from '@nayan-ui/react';

const Button = () => {
  return (
    <div>
      <div className="flex flex-wrap gap-3">
        <NButton onClick={() => console.log('clicked')}>Primary</NButton>
        <NButton isOutline>Outline</NButton>
        <NButton isLoading={true}>Loading</NButton>
        <NButton disabled>Disabled</NButton>
      </div>
    </div>
  );
};

export default Button;`;
