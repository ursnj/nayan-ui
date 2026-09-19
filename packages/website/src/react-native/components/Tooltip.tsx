'use client';

import ComponentWrapper from '@/helpers/ComponentWrapper';
import DemoComingSoon from './DemoComingSoon';

const Tooltip = () => {
  return (
    <ComponentWrapper code={code}>
      <DemoComingSoon componentName="Tooltip" />
    </ComponentWrapper>
  );
};

export default Tooltip;

export const code = `import { View } from 'react-native';
import { NButton, NText, NTooltip } from '@nayan-ui/native';

export default function TooltipScreen() {
  return (
    <View className="p-4 gap-4">
      <NText className="text-lg font-bold">Basic</NText>
      <NTooltip message="This is a tooltip">
        <NButton variant="outline">Hover / Press</NButton>
      </NTooltip>

      <NText className="text-lg font-bold">On different elements</NText>
      <NTooltip message="Button tooltip">
        <NButton>Primary button</NButton>
      </NTooltip>

      <NTooltip message="Ghost tooltip">
        <NButton variant="ghost">Ghost button</NButton>
      </NTooltip>

      <NText className="text-lg font-bold">Long message</NText>
      <NTooltip message="This is a longer tooltip message that provides more context about the element it's attached to.">
        <NButton variant="outline">More info</NButton>
      </NTooltip>
    </View>
  );
}`;

export const tooltipAttributes = [
  { name: 'children', type: 'React.ReactNode', default: 'Required', details: 'Trigger element for the tooltip.' },
  { name: 'message', type: 'string', default: 'Required', details: 'Tooltip message text.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise tooltip content by passing tailwind classes.' },
  { name: 'textClassName', type: 'string', default: "' '", details: 'You can customise tooltip text by passing tailwind classes.' }
];
