'use client';

import ComponentWrapper from '@/helpers/ComponentWrapper';
import DemoComingSoon from './DemoComingSoon';

const Switch = () => {
  return (
    <ComponentWrapper code={code} attributes={switchAttributes}>
      <DemoComingSoon componentName="Switch" />
    </ComponentWrapper>
  );
};

export default Switch;

export const code = `import { View } from 'react-native';
import { useState } from 'react';
import { NSwitch, NText } from '@nayan-ui/native';

export default function SwitchScreen() {
  const [wifi, setWifi] = useState(true);
  const [bluetooth, setBluetooth] = useState(false);

  return (
    <View className="p-4 gap-4">
      <NText className="text-lg font-bold">Basic</NText>
      <NSwitch label="Wi-Fi" isSelected={wifi} onSelectedChange={setWifi} />
      <NSwitch label="Bluetooth" isSelected={bluetooth} onSelectedChange={setBluetooth} />
      <NText className="text-muted">
        Wi-Fi: {wifi ? 'On' : 'Off'}, Bluetooth: {bluetooth ? 'On' : 'Off'}
      </NText>

      <NText className="text-lg font-bold">Disabled</NText>
      <NSwitch label="Disabled on" isSelected isDisabled onSelectedChange={() => {}} />
      <NSwitch label="Disabled off" isSelected={false} isDisabled onSelectedChange={() => {}} />
    </View>
  );
}`;

export const switchAttributes = [
  { name: 'label', type: 'string', default: 'Optional', details: 'Label for the switch.' },
  { name: 'isSelected', type: 'boolean', default: 'false', details: 'Whether the switch is selected.' },
  { name: 'isDisabled', type: 'boolean', default: 'false', details: 'Whether the switch is disabled.' },
  { name: 'onSelectedChange', type: '(selected: boolean) => void', default: 'Optional', details: 'Callback when switch state changes.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise switch by passing tailwind classes.' },
  { name: 'containerClassName', type: 'string', default: "' '", details: 'You can customise container by passing tailwind classes.' },
  { name: 'labelClassName', type: 'string', default: "' '", details: 'You can customise label by passing tailwind classes.' }
];
