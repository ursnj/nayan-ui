'use client';

import ComponentWrapper from '@/helpers/ComponentWrapper';
import DemoComingSoon from './DemoComingSoon';

const Button = () => {
  return (
    <ComponentWrapper code={code}>
      <DemoComingSoon componentName="Button" />
    </ComponentWrapper>
  );
};

export default Button;

export const code = `import { View } from 'react-native';
import { NButton, NText } from '@nayan-ui/native';

export default function ButtonScreen() {
  return (
    <View className="p-4 gap-3">
      <NText className="text-lg font-bold">Variants</NText>
      <NButton variant="primary" onPress={() => {}}>
        Primary
      </NButton>
      <NButton variant="secondary" onPress={() => {}}>
        Secondary
      </NButton>
      <NButton variant="outline" onPress={() => {}}>
        Outline
      </NButton>
      <NButton variant="danger" onPress={() => {}}>
        Danger
      </NButton>
      <NButton variant="ghost" onPress={() => {}}>
        Ghost
      </NButton>

      <NText className="text-lg font-bold">Sizes</NText>
      <NButton size="sm" onPress={() => {}}>
        Small
      </NButton>
      <NButton size="md" onPress={() => {}}>
        Medium (default)
      </NButton>
      <NButton size="lg" onPress={() => {}}>
        Large
      </NButton>

      <NText className="text-lg font-bold">Disabled</NText>
      <NButton isDisabled onPress={() => {}}>
        Disabled Primary
      </NButton>
      <NButton variant="outline" isDisabled onPress={() => {}}>
        Disabled Outline
      </NButton>

      <NText className="text-lg font-bold">Full width</NText>
      <NButton className="w-full" onPress={() => {}}>
        Full Width
      </NButton>
    </View>
  );
}`;

export const buttonAttributes = [
  { name: 'children', type: 'React.ReactNode', default: 'Required', details: 'Button label content.' },
  { name: 'icon', type: 'React.ComponentType<any> | React.ReactElement', default: 'Optional', details: 'Icon component or element to display.' },
  { name: 'variant', type: "'primary' | 'secondary' | 'outline' | 'ghost' | 'link'", default: "'primary'", details: 'Button variant style.' },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'", details: 'Button size.' },
  { name: 'isDisabled', type: 'boolean', default: 'false', details: 'Whether the button is disabled.' },
  { name: 'onPress', type: '() => void', default: 'Optional', details: 'Callback when button is pressed.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' }
];
