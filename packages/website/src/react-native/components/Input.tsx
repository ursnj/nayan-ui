'use client';

import ComponentWrapper from '@/helpers/ComponentWrapper';
import DemoComingSoon from './DemoComingSoon';

const Input = () => {
  return (
    <ComponentWrapper code={code} attributes={inputAttributes}>
      <DemoComingSoon componentName="Input" />
    </ComponentWrapper>
  );
};

export default Input;

export const code = `import { View } from 'react-native';
import { NInput, NText } from '@nayan-ui/native';

export default function InputScreen() {
  return (
    <View className="p-4 gap-1">
      <NText className="text-lg font-bold">Basic</NText>
      <NInput label="Name" />

      <NText className="text-lg font-bold">With description</NText>
      <NInput label="Email" description="We'll never share your email." />

      <NText className="text-lg font-bold">Required</NText>
      <NInput label="Username" isRequired />

      <NText className="text-lg font-bold">Invalid with error</NText>
      <NInput label="Password" isInvalid errorMessage="Password must be at least 8 characters." />

      <NText className="text-lg font-bold">Disabled</NText>
      <NInput label="Organization" isDisabled />

      <NText className="text-lg font-bold">Multiline (textarea)</NText>
      <NInput label="Bio" multiline description="Tell us about yourself." />

      <NText className="text-lg font-bold">All combined</NText>
      <NInput label="Phone" description="Include country code." isRequired isInvalid errorMessage="Invalid phone number." />
    </View>
  );
}`;

export const inputAttributes = [
  { name: 'label', type: 'string', default: 'Optional', details: 'Label for the input field.' },
  { name: 'description', type: 'string', default: 'Optional', details: 'Description text below the input.' },
  { name: 'errorMessage', type: 'string', default: 'Optional', details: 'Error message to display.' },
  { name: 'multiline', type: 'boolean', default: 'false', details: 'Whether to render as a multiline textarea.' },
  { name: 'isDisabled', type: 'boolean', default: 'false', details: 'Whether the input is disabled.' },
  { name: 'isRequired', type: 'boolean', default: 'false', details: 'Whether the input is required.' },
  { name: 'isInvalid', type: 'boolean', default: 'false', details: 'Whether the input is in an invalid state.' },
  { name: 'value', type: 'string', default: 'Optional', details: 'Controlled input value.' },
  { name: 'onChange', type: '(value: string) => void', default: 'Optional', details: 'Callback when input value changes.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise input by passing tailwind classes.' },
  { name: 'containerClassName', type: 'string', default: "' '", details: 'You can customise container by passing tailwind classes.' },
  { name: 'labelClassName', type: 'string', default: "' '", details: 'You can customise label by passing tailwind classes.' },
  { name: 'descriptionClassName', type: 'string', default: "' '", details: 'You can customise description by passing tailwind classes.' },
  { name: 'errorClassName', type: 'string', default: "' '", details: 'You can customise error by passing tailwind classes.' }
];
