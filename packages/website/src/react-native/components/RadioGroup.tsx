"use client";

import ComponentWrapper from "@/helpers/ComponentWrapper";
import DemoComingSoon from "./DemoComingSoon";

const RadioGroup = () => {
  return (
    <ComponentWrapper code={code} attributes={radioAttributes}>
      <DemoComingSoon componentName="RadioGroup" />
    </ComponentWrapper>
  );
};

export default RadioGroup;

export const code = `import { View } from 'react-native';
import { useState } from 'react';
import { NRadio, NText } from '@nayan-ui/native';

export default function RadioScreen() {
  const [fruit, setFruit] = useState('apple');
  const [size, setSize] = useState('md');

  return (
    <View className="p-4 gap-4">
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
    </View>
  );
}`;

export const radioAttributes = [
  { name: "value", type: "string", default: "Required", details: "Currently selected value." },
  {
    name: "items",
    type: "RadioItem[]",
    default: "Required",
    details: "Array of radio items with label and value.",
  },
  {
    name: "onValueChange",
    type: "(value: string) => void",
    default: "Required",
    details: "Callback when selection changes.",
  },
  { name: "label", type: "string", default: "Optional", details: "Label for the radio group." },
  {
    name: "isDisabled",
    type: "boolean",
    default: "false",
    details: "Whether the radio group is disabled.",
  },
  {
    name: "className",
    type: "string",
    default: "' '",
    details: "You can customise container by passing tailwind classes.",
  },
  {
    name: "labelClassName",
    type: "string",
    default: "' '",
    details: "You can customise group label by passing tailwind classes.",
  },
  {
    name: "itemClassName",
    type: "string",
    default: "' '",
    details: "You can customise individual radio items by passing tailwind classes.",
  },
];
