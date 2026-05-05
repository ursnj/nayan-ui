import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { NInputOtp, NText } from '@nayan-ui/react-native';
import { Stack } from 'expo-router';

export default function InputOtpScreen() {
  const [otp4, setOtp4] = useState('');
  const [otp6, setOtp6] = useState('');

  return (
    <>
      <Stack.Screen options={{ title: 'NInputOtp' }} />
      <ScrollView className="flex-1 bg-background" keyboardShouldPersistTaps="handled">
        <View className="p-4 gap-4">
          <NText className="text-lg font-bold">4 digits</NText>
          <NInputOtp maxLength={4} value={otp4} onChange={setOtp4} />
          <NText>Value: {otp4 || '—'}</NText>

          <NText className="text-lg font-bold">6 digits</NText>
          <NInputOtp maxLength={6} value={otp6} onChange={setOtp6} />

          <NText className="text-lg font-bold">Secondary variant</NText>
          <NInputOtp maxLength={4} slotVariant="secondary" value="" onChange={() => {}} />
        </View>
      </ScrollView>
    </>
  );
}
