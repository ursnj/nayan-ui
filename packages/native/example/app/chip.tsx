import { View } from "react-native";
import { NChip, NText } from "@nayan-ui/native";
import Screen from "../src/components/Screen";

export default function ChipScreen() {
  return (
    <Screen title="NChip">
      <NText className="text-lg font-bold">Colors</NText>
      <View className="flex-row gap-2 flex-wrap">
        <NChip>Default</NChip>
        <NChip color="accent">Accent</NChip>
        <NChip color="success">Success</NChip>
        <NChip color="warning">Warning</NChip>
        <NChip color="danger">Danger</NChip>
      </View>

      <NText className="text-lg font-bold">Variants</NText>
      <View className="flex-row gap-2 flex-wrap">
        <NChip variant="primary">Primary</NChip>
        <NChip variant="secondary">Secondary</NChip>
        <NChip variant="tertiary">Tertiary</NChip>
        <NChip variant="soft">Soft</NChip>
      </View>

      <NText className="text-lg font-bold">Sizes</NText>
      <View className="flex-row gap-2 items-center">
        <NChip size="sm">Small</NChip>
        <NChip size="md">Medium</NChip>
        <NChip size="lg">Large</NChip>
      </View>
    </Screen>
  );
}
