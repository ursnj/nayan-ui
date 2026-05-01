import { ScrollView, View } from 'react-native';
import { NPopover, NButton, NText } from '@nayan-ui/react-native';
import { Stack } from 'expo-router';

export default function PopoverScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'NPopover' }} />
      <ScrollView className="flex-1 bg-background">
        <View className="p-4 gap-4">
          <NText className="text-lg font-bold">Default (bottom)</NText>
          <NPopover trigger={<NButton variant="outline">Open Popover</NButton>}>
            <View className="p-3">
              <NText>Popover content below the trigger.</NText>
            </View>
          </NPopover>

          <NText className="text-lg font-bold">Placement top</NText>
          <NPopover placement="top" trigger={<NButton variant="outline">Top</NButton>}>
            <View className="p-3">
              <NText>Above the trigger.</NText>
            </View>
          </NPopover>

          <NText className="text-lg font-bold">Placement left</NText>
          <NPopover placement="left" trigger={<NButton variant="outline">Left</NButton>}>
            <View className="p-3">
              <NText>Left side.</NText>
            </View>
          </NPopover>

          <NText className="text-lg font-bold">Placement right</NText>
          <NPopover placement="right" trigger={<NButton variant="outline">Right</NButton>}>
            <View className="p-3">
              <NText>Right side.</NText>
            </View>
          </NPopover>

          <NText className="text-lg font-bold">Rich content</NText>
          <NPopover trigger={<NButton>Details</NButton>}>
            <View className="p-3 gap-2">
              <NText className="font-bold">User Info</NText>
              <NText className="text-muted">john@example.com</NText>
              <NButton size="sm" onPress={() => {}}>View Profile</NButton>
            </View>
          </NPopover>
        </View>
      </ScrollView>
    </>
  );
}
