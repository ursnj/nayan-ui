'use client';

import { NButton, NPopover, PopoverSize } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const Popover = () => {
  return (
    <ComponentWrapper>
      <NPopover size={PopoverSize.MD} trigger={<NButton>Open Popover</NButton>}>
        <div className="p-3">
          <p className="text-foreground">This is popover content.</p>
        </div>
      </NPopover>
    </ComponentWrapper>
  );
};

export default Popover;
