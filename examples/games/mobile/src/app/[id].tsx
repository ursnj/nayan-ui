import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { Text, useColorScheme, View } from 'react-native';
import { DEFAULT_GAME_SETTINGS, type GameSettings, resolveGameTheme } from '@nayan-engine-example/shared';
import { Redirect, useLocalSearchParams, useNavigation } from 'expo-router';
import { HeaderButton, useHeaderHeight } from 'expo-router/react-navigation';
import { StatusBar } from 'expo-status-bar';
import { findExample } from '../examples';

export default function GameScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const example = findExample(id);
  const navigation = useNavigation();
  const headerHeight = useHeaderHeight();
  const deviceTheme = useColorScheme() === 'dark' ? 'dark' : 'light';

  const [settings, setSettings] = useState<GameSettings>({ ...DEFAULT_GAME_SETTINGS, theme: deviceTheme });
  useEffect(() => setSettings((s) => ({ ...s, theme: deviceTheme })), [deviceTheme]);

  const onPlayingChange = useCallback((playing: boolean) => navigation.setOptions({ gestureEnabled: !playing }), [navigation]);
  const toggleSettings = useCallback(() => setSettings((s) => ({ ...s, isVisible: !s.isVisible })), []);

  const colors = resolveGameTheme(settings.theme);
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTintColor: colors.TEXT,
      headerBackground: () => <View style={{ flex: 1, backgroundColor: colors.SURFACE, borderBottomWidth: 1, borderBottomColor: colors.BORDER }} />,
      headerRight: () => (
        <HeaderButton onPress={toggleSettings} accessibilityLabel="Game settings">
          <Text style={{ color: colors.TEXT, fontSize: 22 }}>⚙</Text>
        </HeaderButton>
      )
    });
  }, [navigation, toggleSettings, colors]);

  if (!example) return <Redirect href="/" />;
  return (
    <View style={{ flex: 1 }}>
      <StatusBar style={settings.theme === 'dark' ? 'light' : 'dark'} />
      <example.Screen settings={{ ...settings, offset: headerHeight }} onSettingsChange={setSettings} onPlayingChange={onPlayingChange} />
    </View>
  );
}
