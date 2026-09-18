import { View } from 'react-native';
import { NButton, NText, NThemeToggle, useNTheme } from '@nayan-ui/native';
import Screen from '../src/components/Screen';

function ThemeInfo() {
  const { theme, setTheme, toggleTheme } = useNTheme();
  return (
    <View className="gap-3">
      <NText>
        Current theme: <NText className="font-bold">{theme}</NText>
      </NText>
      <NText className="text-lg font-bold">useNTheme — toggleTheme</NText>
      <NButton variant="outline" onPress={toggleTheme}>
        Toggle Theme
      </NButton>
      <NText className="text-lg font-bold">useNTheme — setTheme</NText>
      <View className="flex-row gap-2">
        <NButton size="sm" onPress={() => setTheme('light')}>
          Light
        </NButton>
        <NButton size="sm" onPress={() => setTheme('dark')}>
          Dark
        </NButton>
      </View>
    </View>
  );
}

export default function ThemeScreen() {
  return (
    <Screen title="NTheme & NThemeToggle">
      <NText className="text-lg font-bold">NThemeToggle (press to toggle)</NText>
      <NThemeToggle className="p-4 bg-surface rounded-lg">
        <NText>Tap this entire area to toggle theme</NText>
      </NThemeToggle>

      <ThemeInfo />
    </Screen>
  );
}
