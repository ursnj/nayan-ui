import { ScrollView, View } from 'react-native';
import { NCard, NDivider, NAvatar, NChip, NText } from '@nayan-ui/react-native';
import { Stack } from 'expo-router';

export default function LayoutScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Layout Components' }} />
      <ScrollView className="flex-1 bg-background">
        <View className="p-4 gap-4">
          <NText className="text-lg font-bold">NCard</NText>
          <NCard>
            <NText className="font-bold text-lg">Card Title</NText>
            <NText className="text-muted mt-1">Card description text.</NText>
          </NCard>

          <NText className="text-lg font-bold mt-2">NDivider</NText>
          <NText>Above divider</NText>
          <NDivider />
          <NText>Below divider</NText>

          <NText className="text-lg font-bold mt-2">NAvatar</NText>
          <View className="flex-row gap-3">
            <NAvatar src="https://i.pravatar.cc/100?img=1" size="sm" />
            <NAvatar src="https://i.pravatar.cc/100?img=2" size="md" />
            <NAvatar fallback="JD" size="lg" color="accent" />
          </View>

          <NText className="text-lg font-bold mt-2">NChip</NText>
          <View className="flex-row gap-2 flex-wrap">
            <NChip>Default</NChip>
            <NChip color="success">Success</NChip>
            <NChip color="warning">Warning</NChip>
            <NChip color="danger">Danger</NChip>
            <NChip variant="soft">Soft</NChip>
          </View>
        </View>
      </ScrollView>
    </>
  );
}
