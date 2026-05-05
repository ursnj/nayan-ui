import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { NButton, NSheet, NText } from '@nayan-ui/react-native';
import { Stack } from 'expo-router';

export default function SheetScreen() {
  const [basic, setBasic] = useState(false);
  const [content, setContent] = useState(false);

  return (
    <>
      <Stack.Screen options={{ title: 'NSheet' }} />
      <ScrollView className="flex-1 bg-background">
        <View className="p-4 gap-4">
          <NText className="text-lg font-bold">Basic</NText>
          <NButton onPress={() => setBasic(true)}>Open Sheet</NButton>
          <NSheet isOpen={basic} onOpenChange={setBasic}>
            <View className="p-4">
              <NText className="text-lg font-bold mb-2">Bottom Sheet</NText>
              <NText>Simple sheet content.</NText>
              <NButton className="mt-4" variant="outline" onPress={() => setBasic(false)}>
                Close
              </NButton>
            </View>
          </NSheet>

          <NText className="text-lg font-bold">Rich content</NText>
          <NButton variant="outline" onPress={() => setContent(true)}>
            Open Rich Sheet
          </NButton>
          <NSheet isOpen={content} onOpenChange={setContent}>
            <View className="p-4 gap-3">
              <NText className="text-xl font-bold">Settings</NText>
              <NText className="text-muted">Adjust your preferences below.</NText>
              <NButton onPress={() => setContent(false)}>Save</NButton>
              <NButton variant="ghost" onPress={() => setContent(false)}>
                Cancel
              </NButton>
            </View>
          </NSheet>
        </View>
      </ScrollView>
    </>
  );
}
