import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { NCheck, NText } from '@nayan-ui/native';
import { Stack } from 'expo-router';

export default function CheckScreen() {
  const [a, setA] = useState(false);
  const [b, setB] = useState(true);

  return (
    <>
      <Stack.Screen options={{ title: 'NCheck' }} />
      <ScrollView className="flex-1 bg-background">
        <View className="p-4 gap-4">
          <NText className="text-lg font-bold">Basic</NText>
          <NCheck label="Accept terms and conditions" isSelected={a} onSelectedChange={setA} />
          <NText>Checked: {a ? 'Yes' : 'No'}</NText>

          <NText className="text-lg font-bold">Pre-checked</NText>
          <NCheck label="Receive newsletters" isSelected={b} onSelectedChange={setB} />

          <NText className="text-lg font-bold">Disabled</NText>
          <NCheck label="Disabled unchecked" isSelected={false} isDisabled onSelectedChange={() => {}} />
          <NCheck label="Disabled checked" isSelected isDisabled onSelectedChange={() => {}} />
        </View>
      </ScrollView>
    </>
  );
}
