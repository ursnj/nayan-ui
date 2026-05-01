import { ScrollView, View } from 'react-native';
import {
  NAccordion,
  NTabs,
  NActionItem,
  NText,
  NPress,
  NRequired,
  NThemeToggle,
} from '@nayan-ui/react-native';
import { Stack } from 'expo-router';

export default function DataScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Data Display' }} />
      <ScrollView className="flex-1 bg-background">
        <View className="p-4 gap-4">
          <NText className="text-lg font-bold">NAccordion</NText>
          <NAccordion
            items={[
              { title: 'What is React Native?', content: 'A framework for building native apps using React.' },
              { title: 'What is Expo?', content: 'A set of tools for building React Native apps.' },
              { title: 'What is HeroUI?', content: 'A component library for React Native.' },
            ]}
          />

          <NText className="text-lg font-bold mt-2">NTabs</NText>
          <NTabs
            defaultValue="tab1"
            items={[
              { label: 'Account', value: 'tab1', content: <NText>Account settings content.</NText> },
              { label: 'Security', value: 'tab2', content: <NText>Security settings content.</NText> },
              { label: 'Billing', value: 'tab3', content: <NText>Billing information.</NText> },
            ]}
          />

          <NText className="text-lg font-bold mt-2">NActionItem</NText>
          <NActionItem name="Profile" description="View your profile" onPress={() => {}} />
          <NActionItem name="Settings" description="App settings" onPress={() => {}} />
          <NActionItem name="Disabled" description="Not available" isDisabled onPress={() => {}} />

          <NText className="text-lg font-bold mt-2">NPress</NText>
          <NPress className="p-3 bg-surface rounded" onPress={() => {}}>
            <NText>Pressable area</NText>
          </NPress>

          <NText className="text-lg font-bold mt-2">NRequired</NText>
          <NRequired />

          <NText className="text-lg font-bold mt-2">NThemeToggle</NText>
          <NThemeToggle className="p-3 bg-surface rounded">
            <NText>Toggle Theme</NText>
          </NThemeToggle>
        </View>
      </ScrollView>
    </>
  );
}
