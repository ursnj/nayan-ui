'use client';

import { useState } from 'react';
import { NToggleButton, NToolbar } from '@nayan-ui/react';
import { AlignCenter, AlignLeft, AlignRight } from 'lucide-react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const Toolbar = () => {
  const [align, setAlign] = useState('left');

  return (
    <ComponentWrapper>
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
