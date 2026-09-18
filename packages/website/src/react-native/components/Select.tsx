'use client';

import ComponentWrapper from '@/helpers/ComponentWrapper';
import DemoComingSoon from './DemoComingSoon';

const Select = () => {
  return (
    <ComponentWrapper code={code}>
      <DemoComingSoon componentName="Select" />
    </ComponentWrapper>
  );
};

export default Select;

export const code = `import { View } from 'react-native';
import { useState } from 'react';
import { NSelect, NText } from '@nayan-ui/native';

export default function SelectScreen() {
  const [country, setCountry] = useState('');

  return (
    <View className="p-4 gap-4">
      <NText className="text-lg font-bold">Basic</NText>
      <NSelect
        label="Country"
        placeholder="Select a country"
        items={[
          { label: 'India', value: 'in' },
          { label: 'USA', value: 'us' },
          { label: 'UK', value: 'uk' },
          { label: 'Germany', value: 'de' },
          { label: 'Japan', value: 'jp' }
        ]}
        onValueChange={setCountry}
      />
      <NText>Selected: {country || '—'}</NText>

      <NText className="text-lg font-bold">With default value</NText>
      <NSelect
        label="Language"
        defaultValue={{ label: 'English', value: 'en' }}
        items={[
          { label: 'English', value: 'en' },
          { label: 'Spanish', value: 'es' },
          { label: 'French', value: 'fr' }
        ]}
        onValueChange={() => {}}
      />

      <NText className="text-lg font-bold">Disabled</NText>
      <NSelect label="Locked" isDisabled items={[{ label: 'Only option', value: 'only' }]} onValueChange={() => {}} />
    </View>
  );
}`;
