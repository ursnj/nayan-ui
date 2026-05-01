import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { NInput, NTextarea, NInputOtp, NInputGroup, NTextField, NText } from '@nayan-ui/react-native';
import { Stack } from 'expo-router';

export default function InputsScreen() {
  const [text, setText] = useState('');
  const [area, setArea] = useState('');
  const [otp, setOtp] = useState('');

  return (
    <>
      <Stack.Screen options={{ title: 'Inputs' }} />
      <ScrollView className="flex-1 bg-background" keyboardShouldPersistTaps="handled">
        <View className="p-4 gap-2">
          <NText className="text-lg font-bold">NInput</NText>
          <NInput label="Name" placeholder="Enter name" value={text} onChangeText={setText} />
          <NInput label="Disabled" placeholder="Can't type" isDisabled value="" onChangeText={() => {}} />

          <NText className="text-lg font-bold mt-2">NTextarea</NText>
          <NTextarea label="Bio" placeholder="Tell us about yourself" value={area} onChangeText={setArea} />

          <NText className="text-lg font-bold mt-2">NInputOtp</NText>
          <NInputOtp maxLength={6} value={otp} onChange={setOtp} />

          <NText className="text-lg font-bold mt-2">NInputGroup</NText>
          <NInputGroup label="URL" prefix={<NText className="text-muted px-3">https://</NText>} />

          <NText className="text-lg font-bold mt-2">NTextField</NText>
          <NTextField label="Email" description="We'll never share your email." />
          <NTextField label="Password" isInvalid errorMessage="Password is required." />
        </View>
      </ScrollView>
    </>
  );
}
