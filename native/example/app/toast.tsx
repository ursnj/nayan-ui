import { ScrollView, View } from 'react-native';
import { NButton, NText, useNToast } from '@nayan-ui/react-native';
import { Stack } from 'expo-router';

export default function ToastScreen() {
  const toast = useNToast();

  return (
    <>
      <Stack.Screen options={{ title: 'useNToast' }} />
      <ScrollView className="flex-1 bg-background">
        <View className="p-4 gap-4">
          <NText className="text-lg font-bold">Shorthand methods</NText>
          <NButton onPress={() => toast.success('Changes saved successfully!')}>Success</NButton>
          <NButton variant="danger" onPress={() => toast.error('Something went wrong.')}>
            Error
          </NButton>
          <NButton variant="outline" onPress={() => toast.info('New update available.')}>
            Info
          </NButton>
          <NButton variant="ghost" onPress={() => toast.warning('Low disk space.')}>
            Warning
          </NButton>

          <NText className="text-lg font-bold">With custom title</NText>
          <NButton variant="outline" onPress={() => toast.success('Your profile has been updated.', 'Profile')}>
            Success with title
          </NButton>
          <NButton variant="outline" onPress={() => toast.error('Please check your connection.', 'Network')}>
            Error with title
          </NButton>

          <NText className="text-lg font-bold">Generic show()</NText>
          <NButton variant="outline" onPress={() => toast.show({ type: 'info', title: 'Custom', message: 'Using toast.show() directly.' })}>
            toast.show()
          </NButton>
        </View>
      </ScrollView>
    </>
  );
}
