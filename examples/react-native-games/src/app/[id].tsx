import { useCallback, useLayoutEffect, useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { DEFAULT_GAME_SETTINGS, GAMES_LIST, GAMES_MAPPING, GAME_IDS, type GameSettings } from 'react-native-games';
import { Ionicons } from '@expo/vector-icons';
import { useHeaderHeight } from '@react-navigation/elements';
import { useNavigation } from '@react-navigation/native';
import { useLocalSearchParams } from 'expo-router';

export default function GameScreen() {
  const headerHeight = useHeaderHeight();
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();

  // Validate game ID
  const gameId = Object.values(GAME_IDS).includes(id as any) ? id : null;

  // Get the game component
  const GameComponent = gameId ? GAMES_MAPPING[gameId] : null;

  // Get or initialize settings for this game
  const [settings, setSettings] = useState<GameSettings>(() => {
    return { ...DEFAULT_GAME_SETTINGS, offset: headerHeight };
  });

  const handleSettingsChange = useCallback((newSettings: GameSettings) => {
    if (gameId) {
      setSettings(newSettings);
    }
  }, []);

  const handleToggleSettingsModal = useCallback(() => {
    setSettings(prev => ({
      ...prev,
      isVisible: !prev.isVisible
    }));
  }, []);

  // Update header with settings button
  useLayoutEffect(() => {
    navigation.setOptions({
      title: GAMES_LIST.find(g => g.id === gameId)?.title || 'Game',
      headerTransparent: true,
      headerTintColor: '#ffffff',
      headerStyle: { backgroundColor: 'rgba(0,0,0,0.2)' },
      headerRight: () => (
        <TouchableOpacity onPressIn={handleToggleSettingsModal} className="p-2 z-10">
          <Ionicons name="settings-outline" size={24} color="#fff" />
        </TouchableOpacity>
      )
    });
  }, [navigation, handleToggleSettingsModal]);

  if (!gameId || !GameComponent) {
    return null;
  }

  return (
    <View className="flex-1 bg-background">
      <GameComponent settings={settings} onSettingsChange={handleSettingsChange} />
    </View>
  );
}
