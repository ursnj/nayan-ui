import { ScrollView, View } from 'react-native';
import { NDivider, NText } from '@nayan-ui/react-native';
import { Stack } from 'expo-router';

export default function DividerScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'NDivider' }} />
      <ScrollView className="flex-1 bg-background">
        <View className="p-4 gap-4">
          <NText className="text-lg font-bold">Horizontal (default)</NText>
          <NText>Above</NText>
          <NDivider />
          <NText>Below</NText>

          <NText className="text-lg font-bold">Vertical</NText>
          <View className="flex-row items-center gap-3 h-10">
            <NText>Left</NText>
            <NDivider orientation="vertical" />
            <NText>Right</NText>
          </View>

          <NText className="text-lg font-bold">Custom thickness</NText>
          <NDivider thickness={3} />
        </View>
      </ScrollView>
    </>
  );
}
