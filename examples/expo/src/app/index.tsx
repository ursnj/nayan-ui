import { Image, Linking, View } from 'react-native';
import { NButton, NText, THEMES, useNTheme } from '@nayan-ui/native';

export default function Home() {
  const { isDarkMode, setTheme } = useNTheme();

  return (
    <View className="flex-1 items-center justify-center bg-background gap-4 p-6">
      <Image source={require('../../assets/logo.webp')} className="w-32 h-32" resizeMode="contain" />
      <NText className="text-3xl font-bold text-foreground">Nayan UI + Expo</NText>
      <NText className="text-muted text-center">React Native Component Library powered by HeroUI Native & Uniwind</NText>
      <View className="flex-row gap-3">
        <NButton onPress={() => setTheme(isDarkMode ? THEMES.light : THEMES.dark)}>{isDarkMode ? 'Switch to Light' : 'Switch to Dark'}</NButton>
        <NButton variant="outline" onPress={() => Linking.openURL('https://www.nayanui.com')}>
          Documentation
        </NButton>
      </View>
    </View>
  );
}
