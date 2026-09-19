import { NButton, NText } from "@nayan-ui/native";
import Screen from "../src/components/Screen";

export default function ButtonScreen() {
  return (
    <Screen title="NButton" gap={3}>
      <NText className="text-lg font-bold">Variants</NText>
      <NButton variant="primary" onPress={() => {}}>
        Primary
      </NButton>
      <NButton variant="secondary" onPress={() => {}}>
        Secondary
      </NButton>
      <NButton variant="outline" onPress={() => {}}>
        Outline
      </NButton>
      <NButton variant="danger" onPress={() => {}}>
        Danger
      </NButton>
      <NButton variant="ghost" onPress={() => {}}>
        Ghost
      </NButton>

      <NText className="text-lg font-bold">Sizes</NText>
      <NButton size="sm" onPress={() => {}}>
        Small
      </NButton>
      <NButton size="md" onPress={() => {}}>
        Medium (default)
      </NButton>
      <NButton size="lg" onPress={() => {}}>
        Large
      </NButton>

      <NText className="text-lg font-bold">Disabled</NText>
      <NButton isDisabled onPress={() => {}}>
        Disabled Primary
      </NButton>
      <NButton variant="outline" isDisabled onPress={() => {}}>
        Disabled Outline
      </NButton>

      <NText className="text-lg font-bold">Full width</NText>
      <NButton className="w-full" onPress={() => {}}>
        Full Width
      </NButton>
    </Screen>
  );
}
