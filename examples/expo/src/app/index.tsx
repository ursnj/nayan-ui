import { ScrollView, View } from 'react-native';
import { NButton, NCard, NText, NThemeToggle, THEMES, useNTheme } from '@nayan-ui/native';

export default function Home() {
  const { isDarkMode, setTheme } = useNTheme();

  return (
    <ScrollView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center p-6 gap-6 pt-12">
        <NText className="text-3xl font-bold text-foreground">Nayan UI</NText>
        <NText className="text-lg text-muted text-center">React Native Component Library{'\n'}powered by HeroUI Native & Uniwind</NText>

        <View className="flex-row gap-3">
          <NButton onPress={() => setTheme(isDarkMode ? THEMES.light : THEMES.dark)}>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</NButton>
          <NThemeToggle />
        </View>

        <NCard className="w-full p-4 gap-3">
          <NText className="text-lg font-semibold text-foreground">Getting Started</NText>
          <NText className="text-muted leading-6">
            This example demonstrates @nayan-ui/native with Expo, Uniwind, and HeroUI Native. All components support dark mode out of the box.
          </NText>
        </NCard>
      </View>
    </ScrollView>
  );
}
