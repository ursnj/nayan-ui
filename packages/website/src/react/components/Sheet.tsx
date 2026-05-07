import { useState } from 'react';
import { NButton, NSheet, SheetSize } from '@nayan-ui/react';
import ComponentWrapper from '../../helpers/ComponentWrapper';

const Sheet = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <ComponentWrapper>
      <NSheet isOpen={isOpen} onClose={() => setIsOpen(false)} size={SheetSize.SM} title="Settings">
        <p className="text-foreground p-3">Sheet content goes here.</p>
      </NSheet>
      <NButton onClick={() => setIsOpen(true)}>Open Sheet</NButton>
    </ComponentWrapper>
  );
};

export default Sheet;
