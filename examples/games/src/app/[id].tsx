import { useCallback, useLayoutEffect, useState } from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';
import { DEFAULT_GAME_SETTINGS, GAMES_LIST, GAMES_MAPPING, GAME_IDS, type GameSettings } from 'react-native-games';
import { Ionicons } from '@expo/vector-icons';
import { useHeaderHeight } from '@react-navigation/elements';
import { useNavigation } from '@react-navigation/native';
import { useLocalSearchParams } from 'expo-router';

export default function GameScreen() {
  const headerHeight = useHeaderHeight();
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();

  const gameId = Object.values(GAME_IDS).includes(id as any) ? id : null;
  const GameComponent = gameId ? GAMES_MAPPING[gameId] : null;

  const [settings, setSettings] = useState<GameSettings>(() => ({
    ...DEFAULT_GAME_SETTINGS,
    offset: headerHeight
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

  useLayoutEffect(() => {
    navigation.setOptions({
      title: GAMES_LIST.find(g => g.id === gameId)?.title || 'Game',
      headerTransparent: true,
      headerTintColor: '#ffffff',
      headerStyle: { backgroundColor: 'rgba(0,0,0,0.2)' },
      headerRight: () => (
        <TouchableOpacity onPressIn={handleToggleSettingsModal} style={styles.settingsButton}>
          <Ionicons name="settings-outline" size={24} color="#fff" />
        </TouchableOpacity>
      )
    });
  }, [navigation, handleToggleSettingsModal, gameId]);

  if (!gameId || !GameComponent) return null;

  return (
    <View style={styles.container}>
      <GameComponent settings={settings} onSettingsChange={handleSettingsChange} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  settingsButton: { padding: 8, zIndex: 10 }
});
