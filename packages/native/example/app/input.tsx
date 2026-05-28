import { ScrollView, View } from 'react-native';
import { NInput, NText } from '@nayan-ui/native';
import { Stack } from 'expo-router';

export default function InputScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'NInput' }} />
      <ScrollView className="flex-1 bg-background" keyboardShouldPersistTaps="handled">
        <View className="p-4 gap-1">
          <NText className="text-lg font-bold">Basic</NText>
          <NInput label="Name" />

          <NText className="text-lg font-bold">With description</NText>
          <NInput label="Email" description="We'll never share your email." />

          <NText className="text-lg font-bold">Required</NText>
          <NInput label="Username" isRequired />

          <NText className="text-lg font-bold">Invalid with error</NText>
          <NInput label="Password" isInvalid errorMessage="Password must be at least 8 characters." />

          <NText className="text-lg font-bold">Disabled</NText>
          <NInput label="Organization" isDisabled />

          <NText className="text-lg font-bold">Multiline (textarea)</NText>
          <NInput label="Bio" multiline description="Tell us about yourself." />

          <NText className="text-lg font-bold">All combined</NText>
          <NInput label="Phone" description="Include country code." isRequired isInvalid errorMessage="Invalid phone number." />
        </View>
      </ScrollView>
    </>
  );
}
