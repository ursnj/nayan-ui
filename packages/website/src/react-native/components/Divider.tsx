'use client';

import ComponentWrapper from '@/helpers/ComponentWrapper';
import DemoComingSoon from './DemoComingSoon';

const Divider = () => {
  return (
    <ComponentWrapper code={code} attributes={dividerAttributes}>
      <DemoComingSoon componentName="Divider" />
    </ComponentWrapper>
  );
};

export default Divider;

export const code = `import { View } from 'react-native';
import { NDivider, NText } from '@nayan-ui/native';

export default function DividerScreen() {
  return (
    <View className="p-4 gap-4">
      <NText className="text-lg font-bold">Horizontal (default)</NText>
      <NText>Above</NText>
      <NDivider />
      <NText>Below</NText>

      <NText className="text-lg font-bold">Vertical</NText>
      <View className="flex-row items-center gap-3 h-10">
        <NText>Left</NText>
        <NDivider orientation="vertical" />
        <NText>Right</NText>
      </View>

      <NText className="text-lg font-bold">Custom thickness</NText>
      <NDivider thickness={3} />
    </View>
  );
}`;

export const dividerAttributes = [
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'orientation', type: 'vertical | horizontal', default: 'horizontal', details: 'You can pass divider orientation.' }
];
