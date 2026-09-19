'use client';

import ComponentWrapper from '@/helpers/ComponentWrapper';
import DemoComingSoon from './DemoComingSoon';

const ButtonGroup = () => {
  return (
    <ComponentWrapper code={code} attributes={buttonGroupAttributes}>
      <DemoComingSoon componentName="ButtonGroup" />
    </ComponentWrapper>
  );
};

export default ButtonGroup;

export const code = `import { View } from 'react-native';
import { useState } from 'react';
import { NButtonGroup, NText } from '@nayan-ui/native';

export default function ButtonGroupScreen() {
  const [align, setAlign] = useState('left');
  const [size, setSize] = useState('md');

  return (
    <View className="p-4 gap-4">
      <NText className="text-lg font-bold">Basic</NText>
      <NButtonGroup
        items={[
          { label: 'Left', value: 'left' },
          { label: 'Center', value: 'center' },
          { label: 'Right', value: 'right' }
        ]}
        value={align}
        onValueChange={setAlign}
      />
      <NText>Selected: {align}</NText>

      <NText className="text-lg font-bold">Different items</NText>
      <NButtonGroup
        items={[
          { label: 'S', value: 'sm' },
          { label: 'M', value: 'md' },
          { label: 'L', value: 'lg' },
          { label: 'XL', value: 'xl' }
        ]}
        value={size}
        onValueChange={setSize}
      />

      <NText className="text-lg font-bold">Disabled</NText>
      <NButtonGroup
        isDisabled
        items={[
          { label: 'A', value: 'a' },
          { label: 'B', value: 'b' }
        ]}
        value="a"
        onValueChange={() => {}}
      />
    </View>
  );
}`;

export const buttonGroupAttributes = [
  { name: 'items', type: 'ButtonGroupItem[]', default: 'Required', details: 'Array of items with label, value, optional icon and isDisabled.' },
  { name: 'value', type: 'string', default: 'Required', details: 'Currently selected value.' },
  { name: 'onValueChange', type: '(value: string) => void', default: 'Required', details: 'Callback when selection changes.' },
  { name: 'label', type: 'string', default: 'Optional', details: 'Label for the button group.' },
  { name: 'isDisabled', type: 'boolean', default: 'false', details: 'Whether the button group is disabled.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'buttonClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'labelClassName', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' },
  { name: 'selected', type: 'string', default: 'Optional', details: 'Alias of value.' },
  { name: 'onChange', type: '(value: string) => void', default: 'Optional', details: 'Alias of onValueChange.' },
  { name: 'disabled', type: 'boolean', default: 'false', details: 'Alias of isDisabled.' }
];
