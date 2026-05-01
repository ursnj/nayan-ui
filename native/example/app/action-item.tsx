import { ScrollView, View } from 'react-native';
import { NActionItem, NText, NDivider } from '@nayan-ui/react-native';
import { Stack } from 'expo-router';

export default function ActionItemScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'NActionItem' }} />
      <ScrollView className="flex-1 bg-background">
        <View className="p-4 gap-1">
          <NText className="text-lg font-bold mb-2">Basic</NText>
          <NActionItem name="Profile" description="View your profile" onPress={() => {}} />
          <NDivider />
          <NActionItem name="Settings" description="App preferences" onPress={() => {}} />
          <NDivider />
          <NActionItem name="Notifications" onPress={() => {}} />

          <NText className="text-lg font-bold mt-4 mb-2">Disabled</NText>
          <NActionItem name="Locked" description="You don't have access" isDisabled onPress={() => {}} />

          <NText className="text-lg font-bold mt-4 mb-2">Long press</NText>
          <NActionItem name="Hold me" description="Supports onLongPress" onLongPress={() => {}} />
        </View>
      </ScrollView>
    </>
  );
}
