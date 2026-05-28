import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { NPress, NText } from '@nayan-ui/native';
import { Stack } from 'expo-router';

export default function PressScreen() {
  const [count, setCount] = useState(0);

  return (
    <>
      <Stack.Screen options={{ title: 'NPress' }} />
      <ScrollView className="flex-1 bg-background">
        <View className="p-4 gap-4">
          <NText className="text-lg font-bold">Basic pressable</NText>
          <NPress className="p-4 bg-surface rounded-lg" onPress={() => setCount(count + 1)}>
            <NText>Tapped {count} times</NText>
          </NPress>

          <NText className="text-lg font-bold">Styled pressable</NText>
          <NPress className="p-6 bg-accent rounded-xl items-center" onPress={() => {}}>
            <NText className="text-white font-bold text-lg">Custom styled area</NText>
          </NPress>

          <NText className="text-lg font-bold">With long press</NText>
          <NPress className="p-4 bg-surface rounded-lg" onLongPress={() => setCount(0)}>
            <NText>Long press to reset counter</NText>
          </NPress>

          <NText className="text-lg font-bold">With feedback</NText>
          <NPress feedback className="p-4 bg-surface rounded-lg" onPress={() => setCount(count + 1)}>
            <NText>Tap with highlight & ripple feedback</NText>
          </NPress>

          <NText className="text-lg font-bold">Styled with feedback</NText>
          <NPress feedback className="p-6 bg-accent rounded-xl items-center" onPress={() => {}}>
            <NText className="text-white font-bold text-lg">Animated press area</NText>
          </NPress>

          <NText className="text-lg font-bold">Feedback with long press</NText>
          <NPress feedback className="p-4 bg-surface rounded-lg" onLongPress={() => setCount(0)}>
            <NText>Long press to reset counter</NText>
          </NPress>
        </View>
      </ScrollView>
    </>
  );
}
