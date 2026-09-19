'use client';

import { NKbd } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const KeyboardKey = () => {
  return (
    <ComponentWrapper code={code} attributes={kbdAttributes}>
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
        <NKbd>⌘</NKbd>
        <NKbd>K</NKbd>
        <span>opens the search, and</span>
        <NKbd>Esc</NKbd>
        <span>closes it.</span>
      </div>
    </ComponentWrapper>
  );
};

export default KeyboardKey;

/** The usage sample on this component's page, kept beside the demo it documents. */
export const code = `import { NKbd } from '@nayan-ui/react';

const KeyboardKey = () => {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 text-sm text-muted">
        <NKbd>⌘</NKbd>
        <NKbd>K</NKbd>
        <span>opens the search, and</span>
        <NKbd>Esc</NKbd>
        <span>closes it.</span>
      </div>
    </div>
  );
};

export default KeyboardKey;`;

export const kbdAttributes = [
  { name: 'children', type: 'ReactNode', default: 'Required', details: 'The children prop.' },
  { name: 'className', type: 'string', default: "''", details: 'The className prop.' }
];
