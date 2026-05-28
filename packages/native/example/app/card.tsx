import { ScrollView, View } from 'react-native';
import { NButton, NCard, NText } from '@nayan-ui/native';
import { Stack } from 'expo-router';

export default function CardScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'NCard' }} />
      <ScrollView className="flex-1 bg-background">
        <View className="p-4 gap-4">
          <NText className="text-lg font-bold">Default</NText>
          <NCard>
            <NText className="font-bold text-lg">Card Title</NText>
            <NText className="text-muted mt-1">This is the card body text.</NText>
          </NCard>

          <NText className="text-lg font-bold">Secondary</NText>
          <NCard variant="secondary">
            <NText className="font-bold">Secondary Card</NText>
            <NText className="text-muted mt-1">Different background.</NText>
          </NCard>

          <NText className="text-lg font-bold">Tertiary</NText>
          <NCard variant="tertiary">
            <NText className="font-bold">Tertiary Card</NText>
            <NText className="text-muted mt-1">Even subtler.</NText>
          </NCard>

          <NText className="text-lg font-bold">With action</NText>
          <NCard>
            <NText className="font-bold text-lg">Upgrade Plan</NText>
            <NText className="text-muted mt-1">Get more features with Pro.</NText>
            <NButton className="mt-3" size="sm" onPress={() => {}}>
              Upgrade
            </NButton>
          </NCard>
        </View>
      </ScrollView>
    </>
  );
}
