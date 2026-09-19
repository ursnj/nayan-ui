'use client';

import ComponentWrapper from '@/helpers/ComponentWrapper';
import DemoComingSoon from './DemoComingSoon';

const Checkbox = () => {
  return (
    <ComponentWrapper code={code}>
      <DemoComingSoon componentName="Checkbox" />
    </ComponentWrapper>
  );
};

export default Checkbox;

export const code = `import { View } from 'react-native';
import { useState } from 'react';
import { NCheck, NText } from '@nayan-ui/native';

export default function CheckScreen() {
  const [a, setA] = useState(false);
  const [b, setB] = useState(true);

  return (
    <View className="p-4 gap-4">
      <NText className="text-lg font-bold">Basic</NText>
      <NCheck label="Accept terms and conditions" isSelected={a} onSelectedChange={setA} />
      <NText>Checked: {a ? 'Yes' : 'No'}</NText>

      <NText className="text-lg font-bold">Pre-checked</NText>
      <NCheck label="Receive newsletters" isSelected={b} onSelectedChange={setB} />

      <NText className="text-lg font-bold">Disabled</NText>
      <NCheck label="Disabled unchecked" isSelected={false} isDisabled onSelectedChange={() => {}} />
      <NCheck label="Disabled checked" isSelected isDisabled onSelectedChange={() => {}} />
    </View>
  );
}`;

export const checkAttributes = [
  { name: 'label', type: 'string', default: 'Required', details: 'Label text for the checkbox.' },
  { name: 'isSelected', type: 'boolean', default: 'false', details: 'Whether the checkbox is selected.' },
  { name: 'isDisabled', type: 'boolean', default: 'false', details: 'Whether the checkbox is disabled.' },
  { name: 'onSelectedChange', type: '(selected: boolean) => void', default: 'Optional', details: 'Callback when checkbox state changes.' },
  { name: 'containerClassName', type: 'string', default: "' '", details: 'You can customise container by passing tailwind classes.' },
  { name: 'labelClassName', type: 'string', default: "' '", details: 'You can customise label by passing tailwind classes.' }
];
