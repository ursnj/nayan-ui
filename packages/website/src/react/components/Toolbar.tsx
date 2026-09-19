'use client';

import { useState } from 'react';
import { NToggleButton, NToolbar } from '@nayan-ui/react';
import { AlignCenter, AlignLeft, AlignRight } from 'lucide-react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const Toolbar = () => {
  const [align, setAlign] = useState('left');

  return (
    <ComponentWrapper code={code}>
      <NToolbar aria-label="Text alignment">
        <NToggleButton isIconOnly aria-label="Align left" isSelected={align === 'left'} onChange={() => setAlign('left')}>
          <AlignLeft className="h-4 w-4" />
        </NToggleButton>
        <NToggleButton isIconOnly aria-label="Align centre" isSelected={align === 'center'} onChange={() => setAlign('center')}>
          <AlignCenter className="h-4 w-4" />
        </NToggleButton>
        <NToggleButton isIconOnly aria-label="Align right" isSelected={align === 'right'} onChange={() => setAlign('right')}>
          <AlignRight className="h-4 w-4" />
        </NToggleButton>
      </NToolbar>
    </ComponentWrapper>
  );
};

export default Toolbar;

/** The usage sample on this component's page, kept beside the demo it documents. */
export const code = `import { useState } from 'react';
import { NToggleButton, NToolbar } from '@nayan-ui/react';
import { AlignCenter, AlignLeft, AlignRight } from 'lucide-react';

const Toolbar = () => {
  const [align, setAlign] = useState('left');

  return (
    <div>
      <NToolbar aria-label="Text alignment">
        <NToggleButton isIconOnly aria-label="Align left" isSelected={align === 'left'} onChange={() => setAlign('left')}>
          <AlignLeft className="h-4 w-4" />
        </NToggleButton>
        <NToggleButton isIconOnly aria-label="Align centre" isSelected={align === 'center'} onChange={() => setAlign('center')}>
          <AlignCenter className="h-4 w-4" />
        </NToggleButton>
        <NToggleButton isIconOnly aria-label="Align right" isSelected={align === 'right'} onChange={() => setAlign('right')}>
          <AlignRight className="h-4 w-4" />
        </NToggleButton>
      </NToolbar>
    </div>
  );
};

export default Toolbar;`;

export const toolbarAttributes = [
  { name: 'children', type: 'ReactNode', default: 'Required', details: 'The children prop.' },
  { name: 'orientation', type: "'horizontal' | 'vertical'", default: "'horizontal'", details: 'The orientation prop.' },
  { name: 'isAttached', type: 'boolean', default: 'false', details: 'Joins the controls into one segmented strip.' },
  { name: 'className', type: 'string', default: "''", details: 'The className prop.' },
  { name: 'aria-label', type: 'string', default: "'Toolbar'", details: 'The aria-label prop.' }
];
