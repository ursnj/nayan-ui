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
