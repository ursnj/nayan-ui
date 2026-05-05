import { ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NActionItem, NDivider, NText } from '@nayan-ui/react-native';
import { Stack } from 'expo-router';

export default function ActionItemScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'NActionItem' }} />
      <ScrollView className="flex-1 bg-background">
        <View className="p-4 gap-1">
          <NText className="text-lg font-bold mb-2">Basic with icons</NText>
          <NActionItem name="Profile" description="View your profile" icon={<Ionicons name="person-outline" size={20} />} onPress={() => {}} />
          <NDivider />
          <NActionItem name="Settings" description="App preferences" icon={<Ionicons name="settings-outline" size={20} />} onPress={() => {}} />
          <NDivider />
          <NActionItem name="Notifications" icon={<Ionicons name="notifications-outline" size={20} />} onPress={() => {}} />

          <NText className="text-lg font-bold mt-4 mb-2">Disabled</NText>
          <NActionItem
            name="Locked"
            description="You don't have access"
            icon={<Ionicons name="lock-closed-outline" size={20} />}
            isDisabled
            onPress={() => {}}
          />

          <NText className="text-lg font-bold mt-4 mb-2">Long press</NText>
          <NActionItem
            name="Hold me"
            description="Supports onLongPress"
            icon={<Ionicons name="hand-left-outline" size={20} />}
            onLongPress={() => {}}
          />
        </View>
      </ScrollView>
    </>
  );
}
