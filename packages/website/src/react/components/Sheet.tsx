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
