import { ScrollView, View } from 'react-native';
import { NMenu, NMenuItem, NButton, NText } from '@nayan-ui/react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';

export default function MenuScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'NMenu & NMenuItem' }} />
      <ScrollView className="flex-1 bg-background">
        <View className="p-4 gap-4">
          <NText className="text-lg font-bold">Basic menu</NText>
          <NMenu trigger={<NButton variant="outline">Open Menu</NButton>} title="Actions">
            <NMenuItem title="Edit" icon={<Ionicons name="create-outline" size={16} />} onPress={() => console.log('Edit')} />
            <NMenuItem title="Duplicate" icon={<Ionicons name="copy-outline" size={16} />} onPress={() => console.log('Duplicate')} />
            <NMenuItem title="Archive" icon={<Ionicons name="archive-outline" size={16} />} onPress={() => console.log('Archive')} />
          </NMenu>

          <NText className="text-lg font-bold">With separators</NText>
          <NMenu trigger={<NButton variant="outline">File Menu</NButton>}>
            <NMenuItem title="New" icon={<Ionicons name="add-circle-outline" size={16} />} onPress={() => {}} />
            <NMenuItem title="Open" icon={<Ionicons name="folder-open-outline" size={16} />} onPress={() => {}} />
            <NMenuItem title="Save" icon={<Ionicons name="save-outline" size={16} />} onPress={() => {}} hasSeparator />
            <NMenuItem title="Delete" icon={<Ionicons name="trash-outline" size={16} />} onPress={() => {}} />
          </NMenu>

          <NText className="text-lg font-bold">With disabled item</NText>
          <NMenu trigger={<NButton variant="outline">Options</NButton>}>
            <NMenuItem title="Available" icon={<Ionicons name="checkmark-circle-outline" size={16} />} onPress={() => {}} />
            <NMenuItem title="Locked" icon={<Ionicons name="lock-closed-outline" size={16} />} onPress={() => {}} isDisabled />
          </NMenu>

          <NText className="text-lg font-bold">With shortcuts</NText>
          <NMenu trigger={<NButton variant="outline">Edit</NButton>}>
            <NMenuItem title="Cut" icon={<Ionicons name="cut-outline" size={16} />} shortcut="⌘X" onPress={() => {}} />
            <NMenuItem title="Copy" icon={<Ionicons name="copy-outline" size={16} />} shortcut="⌘C" onPress={() => {}} />
            <NMenuItem title="Paste" icon={<Ionicons name="clipboard-outline" size={16} />} shortcut="⌘V" onPress={() => {}} />
          </NMenu>
        </View>
      </ScrollView>
    </>
  );
}
