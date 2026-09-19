'use client';

import ComponentWrapper from '@/helpers/ComponentWrapper';
import DemoComingSoon from './DemoComingSoon';

const Skeleton = () => {
  return (
    <ComponentWrapper code={code} attributes={skeletonAttributes}>
      <DemoComingSoon componentName="Skeleton" />
    </ComponentWrapper>
  );
};

export default Skeleton;

export const code = `import { View } from 'react-native';
import { NSkeleton, NSkeletonGroup, NText } from '@nayan-ui/native';

export default function SkeletonScreen() {
  return (
    <View className="p-4 gap-4">
      <NText className="text-lg font-bold">Basic</NText>
      <NSkeleton className="h-10 w-full rounded" isLoading />
      <NSkeleton className="h-10 w-3/4 rounded" isLoading />
      <NSkeleton className="h-10 w-1/2 rounded" isLoading />

      <NText className="text-lg font-bold">Shimmer variant</NText>
      <NSkeleton className="h-20 w-full rounded-lg" isLoading variant="shimmer" />

      <NText className="text-lg font-bold">Pulse variant</NText>
      <NSkeleton className="h-20 w-full rounded-lg" isLoading variant="pulse" />

      <NText className="text-lg font-bold">Card skeleton</NText>
      <View className="gap-2">
        <NSkeleton className="h-40 w-full rounded-lg" isLoading />
        <NSkeleton className="h-4 w-2/3 rounded" isLoading />
        <NSkeleton className="h-4 w-1/3 rounded" isLoading />
      </View>

      <NText className="text-lg font-bold">NSkeletonGroup</NText>
      <NSkeletonGroup isLoading>
        <View className="flex-row gap-3 items-center">
          <NSkeleton className="h-12 w-12 rounded-full" />
          <View className="flex-1 gap-2">
            <NSkeleton className="h-4 w-3/4 rounded" />
            <NSkeleton className="h-3 w-1/2 rounded" />
          </View>
        </View>
      </NSkeletonGroup>

      <NText className="text-lg font-bold">Not loading</NText>
      <NSkeleton className="h-10 w-full rounded" isLoading={false}>
        <NText>Content loaded!</NText>
      </NSkeleton>
    </View>
  );
}`;

export const skeletonAttributes = [{ name: 'className', type: 'string', default: "' '", details: 'You can customise by passing tailwind classes.' }];

export const switchAttributes = [
  { name: 'label', type: 'string', default: 'Optional', details: 'Label for the switch.' },
  { name: 'isSelected', type: 'boolean', default: 'false', details: 'Whether the switch is selected.' },
  { name: 'isDisabled', type: 'boolean', default: 'false', details: 'Whether the switch is disabled.' },
  { name: 'onSelectedChange', type: '(selected: boolean) => void', default: 'Optional', details: 'Callback when switch state changes.' },
  { name: 'className', type: 'string', default: "' '", details: 'You can customise switch by passing tailwind classes.' },
  { name: 'containerClassName', type: 'string', default: "' '", details: 'You can customise container by passing tailwind classes.' },
  { name: 'labelClassName', type: 'string', default: "' '", details: 'You can customise label by passing tailwind classes.' }
];
