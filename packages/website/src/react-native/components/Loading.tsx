"use client";

import ComponentWrapper from "@/helpers/ComponentWrapper";
import DemoComingSoon from "./DemoComingSoon";

const Loading = () => {
  return (
    <ComponentWrapper code={code} attributes={loadingAttributes}>
      <DemoComingSoon componentName="Loading" />
    </ComponentWrapper>
  );
};

export default Loading;

export const code = `import { View } from 'react-native';
import { NLoading, NText } from '@nayan-ui/native';

export default function LoadingScreen() {
  return (
    <View className="p-4 gap-4">
      <NText className="text-lg font-bold">Sizes</NText>
      <View className="flex-row gap-6 items-center">
        <NLoading size="sm" />
        <NLoading size="md" />
        <NLoading size="lg" />
      </View>

      <NText className="text-lg font-bold">Not loading</NText>
      <NLoading isLoading={false} />
      <NText className="text-muted">Nothing shows when isLoading=false</NText>

      <NText className="text-lg font-bold">In container</NText>
      <View className="h-32 bg-surface rounded-lg">
        <NLoading size="lg" containerClassName="flex-1 justify-center items-center" />
      </View>
    </View>
  );
}`;

export const loadingAttributes = [
  {
    name: "containerClassName",
    type: "string",
    default: "' '",
    details: "You can customise container by passing tailwind classes.",
  },
  {
    name: "...SpinnerProps",
    type: "SpinnerProps",
    default: "",
    details: "All heroui-native Spinner props are supported (size, color, etc.).",
  },
];
