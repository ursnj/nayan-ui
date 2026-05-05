import { ScrollView, View } from 'react-native';
import { NInputGroup, NText } from '@nayan-ui/react-native';
import { Stack } from 'expo-router';

export default function InputGroupScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'NInputGroup' }} />
      <ScrollView className="flex-1 bg-background" keyboardShouldPersistTaps="handled">
        <View className="p-4 gap-3">
          <NText className="text-lg font-bold">With prefix</NText>
          <NInputGroup label="Website" prefix={<NText className="text-muted px-3">https://</NText>} />

          <NText className="text-lg font-bold">With suffix</NText>
          <NInputGroup label="Email" suffix={<NText className="text-muted px-3">@gmail.com</NText>} />

          <NText className="text-lg font-bold">Prefix + suffix</NText>
          <NInputGroup label="Price" prefix={<NText className="text-muted px-3">$</NText>} suffix={<NText className="text-muted px-3">USD</NText>} />

          <NText className="text-lg font-bold">Disabled</NText>
          <NInputGroup label="Locked" isDisabled prefix={<NText className="text-muted px-3">#</NText>} />
        </View>
      </ScrollView>
    </>
  );
}
