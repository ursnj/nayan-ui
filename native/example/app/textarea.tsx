import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { NTextarea, NText } from '@nayan-ui/react-native';
import { Stack } from 'expo-router';

export default function TextareaScreen() {
  const [bio, setBio] = useState('');

  return (
    <>
      <Stack.Screen options={{ title: 'NTextarea' }} />
      <ScrollView className="flex-1 bg-background" keyboardShouldPersistTaps="handled">
        <View className="p-4 gap-3">
          <NText className="text-lg font-bold">Basic</NText>
          <NTextarea label="Bio" placeholder="Tell us about yourself..." value={bio} onChangeText={setBio} />
          <NText className="text-muted">{bio.length} characters</NText>

          <NText className="text-lg font-bold">Disabled</NText>
          <NTextarea label="Notes" placeholder="Read only" isDisabled value="Some existing text" onChangeText={() => {}} />

          <NText className="text-lg font-bold">Invalid</NText>
          <NTextarea label="Description" placeholder="Required field" isInvalid value="" onChangeText={() => {}} />
        </View>
      </ScrollView>
    </>
  );
}
