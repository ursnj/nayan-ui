import { useState } from 'react';
import { NRadio, NText } from '@nayan-ui/native';
import Screen from '../src/components/Screen';

export default function RadioScreen() {
  const [fruit, setFruit] = useState('apple');
  const [size, setSize] = useState('md');

  return (
    <Screen title="NRadio">
      <NText className="text-lg font-bold">Basic</NText>
      <NRadio
        label="Favorite fruit"
        value={fruit}
        onValueChange={setFruit}
        items={[
          { label: 'Apple', value: 'apple' },
          { label: 'Banana', value: 'banana' },
          { label: 'Cherry', value: 'cherry' },
          { label: 'Date', value: 'date' }
        ]}
      />
      <NText>Selected: {fruit}</NText>

      <NText className="text-lg font-bold">Size selection</NText>
      <NRadio
        label="Size"
        value={size}
        onValueChange={setSize}
        items={[
          { label: 'Small', value: 'sm' },
          { label: 'Medium', value: 'md' },
          { label: 'Large', value: 'lg' }
        ]}
      />

      <NText className="text-lg font-bold">Disabled</NText>
      <NRadio
        isDisabled
        value="a"
        onValueChange={() => {}}
        items={[
          { label: 'Option A', value: 'a' },
          { label: 'Option B', value: 'b' }
        ]}
      />
    </Screen>
  );
}
