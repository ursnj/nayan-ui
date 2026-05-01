import { ScrollView, View } from 'react-native';
import { NMenu, NMenuItem, NButton, NText } from '@nayan-ui/react-native';
import { Stack } from 'expo-router';

export default function MenuScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'NMenu & NMenuItem' }} />
      <ScrollView className="flex-1 bg-background">
        <View className="p-4 gap-4">
          <NText className="text-lg font-bold">Basic menu</NText>
          <NMenu trigger={<NButton variant="outline">Open Menu</NButton>} title="Actions">
            <NMenuItem title="Edit" onPress={() => {}} />
            <NMenuItem title="Duplicate" onPress={() => {}} />
            <NMenuItem title="Archive" onPress={() => {}} />
          </NMenu>

          <NText className="text-lg font-bold">With separators</NText>
          <NMenu trigger={<NButton variant="outline">File Menu</NButton>}>
            <NMenuItem title="New" onPress={() => {}} />
            <NMenuItem title="Open" onPress={() => {}} />
            <NMenuItem title="Save" onPress={() => {}} hasSeparator />
            <NMenuItem title="Delete" onPress={() => {}} />
          </NMenu>

          <NText className="text-lg font-bold">With disabled item</NText>
          <NMenu trigger={<NButton variant="outline">Options</NButton>}>
            <NMenuItem title="Available" onPress={() => {}} />
            <NMenuItem title="Locked" onPress={() => {}} isDisabled />
          </NMenu>

          <NText className="text-lg font-bold">With shortcuts</NText>
          <NMenu trigger={<NButton variant="outline">Edit</NButton>}>
            <NMenuItem title="Cut" shortcut="⌘X" onPress={() => {}} />
            <NMenuItem title="Copy" shortcut="⌘C" onPress={() => {}} />
            <NMenuItem title="Paste" shortcut="⌘V" onPress={() => {}} />
          </NMenu>
        </View>
      </ScrollView>
    </>
  );
}
