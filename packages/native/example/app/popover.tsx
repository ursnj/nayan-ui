import { View } from 'react-native';
import { NButton, NPopover, NText } from '@nayan-ui/native';
import Screen from '../src/components/Screen';

export default function PopoverScreen() {
  return (
    <Screen title="NPopover">
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
          <NButton size="sm" onPress={() => {}}>
            View Profile
          </NButton>
        </View>
      </NPopover>
    </Screen>
  );
}
