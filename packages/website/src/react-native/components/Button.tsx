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
