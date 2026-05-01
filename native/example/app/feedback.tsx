import { ScrollView, View } from 'react-native';
import { NAlert, NButton, NLoading, NSkeleton, NSkeletonGroup, NProgress, NText, useNToast } from '@nayan-ui/react-native';
import { Stack } from 'expo-router';

export default function FeedbackScreen() {
  const toast = useNToast();

  return (
    <>
      <Stack.Screen options={{ title: 'Feedback' }} />
      <ScrollView className="flex-1 bg-background">
        <View className="p-4 gap-4">
          <NText className="text-lg font-bold">NToast</NText>
          <View className="flex-row gap-2">
            <NButton size="sm" onPress={() => toast.success('Saved!')}>Success</NButton>
            <NButton size="sm" variant="danger" onPress={() => toast.error('Failed!')}>Error</NButton>
            <NButton size="sm" variant="outline" onPress={() => toast.info('FYI')}>Info</NButton>
          </View>

          <NText className="text-lg font-bold mt-2">NAlert</NText>
          <NAlert title="Info" description="This is an informational alert." />
          <NAlert status="success" title="Success" description="Operation completed." />
          <NAlert status="warning" title="Warning" description="Please check your input." />
          <NAlert status="danger" title="Error" description="Something went wrong." />

          <NText className="text-lg font-bold mt-2">NProgress</NText>
          <NProgress value={65} />

          <NText className="text-lg font-bold mt-2">NLoading</NText>
          <View className="h-20">
            <NLoading size="lg" />
          </View>

          <NText className="text-lg font-bold mt-2">NSkeleton</NText>
          <NSkeleton className="h-10 w-full rounded" isLoading />
          <NSkeleton className="h-10 w-3/4 rounded mt-2" isLoading />

          <NText className="text-lg font-bold mt-2">NSkeletonGroup</NText>
          <NSkeletonGroup isLoading>
            <NSkeleton className="h-24 w-full rounded" />
            <NSkeleton className="h-4 w-2/3 rounded mt-2" />
            <NSkeleton className="h-4 w-1/2 rounded mt-2" />
          </NSkeletonGroup>
        </View>
      </ScrollView>
    </>
  );
}
