import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { NButton, NConfirm, NText } from '@nayan-ui/native';
import { Stack } from 'expo-router';

export default function ConfirmScreen() {
  const [result, setResult] = useState<string>('—');

  return (
    <>
      <Stack.Screen options={{ title: 'NConfirm' }} />
      <ScrollView className="flex-1 bg-background">
        <View className="p-4 gap-4">
          <NText className="text-lg font-bold">Basic confirm</NText>
          <NConfirm title="Delete item?" description="This action cannot be undone." onResult={ok => setResult(ok ? 'Confirmed' : 'Cancelled')}>
            <NButton variant="danger">Delete</NButton>
          </NConfirm>
          <NText>Result: {result}</NText>

          <NText className="text-lg font-bold">Custom button text</NText>
          <NConfirm
            title="Discard changes?"
            description="You have unsaved changes."
            confirmText="Discard"
            cancelText="Keep editing"
            onResult={ok => setResult(ok ? 'Discarded' : 'Kept')}>
            <NButton variant="outline">Discard</NButton>
          </NConfirm>
        </View>
      </ScrollView>
    </>
  );
}
