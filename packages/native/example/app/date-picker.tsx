import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { NDatePicker, NText } from '@nayan-ui/native';
import { Stack } from 'expo-router';

export default function DatePickerScreen() {
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());

  return (
    <>
      <Stack.Screen options={{ title: 'NDatePicker' }} />
      <ScrollView className="flex-1 bg-background">
        <View className="p-4 gap-4">
          <NText className="text-lg font-bold">Date picker</NText>
          <NDatePicker label="Select date" value={date} onChange={setDate} />

          <NText className="text-lg font-bold">Time picker</NText>
          <NDatePicker label="Select time" value={time} onChange={setTime} mode="time" />

          <NText className="text-lg font-bold">Disabled</NText>
          <NDatePicker label="Disabled" value={date} onChange={setDate} disabled />
        </View>
      </ScrollView>
    </>
  );
}
