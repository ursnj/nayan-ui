import { useState } from 'react';
import { NDatePicker, NText } from '@nayan-ui/native';
import Screen from '../src/components/Screen';

export default function DatePickerScreen() {
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());

  return (
    <Screen title="NDatePicker">
      <NText className="text-lg font-bold">Date picker</NText>
      <NDatePicker label="Select date" value={date} onChange={setDate} />

      <NText className="text-lg font-bold">Time picker</NText>
      <NDatePicker label="Select time" value={time} onChange={setTime} mode="time" />

      <NText className="text-lg font-bold">Disabled</NText>
      <NDatePicker label="Disabled" value={date} onChange={setDate} disabled />
    </Screen>
  );
}
