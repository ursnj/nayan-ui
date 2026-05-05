import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { NSelect, NText } from '@nayan-ui/react-native';
import { Stack } from 'expo-router';

export default function SelectScreen() {
  const [country, setCountry] = useState('');

  return (
    <>
      <Stack.Screen options={{ title: 'NSelect' }} />
      <ScrollView className="flex-1 bg-background">
        <View className="p-4 gap-4">
          <NText className="text-lg font-bold">Basic</NText>
          <NSelect
            label="Country"
            placeholder="Select a country"
            items={[
              { label: 'India', value: 'in' },
              { label: 'USA', value: 'us' },
              { label: 'UK', value: 'uk' },
              { label: 'Germany', value: 'de' },
              { label: 'Japan', value: 'jp' }
            ]}
            onValueChange={setCountry}
          />
          <NText>Selected: {country || '—'}</NText>

          <NText className="text-lg font-bold">With default value</NText>
          <NSelect
            label="Language"
            defaultValue={{ label: 'English', value: 'en' }}
            items={[
              { label: 'English', value: 'en' },
              { label: 'Spanish', value: 'es' },
              { label: 'French', value: 'fr' }
            ]}
            onValueChange={() => {}}
          />

          <NText className="text-lg font-bold">Disabled</NText>
          <NSelect label="Locked" isDisabled items={[{ label: 'Only option', value: 'only' }]} onValueChange={() => {}} />
        </View>
      </ScrollView>
    </>
  );
}
