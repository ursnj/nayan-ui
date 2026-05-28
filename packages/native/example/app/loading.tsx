import { ScrollView, View } from 'react-native';
import { NLoading, NText } from '@nayan-ui/native';
import { Stack } from 'expo-router';

export default function LoadingScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'NLoading' }} />
      <ScrollView className="flex-1 bg-background">
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
      </ScrollView>
    </>
  );
}
