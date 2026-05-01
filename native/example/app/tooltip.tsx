import { ScrollView, View } from 'react-native';
import { NTooltip, NButton, NText } from '@nayan-ui/react-native';
import { Stack } from 'expo-router';

export default function TooltipScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'NTooltip' }} />
      <ScrollView className="flex-1 bg-background">
        <View className="p-4 gap-4">
          <NText className="text-lg font-bold">Basic</NText>
          <NTooltip message="This is a tooltip">
            <NButton variant="outline">Hover / Press</NButton>
          </NTooltip>

          <NText className="text-lg font-bold">On different elements</NText>
          <NTooltip message="Button tooltip">
            <NButton>Primary button</NButton>
          </NTooltip>

          <NTooltip message="Ghost tooltip">
            <NButton variant="ghost">Ghost button</NButton>
          </NTooltip>

          <NText className="text-lg font-bold">Long message</NText>
          <NTooltip message="This is a longer tooltip message that provides more context about the element it's attached to.">
            <NButton variant="outline">More info</NButton>
          </NTooltip>
        </View>
      </ScrollView>
    </>
  );
}
