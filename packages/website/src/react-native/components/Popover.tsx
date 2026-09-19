'use client';

import ComponentWrapper from '@/helpers/ComponentWrapper';
import DemoComingSoon from './DemoComingSoon';

const Popover = () => {
  return (
    <ComponentWrapper code={code} attributes={popoverAttributes}>
      <DemoComingSoon componentName="Popover" />
    </ComponentWrapper>
  );
};

export default Popover;

export const code = `import { View } from 'react-native';
import { NButton, NPopover, NText } from '@nayan-ui/native';

export default function PopoverScreen() {
  return (
    <View className="p-4 gap-4">
      <NText className="text-lg font-bold">Default (bottom)</NText>
      <NPopover trigger={<NButton variant="outline">Open Popover</NButton>}>
        <View className="p-3">
          <NText>Popover content below the trigger.</NText>
        </View>
      </NPopover>

      <NText className="text-lg font-bold">Placement top</NText>
      <NPopover placement="top" trigger={<NButton variant="outline">Top</NButton>}>
        <View className="p-3">
          <NText>Above the trigger.</NText>
        </View>
      </NPopover>

      <NText className="text-lg font-bold">Placement left</NText>
      <NPopover placement="left" trigger={<NButton variant="outline">Left</NButton>}>
        <View className="p-3">
          <NText>Left side.</NText>
        </View>
      </NPopover>

      <NText className="text-lg font-bold">Placement right</NText>
      <NPopover placement="right" trigger={<NButton variant="outline">Right</NButton>}>
        <View className="p-3">
          <NText>Right side.</NText>
        </View>
      </NPopover>

      <NText className="text-lg font-bold">Rich content</NText>
      <NPopover trigger={<NButton>Details</NButton>}>
        <View className="p-3 gap-2">
          <NText className="font-bold">User Info</NText>
          <NText className="text-muted">john@example.com</NText>
          <NButton size="sm" onPress={() => {}}>
            View Profile
          </NButton>
        </View>
      </NPopover>
    </View>
  );
}`;

export const popoverAttributes = [
  { name: 'trigger', type: 'React.ReactNode', default: 'Optional', details: 'Trigger element for the popover.' },
  { name: 'children', type: 'React.ReactNode', default: 'Required', details: 'Content for the popover.' },
  { name: 'isOpen', type: 'boolean', default: 'Optional', details: 'Controlled open state.' },
  { name: 'onOpenChange', type: '(isOpen: boolean) => void', default: 'Optional', details: 'Callback when open state changes.' },
  { name: 'placement', type: "'top' | 'bottom' | 'left' | 'right'", default: "'bottom'", details: 'Placement of the popover.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' }
];
