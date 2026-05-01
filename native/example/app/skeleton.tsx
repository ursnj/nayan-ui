import { ScrollView, View } from 'react-native';
import { NSkeleton, NSkeletonGroup, NText } from '@nayan-ui/react-native';
import { Stack } from 'expo-router';

export default function SkeletonScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'NSkeleton' }} />
      <ScrollView className="flex-1 bg-background">
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
      </ScrollView>
    </>
  );
}
