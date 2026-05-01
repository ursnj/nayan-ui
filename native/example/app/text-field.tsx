import { ScrollView, View } from 'react-native';
import { NTextField, NText } from '@nayan-ui/react-native';
import { Stack } from 'expo-router';

export default function TextFieldScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'NTextField' }} />
      <ScrollView className="flex-1 bg-background" keyboardShouldPersistTaps="handled">
        <View className="p-4 gap-1">
          <NText className="text-lg font-bold">Basic with label</NText>
          <NTextField label="Full Name" />

          <NText className="text-lg font-bold">With description</NText>
          <NTextField label="Email" description="We'll never share your email with anyone." />

          <NText className="text-lg font-bold">Invalid with error</NText>
          <NTextField label="Password" isInvalid errorMessage="Password must be at least 8 characters." />

          <NText className="text-lg font-bold">Required</NText>
          <NTextField label="Username" isRequired />

          <NText className="text-lg font-bold">Disabled</NText>
          <NTextField label="Organization" isDisabled />

          <NText className="text-lg font-bold">All combined</NText>
          <NTextField
            label="Phone"
            description="Include country code."
            isRequired
            isInvalid
            errorMessage="Invalid phone number."
          />
        </View>
      </ScrollView>
    </>
  );
}
