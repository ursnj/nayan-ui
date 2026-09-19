'use client';

import { useState } from 'react';
import { NButton, NSheet, SheetSize } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const Sheet = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <ComponentWrapper code={code}>
      <NSheet isOpen={isOpen} onClose={() => setIsOpen(false)} size={SheetSize.SM} title="Settings">
        <p className="text-foreground p-3">Sheet content goes here.</p>
      </NSheet>
      <NButton onClick={() => setIsOpen(true)}>Open Sheet</NButton>
    </ComponentWrapper>
  );
};

export default Sheet;

/** The usage sample on this component's page, kept beside the demo it documents. */
export const code = `import { useState } from 'react';
import { NButton, NSheet, SheetSize } from '@nayan-ui/react';

const Sheet = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <NSheet isOpen={isOpen} onClose={() => setIsOpen(false)} size={SheetSize.SM} title="Settings">
        <p className="text-foreground p-3">Sheet content goes here.</p>
      </NSheet>
      <NButton onClick={() => setIsOpen(true)}>Open Sheet</NButton>
    </div>
  );
};

export default Sheet;`;

export const sheetAttributes = [
  { name: 'isOpen', type: 'boolean', default: 'Required', details: 'Controls whether the sheet is open.' },
  { name: 'title', type: 'string', default: 'Optional', details: 'Title for the sheet.' },
  { name: 'size', type: 'SheetSize', default: 'Optional', details: 'Size of the sheet.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'headerClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'titleClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'contentClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'children', type: 'React.ReactNode', default: 'Required', details: 'Content for the sheet.' },
  { name: 'onCloseSheet', type: '() => void', default: 'Optional', details: 'Callback when sheet is closed.' },
  { name: 'header', type: 'React.ReactNode', default: 'Optional', details: 'Custom header content.' },
  { name: 'footer', type: 'React.ReactNode', default: 'Optional', details: 'Optional footer content.' },
  { name: 'aria-label', type: 'string', default: 'Optional', details: 'ARIA label for accessibility.' },
  { name: 'aria-labelledby', type: 'string', default: 'Optional', details: 'ARIA labelledby for accessibility.' },
  { name: 'role', type: 'string', default: 'Optional', details: 'ARIA role for accessibility.' }
];
