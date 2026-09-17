'use client';

import { MenuSize, NMenu, NMenuItem } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const Menu = () => {
  return (
    <ComponentWrapper>
      <NMenu
        size={MenuSize.MD}
        title="Actions"
        triggerClassName="inline-flex items-center rounded-lg border border-default bg-surface px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-default/50"
        trigger="Open Menu">
        <NMenuItem id="edit" title="Edit" shortcut="⌘E" onAction={() => console.log('Edit')} />
        <NMenuItem id="copy" title="Copy" shortcut="⌘C" onAction={() => console.log('Copy')} />
        <NMenuItem id="delete" title="Delete" shortcut="⌘D" separator onAction={() => console.log('Delete')} />
      </NMenu>
    </ComponentWrapper>
  );
};

export default Menu;
