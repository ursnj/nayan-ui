'use client';

import { MenuSize, NButton, NMenu, NMenuItem } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const Menu = () => {
  return (
    <ComponentWrapper>
      <NMenu size={MenuSize.MD} title="Actions" trigger={<NButton>Open Menu</NButton>}>
        <NMenuItem id="edit" title="Edit" shortcut="⌘E" onAction={() => console.log('Edit')} />
        <NMenuItem id="copy" title="Copy" shortcut="⌘C" onAction={() => console.log('Copy')} />
        <NMenuItem id="delete" title="Delete" shortcut="⌘D" separator onAction={() => console.log('Delete')} />
      </NMenu>
    </ComponentWrapper>
  );
};

export default Menu;
