import { useState } from 'react';
import { NButtonGroup, NText } from '@nayan-ui/native';
import Screen from '../src/components/Screen';

export default function ButtonGroupScreen() {
  const [align, setAlign] = useState('left');
  const [size, setSize] = useState('md');

  return (
    <Screen title="NButtonGroup">
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
    </Screen>
  );
}
