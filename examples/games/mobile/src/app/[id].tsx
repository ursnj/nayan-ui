import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { Text, useColorScheme, View } from 'react-native';
import { DEFAULT_GAME_SETTINGS, type GameSettings, resolveGameTheme } from '@nayan-engine-example/shared';
import { Redirect, useLocalSearchParams, useNavigation } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { HeaderButton, useHeaderHeight } from 'expo-router/react-navigation';
import { findExample } from '../examples';

/** The header's colours: the game's scoreboard surface, border and text for its current theme. */
const headerColors = (theme?: GameSettings['theme']) => {
  const { SURFACE, BORDER, TEXT } = resolveGameTheme(theme);
  return { background: SURFACE, border: BORDER, tint: TEXT };
};

/** A game full screen under the transparent header, hosted like Playtura's game screen. */
export default function ExampleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const example = findExample(id);
  const navigation = useNavigation();
  const system = useColorScheme() === 'dark' ? 'dark' : 'light';

  // The header's real height on this device (status bar included): the game starts its HUD below it.
  const headerHeight = useHeaderHeight();
  const [settings, setSettings] = useState<GameSettings>(() => ({ ...DEFAULT_GAME_SETTINGS, offset: headerHeight, theme: system }));
  useEffect(() => {
    setSettings((prev) => (prev.offset === headerHeight ? prev : { ...prev, offset: headerHeight }));
  }, [headerHeight]);
  useEffect(() => {
    setSettings((prev) => (prev.theme === system ? prev : { ...prev, theme: system }));
  }, [system]);

  // No swipe back mid-run; the header's back button still leaves.
  const onPlayingChange = useCallback(
    (playing: boolean) => navigation.setOptions({ gestureEnabled: !playing, fullScreenGestureEnabled: !playing }),
    [navigation]
  );
  const toggleSettings = useCallback(() => setSettings((prev) => ({ ...prev, isVisible: !prev.isVisible })), []);

  // The header follows the game's theme (its settings' Dark Mode switch included) and carries the
  // settings button: a native bar item on iOS, a header button on Android.
  const { background, border, tint } = headerColors(settings.theme);
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTintColor: tint,
      headerBackground: () => <View style={{ flex: 1, backgroundColor: background, borderBottomWidth: 1, borderBottomColor: border }} />,
      unstable_headerRightItems: () => [
        {
          type: 'button' as const,
          label: 'Settings',
          icon: { type: 'sfSymbol' as const, name: 'gearshape' as const },
          tintColor: tint,
          accessibilityLabel: 'Game settings',
          onPress: toggleSettings
        }
      ],
      headerRight: ({ tintColor }: { tintColor?: string }) => (
        <HeaderButton onPress={toggleSettings} accessibilityLabel="Game settings">
          <Text style={{ color: tintColor ?? tint, fontSize: 22 }}>⚙</Text>
        </HeaderButton>
      )
    });
  }, [navigation, toggleSettings, background, border, tint]);

  if (!example) return <Redirect href="/" />;
  return (
    <View style={{ flex: 1 }}>
      <StatusBar style={settings.theme === 'dark' ? 'light' : 'dark'} />
      <example.Screen settings={settings} onSettingsChange={setSettings} onPlayingChange={onPlayingChange} />
    </View>
  );
}
