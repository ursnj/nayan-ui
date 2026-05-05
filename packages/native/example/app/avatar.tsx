import { ScrollView, View } from 'react-native';
import { NAvatar, NText } from '@nayan-ui/react-native';
import { Stack } from 'expo-router';

export default function AvatarScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'NAvatar' }} />
      <ScrollView className="flex-1 bg-background">
        <View className="p-4 gap-4">
          <NText className="text-lg font-bold">Sizes</NText>
          <View className="flex-row gap-3 items-center">
            <NAvatar src="https://i.pravatar.cc/100?img=1" size="sm" />
            <NAvatar src="https://i.pravatar.cc/100?img=2" size="md" />
            <NAvatar src="https://i.pravatar.cc/100?img=3" size="lg" />
          </View>

          <NText className="text-lg font-bold">Fallback (initials)</NText>
          <View className="flex-row gap-3 items-center">
            <NAvatar fallback="JD" size="sm" />
            <NAvatar fallback="AB" size="md" color="accent" />
            <NAvatar fallback="XY" size="lg" color="success" />
          </View>

          <NText className="text-lg font-bold">Colors</NText>
          <View className="flex-row gap-3 items-center">
            <NAvatar fallback="D" color="default" />
            <NAvatar fallback="A" color="accent" />
            <NAvatar fallback="S" color="success" />
            <NAvatar fallback="W" color="warning" />
            <NAvatar fallback="E" color="danger" />
          </View>

          <NText className="text-lg font-bold">Variants</NText>
          <View className="flex-row gap-3 items-center">
            <NAvatar fallback="DF" variant="default" />
            <NAvatar fallback="SF" variant="soft" color="accent" />
          </View>

          <NText className="text-lg font-bold">Broken image (shows fallback)</NText>
          <NAvatar src="https://invalid-url.example/broken.jpg" fallback="??" />
        </View>
      </ScrollView>
    </>
  );
}
