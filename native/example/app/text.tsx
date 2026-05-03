import { ScrollView, View } from 'react-native';
import { NText } from '@nayan-ui/react-native';
import { Stack } from 'expo-router';

export default function TextScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'NText' }} />
      <ScrollView className="flex-1 bg-background">
        <View className="p-4 gap-3">
          <NText className="text-lg font-bold">Default</NText>
          <NText>This is default text with text-foreground color.</NText>

          <NText className="text-lg font-bold">Sizes</NText>
          <NText className="text-xs">Extra small text</NText>
          <NText className="text-sm">Small text</NText>
          <NText className="text-base">Base text (default)</NText>
          <NText className="text-lg">Large text</NText>
          <NText className="text-xl">Extra large text</NText>
          <NText className="text-2xl">2XL text</NText>
          <NText className="text-3xl">3XL text</NText>

          <NText className="text-lg font-bold">Weights</NText>
          <NText className="font-light">Light weight</NText>
          <NText className="font-normal">Normal weight</NText>
          <NText className="font-medium">Medium weight</NText>
          <NText className="font-semibold">Semibold weight</NText>
          <NText className="font-bold">Bold weight</NText>

          <NText className="text-lg font-bold">Colors</NText>
          <NText className="text-foreground">Foreground</NText>
          <NText className="text-muted">Muted</NText>
          <NText className="text-accent">Accent</NText>
          <NText className="text-danger">Danger</NText>

          <NText className="text-lg font-bold">Wrapping</NText>
          <NText>
            This is a long paragraph of text that demonstrates how NText handles wrapping across multiple lines. It should flow naturally within the
            container.
          </NText>
        </View>
      </ScrollView>
    </>
  );
}
