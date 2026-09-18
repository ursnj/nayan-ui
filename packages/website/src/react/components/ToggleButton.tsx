'use client';

import { useState } from 'react';
import { NToggleButton } from '@nayan-ui/react';
import { Bold, Italic, Underline } from 'lucide-react';
import { H3_DOC } from '@/design/system';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const ToggleButton = () => {
  const [bold, setBold] = useState(true);
  const [italic, setItalic] = useState(false);

  return (
    <ComponentWrapper>
      <h3 className={H3_DOC}>Icon only:</h3>
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <NToggleButton isIconOnly aria-label="Bold" isSelected={bold} onChange={setBold}>
          <Bold className="h-4 w-4" />
        </NToggleButton>
        <NToggleButton isIconOnly aria-label="Italic" isSelected={italic} onChange={setItalic}>
          <Italic className="h-4 w-4" />
        </NToggleButton>
        <NToggleButton isIconOnly aria-label="Underline" disabled>
          <Underline className="h-4 w-4" />
        </NToggleButton>
      </div>

      <h3 className={H3_DOC}>With a label:</h3>
      <div className="flex flex-wrap items-center gap-2">
        <NToggleButton size="sm">Small</NToggleButton>
        <NToggleButton>Medium</NToggleButton>
        <NToggleButton variant="ghost">Ghost</NToggleButton>
      </div>
    </ComponentWrapper>
  );
};

export default ToggleButton;
