import { ScrollView, View } from 'react-native';
import { NAlert, NText } from '@nayan-ui/react-native';
import { Stack } from 'expo-router';

export default function AlertScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'NAlert' }} />
      <ScrollView className="flex-1 bg-background">
        <View className="p-4 gap-3">
          <NText className="text-lg font-bold">Default</NText>
          <NAlert title="Heads up!" description="This is a default alert." />

          <NText className="text-lg font-bold">Accent</NText>
          <NAlert status="accent" title="New update" description="A new version is available." />

          <NText className="text-lg font-bold">Success</NText>
          <NAlert status="success" title="Saved" description="Your changes have been saved." />

          <NText className="text-lg font-bold">Warning</NText>
          <NAlert status="warning" title="Warning" description="Your session is about to expire." />

          <NText className="text-lg font-bold">Danger</NText>
          <NAlert status="danger" title="Error" description="Something went wrong." />

          <NText className="text-lg font-bold">Title only</NText>
          <NAlert title="Simple alert without description" />

          <NText className="text-lg font-bold">Long description</NText>
          <NAlert
            status="accent"
            title="Important"
            description="This is a much longer description that wraps across multiple lines to show how the alert handles longer content gracefully."
          />
        </View>
      </ScrollView>
    </>
  );
}
