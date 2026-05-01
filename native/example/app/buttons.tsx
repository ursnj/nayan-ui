import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { NButton, NButtonGroup, NLinkButton, NText } from '@nayan-ui/react-native';
import { Stack } from 'expo-router';

export default function ButtonsScreen() {
  const [selected, setSelected] = useState('left');

  return (
    <>
      <Stack.Screen options={{ title: 'Buttons' }} />
      <ScrollView className="flex-1 bg-background">
        <View className="p-4 gap-4">
          <NText className="text-lg font-bold">NButton</NText>
          <NButton onPress={() => {}}>Primary</NButton>
          <NButton variant="secondary">Secondary</NButton>
          <NButton variant="outline">Outline</NButton>
          <NButton variant="danger">Danger</NButton>
          <NButton variant="ghost">Ghost</NButton>
          <NButton isDisabled>Disabled</NButton>
          <NButton size="sm">Small</NButton>
          <NButton size="lg">Large</NButton>

          <NText className="text-lg font-bold mt-4">NLinkButton</NText>
          <NLinkButton onPress={() => {}}>Link Button</NLinkButton>

          <NText className="text-lg font-bold mt-4">NButtonGroup</NText>
          <NButtonGroup
            items={[
              { label: 'Left', value: 'left' },
              { label: 'Center', value: 'center' },
              { label: 'Right', value: 'right' },
            ]}
            value={selected}
            onValueChange={setSelected}
          />
        </View>
      </ScrollView>
    </>
  );
}
