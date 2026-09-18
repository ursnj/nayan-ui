'use client';

import { NButton, NPopover, PopoverSize } from '@nayan-ui/react';
import ComponentWrapper from '@/helpers/ComponentWrapper';

const Popover = () => {
  return (
    <ComponentWrapper code={code}>
      <NPopover size={PopoverSize.MD} trigger={<NButton>Open Popover</NButton>}>
        <div className="p-3">
          <p className="text-foreground">This is popover content.</p>
        </div>
      </NPopover>
    </ComponentWrapper>
  );
};

export default Popover;

/** The usage sample on this component's page, kept beside the demo it documents. */
export const code = `import { NButton, NPopover, PopoverSize } from '@nayan-ui/react';

const Popover = () => {
  return (
    <div>
      <NPopover size={PopoverSize.MD} trigger={<NButton>Open Popover</NButton>}>
        <div className="p-3">
          <p className="text-foreground">This is popover content.</p>
        </div>
      </NPopover>
    </div>
  );
};

export default Popover;`;
