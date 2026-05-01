import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { NCheck, NSwitch, NRadio, NSelect, NSlider, NTagGroup, NText } from '@nayan-ui/react-native';
import { Stack } from 'expo-router';

export default function SelectionsScreen() {
  const [checked, setChecked] = useState(false);
  const [switchOn, setSwitchOn] = useState(true);
  const [radio, setRadio] = useState('apple');
  return (
    <>
      <Stack.Screen options={{ title: 'Selections' }} />
      <ScrollView className="flex-1 bg-background">
        <View className="p-4 gap-2">
          <NText className="text-lg font-bold">NCheck</NText>
          <NCheck label="Accept terms" isSelected={checked} onSelectedChange={setChecked} />

          <NText className="text-lg font-bold mt-2">NSwitch</NText>
          <NSwitch label="Notifications" isSelected={switchOn} onSelectedChange={setSwitchOn} />

          <NText className="text-lg font-bold mt-2">NRadio</NText>
          <NRadio
            label="Fruit"
            value={radio}
            onValueChange={setRadio}
            items={[
              { label: 'Apple', value: 'apple' },
              { label: 'Banana', value: 'banana' },
              { label: 'Cherry', value: 'cherry' },
            ]}
          />

          <NText className="text-lg font-bold mt-2">NSelect</NText>
          <NSelect
            label="Country"
            placeholder="Pick one"
            items={[
              { label: 'India', value: 'in' },
              { label: 'USA', value: 'us' },
              { label: 'UK', value: 'uk' },
            ]}
            onValueChange={() => {}}
          />

          <NText className="text-lg font-bold mt-2">NSlider</NText>
          <NSlider defaultValue={50} showOutput />

          <NText className="text-lg font-bold mt-2">NTagGroup</NText>
          <NTagGroup
            selectionMode="multiple"
            items={[
              { label: 'React', value: 'react' },
              { label: 'Vue', value: 'vue' },
              { label: 'Svelte', value: 'svelte' },
            ]}
          />
        </View>
      </ScrollView>
    </>
  );
}
