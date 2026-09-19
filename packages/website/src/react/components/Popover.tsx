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

export const popoverAttributes = [
  { name: 'size', type: 'PopoverSize', default: 'Optional', details: 'Size of the popover.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'triggerClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'trigger', type: 'React.ReactElement', default: 'Required', details: 'Trigger element for the popover.' },
  { name: 'children', type: 'React.ReactNode', default: 'Required', details: 'Popover content.' },
  { name: 'side', type: "'top' | 'bottom' | 'right' | 'left'", default: 'Optional', details: 'Side where popover appears.' },
  { name: 'align', type: "'start' | 'end' | 'center'", default: 'Optional', details: 'Alignment of the popover.' },
  { name: 'popoverId', type: 'string', default: 'Optional', details: 'ID for the popover.' },
  { name: 'popoverLabel', type: 'string', default: 'Optional', details: 'Label for the popover.' },
  { name: 'triggerProps', type: 'React.HTMLAttributes<HTMLElement>', default: 'Optional', details: 'Props for trigger element.' },
  { name: 'contentProps', type: 'React.HTMLAttributes<HTMLDivElement>', default: 'Optional', details: 'Props for content element.' }
];
