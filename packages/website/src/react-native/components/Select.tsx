'use client';

import ComponentWrapper from '@/helpers/ComponentWrapper';
import DemoComingSoon from './DemoComingSoon';

const Select = () => {
  return (
    <ComponentWrapper code={code} attributes={selectAttributes}>
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

export const selectAttributes = [
  { name: 'items', type: 'SelectOption[]', default: 'Required', details: 'Array of select options with label and value.' },
  {
    name: 'onValueChange',
    type: '(value: string) => void',
    default: 'Required',
    details: 'Callback when selection changes (returns the value string).'
  },
  { name: 'label', type: 'string', default: 'Optional', details: 'Label above the select.' },
  { name: 'selectLabel', type: 'string', default: 'Optional', details: 'Label shown inside the dropdown list.' },
  { name: 'placeholder', type: 'string', default: 'Optional', details: 'Placeholder text for the select trigger.' },
  { name: 'defaultValue', type: 'SelectOption', default: 'Optional', details: 'Default selected option.' },
  { name: 'isDisabled', type: 'boolean', default: 'false', details: 'Whether the select is disabled.' },
  { name: 'containerClassName', type: 'string', default: "' '", details: 'You can customise container by passing tailwind classes.' },
  { name: 'labelClassName', type: 'string', default: "' '", details: 'You can customise label by passing tailwind classes.' },
  { name: 'triggerClassName', type: 'string', default: "' '", details: 'You can customise trigger by passing tailwind classes.' }
];
