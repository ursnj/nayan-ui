import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { NInput, NText } from '@nayan-ui/react-native';
import { Stack } from 'expo-router';

export default function InputScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');

  return (
    <>
      <Stack.Screen options={{ title: 'NInput' }} />
      <ScrollView className="flex-1 bg-background" keyboardShouldPersistTaps="handled">
        <View className="p-4 gap-3">
          <NText className="text-lg font-bold">Basic</NText>
          <NInput label="Name" placeholder="Enter your name" value={name} onChangeText={setName} />

          <NText className="text-lg font-bold">With keyboard type</NText>
          <NInput label="Email" placeholder="you@example.com" keyboardType="email-address" value={email} onChangeText={setEmail} />

          <NText className="text-lg font-bold">Secure</NText>
          <NInput label="Password" placeholder="••••••••" secureTextEntry value="" onChangeText={() => {}} />

          <NText className="text-lg font-bold">Disabled</NText>
          <NInput label="Disabled" placeholder="Can't type here" isDisabled value="" onChangeText={() => {}} />

          <NText className="text-lg font-bold">Invalid</NText>
          <NInput label="Username" placeholder="Required" isInvalid value="" onChangeText={() => {}} />
        </View>
      </ScrollView>
    </>
  );
}
