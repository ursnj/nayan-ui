'use client';

import { NButton } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const Button = () => {
  return (
    <ComponentWrapper code={code} attributes={buttonAttributes}>
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

export const buttonAttributes = [
  { name: 'disabled', type: 'boolean', default: 'false', details: 'Disables the button.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'isOutline', type: 'boolean', default: 'false', details: 'You can pass this to create outline button.' },
  { name: 'isLoading', type: 'boolean', default: 'false', details: 'You can pass this to show loading indication.' },
  { name: 'loadingText', type: 'string', default: "' '", details: 'You can pass this to show customised loading text.' },
  { name: 'leftIcon', type: 'React.ReactNode', default: 'Optional', details: 'Icon to display on the left side of button.' },
  { name: 'rightIcon', type: 'React.ReactNode', default: 'Optional', details: 'Icon to display on the right side of button.' },
  { name: 'children', type: 'React.ReactNode', default: 'Required', details: 'You can pass button content as children.' }
];
