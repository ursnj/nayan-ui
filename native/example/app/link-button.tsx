import { ScrollView, View } from 'react-native';
import { NLinkButton, NText } from '@nayan-ui/react-native';
import { Stack } from 'expo-router';

export default function LinkButtonScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'NLinkButton' }} />
      <ScrollView className="flex-1 bg-background">
        <View className="p-4 gap-4">
          <NText className="text-lg font-bold">Basic</NText>
          <NLinkButton onPress={() => {}}>Learn more</NLinkButton>

          <NText className="text-lg font-bold">Sizes</NText>
          <NLinkButton size="sm" onPress={() => {}}>Small link</NLinkButton>
          <NLinkButton size="md" onPress={() => {}}>Medium link</NLinkButton>
          <NLinkButton size="lg" onPress={() => {}}>Large link</NLinkButton>

          <NText className="text-lg font-bold">Disabled</NText>
          <NLinkButton isDisabled onPress={() => {}}>Disabled link</NLinkButton>
        </View>
      </ScrollView>
    </>
  );
}
