import { ScrollView, View } from 'react-native';
import { NMenu, NMenuItem, NSubMenu, NButton, NText } from '@nayan-ui/react-native';
import { Stack } from 'expo-router';

export default function SubMenuScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'NSubMenu' }} />
      <ScrollView className="flex-1 bg-background">
        <View className="p-4 gap-4">
          <NText className="text-lg font-bold">SubMenu in menu</NText>
          <NMenu trigger={<NButton variant="outline">Open Menu</NButton>}>
            <NMenuItem title="New File" onPress={() => {}} />
            <NMenuItem title="Open" onPress={() => {}} />
            <NSubMenu label="Share">
              <NMenuItem title="Email" onPress={() => {}} />
              <NMenuItem title="Message" onPress={() => {}} />
              <NMenuItem title="AirDrop" onPress={() => {}} />
            </NSubMenu>
            <NSubMenu label="Export As">
              <NMenuItem title="PDF" onPress={() => {}} />
              <NMenuItem title="PNG" onPress={() => {}} />
              <NMenuItem title="SVG" onPress={() => {}} />
            </NSubMenu>
          </NMenu>
        </View>
      </ScrollView>
    </>
  );
}
