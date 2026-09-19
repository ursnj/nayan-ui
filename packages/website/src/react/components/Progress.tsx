'use client';

import { NProgress } from '@nayan-ui/react';
import { H3_DOC } from '@/design/system';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const Progress = () => {
  return (
    <ComponentWrapper code={code} attributes={progressAttributes}>
      <h3 className={H3_DOC}>Bar only</h3>
      <NProgress value={30} />

      <h3 className={H3_DOC}>With a visible label</h3>
      <NProgress value={72} label="Uploading" showLabel />
    </ComponentWrapper>
  );
};

export default Progress;

/** The usage sample on this component's page, kept beside the demo it documents. */
export const code = `import { NProgress } from '@nayan-ui/react';

const Progress = () => {
  return (
    <div>
      <h3 className="text-foreground mb-2 mt-4 text-sm font-semibold">Bar only</h3>
      <NProgress value={30} />

      <h3 className="text-foreground mb-2 mt-4 text-sm font-semibold">With a visible label</h3>
      <NProgress value={72} label="Uploading" showLabel />
    </div>
  );
};

export default Progress;`;

export const progressAttributes = [
  { name: 'value', type: 'number', default: 'Required', details: 'Current progress value.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'label', type: 'string', default: 'Optional', details: 'Label for the progress bar.' },
  { name: 'showLabel', type: 'boolean', default: 'Optional', details: 'Whether to show the label.' }
];
