import { useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import {
  NButton,
  NDialog,
  NConfirm,
  NPopover,
  NTooltip,
  NSheet,
  NText,
} from '@nayan-ui/react-native';
import { Stack } from 'expo-router';

export default function OverlaysScreen() {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      <Stack.Screen options={{ title: 'Overlays' }} />
      <ScrollView className="flex-1 bg-background">
        <View className="p-4 gap-4">
          <NText className="text-lg font-bold">NDialog</NText>
          <NDialog title="Dialog Title" trigger={<NButton>Open Dialog</NButton>}>
            <View className="p-3">
              <NText>This is a dialog body.</NText>
            </View>
          </NDialog>

          <NText className="text-lg font-bold mt-2">NConfirm</NText>
          <NConfirm
            title="Delete Item?"
            description="This action cannot be undone."
            onResult={(ok) => Alert.alert(ok ? 'Confirmed' : 'Cancelled')}>
            <NButton variant="danger">Delete</NButton>
          </NConfirm>

          <NText className="text-lg font-bold mt-2">NPopover</NText>
          <NPopover trigger={<NButton variant="outline">Open Popover</NButton>}>
            <View className="p-3">
              <NText>Popover content</NText>
            </View>
          </NPopover>

          <NText className="text-lg font-bold mt-2">NTooltip</NText>
          <NTooltip message="This is a tooltip">
            <NButton variant="ghost">Hover / Press me</NButton>
          </NTooltip>

          <NText className="text-lg font-bold mt-2">NSheet</NText>
          <NButton onPress={() => setSheetOpen(true)}>Open Sheet</NButton>
          <NSheet isOpen={sheetOpen} onOpenChange={setSheetOpen}>
            <View className="p-4">
              <NText className="text-lg font-bold mb-2">Bottom Sheet</NText>
              <NText>Sheet content goes here.</NText>
              <NButton className="mt-4" onPress={() => setSheetOpen(false)}>
                Close
              </NButton>
            </View>
          </NSheet>
        </View>
      </ScrollView>
    </>
  );
}
