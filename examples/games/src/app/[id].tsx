import { useCallback, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DEFAULT_GAME_SETTINGS, GAMES_LIST, GAMES_MAPPING, GAME_IDS, type GameSettings } from '@nayan-ui/games';
import { Stack, useLocalSearchParams } from 'expo-router';

export default function GameScreen() {
  const { top } = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const gameId = Object.values(GAME_IDS).includes(id as any) ? id : null;
  const GameComponent = gameId ? GAMES_MAPPING[gameId] : null;
  const gameTitle = GAMES_LIST.find(g => g.id === gameId)?.title || 'Game';

  const [settings, setSettings] = useState<GameSettings>(() => ({
    ...DEFAULT_GAME_SETTINGS,
    offset: top + 56
  }));

  const handleSettingsChange = useCallback(
    (newSettings: GameSettings) => {
      if (gameId) setSettings(newSettings);
    },
    [gameId]
  );

  const handleToggleSettingsModal = useCallback(() => {
    setSettings(prev => ({ ...prev, isVisible: !prev.isVisible }));
  }, []);

  if (!gameId || !GameComponent) return null;

  return (
    <>
      <Stack.Screen
        options={{
          title: gameTitle,
          headerTransparent: true,
          headerTintColor: '#ffffff',
          headerStyle: { backgroundColor: 'rgba(0,0,0,0.2)' },
          headerRight: () => (
            <TouchableOpacity onPressIn={handleToggleSettingsModal} style={styles.settingsButton}>
              <Ionicons name="settings-outline" size={24} color="#fff" />
            </TouchableOpacity>
          )
        }}
      />
      <View className="flex-1 bg-background">
        <GameComponent settings={settings} onSettingsChange={handleSettingsChange} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  settingsButton: { padding: 8, zIndex: 10 }
});
