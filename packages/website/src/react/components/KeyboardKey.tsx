'use client';

import { NKbd } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const KeyboardKey = () => {
  return (
    <ComponentWrapper>
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
