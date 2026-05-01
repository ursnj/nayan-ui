import { ScrollView, View } from 'react-native';
import {
  NMenu,
  NMenuItem,
  NSubMenu,
  NText,
  NButton,
} from '@nayan-ui/react-native';
import { Stack } from 'expo-router';

export default function NavigationScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Navigation' }} />
      <ScrollView className="flex-1 bg-background">
        <View className="p-4 gap-4">
          <NText className="text-lg font-bold">NMenu</NText>
          <NMenu trigger={<NButton variant="outline">Open Menu</NButton>} title="Actions">
            <NMenuItem title="Edit" onPress={() => {}} />
            <NMenuItem title="Duplicate" onPress={() => {}} />
            <NMenuItem title="Delete" onPress={() => {}} hasSeparator />
            <NMenuItem title="Disabled" onPress={() => {}} isDisabled />
          </NMenu>

          <NText className="text-lg font-bold mt-2">NSubMenu</NText>
          <NMenu trigger={<NButton variant="outline">Menu with SubMenu</NButton>}>
            <NMenuItem title="New File" onPress={() => {}} />
            <NSubMenu label="Share">
              <NMenuItem title="Email" onPress={() => {}} />
              <NMenuItem title="Message" onPress={() => {}} />
            </NSubMenu>
          </NMenu>
        </View>
      </ScrollView>
    </>
  );
}
