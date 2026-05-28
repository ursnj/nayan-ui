import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { NSwitch, NText } from '@nayan-ui/native';
import { Stack } from 'expo-router';

export default function SwitchScreen() {
  const [wifi, setWifi] = useState(true);
  const [bluetooth, setBluetooth] = useState(false);

  return (
    <>
      <Stack.Screen options={{ title: 'NSwitch' }} />
      <ScrollView className="flex-1 bg-background">
        <View className="p-4 gap-4">
          <NText className="text-lg font-bold">Basic</NText>
          <NSwitch label="Wi-Fi" isSelected={wifi} onSelectedChange={setWifi} />
          <NSwitch label="Bluetooth" isSelected={bluetooth} onSelectedChange={setBluetooth} />
          <NText className="text-muted">
            Wi-Fi: {wifi ? 'On' : 'Off'}, Bluetooth: {bluetooth ? 'On' : 'Off'}
          </NText>

          <NText className="text-lg font-bold">Disabled</NText>
          <NSwitch label="Disabled on" isSelected isDisabled onSelectedChange={() => {}} />
          <NSwitch label="Disabled off" isSelected={false} isDisabled onSelectedChange={() => {}} />
        </View>
      </ScrollView>
    </>
  );
}
