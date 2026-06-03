import { useCallback, useLayoutEffect, useState } from 'react';
import { Platform, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { DEFAULT_GAME_SETTINGS, GAMES_LIST, GAMES_MAPPING, GAME_IDS, type GameSettings } from '@nayan-ui/games';
import { NPress } from '@nayan-ui/native';
import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';

export default function GameScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const gameId = Object.values(GAME_IDS).includes(id as any) ? id : null;
  const GameComponent = gameId ? GAMES_MAPPING[gameId] : null;
  const gameTitle = GAMES_LIST.find(g => g.id === gameId)?.title || 'Game';
  const headerHeight = insets.top + (Platform.OS === 'ios' ? 37 : 56);

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
      headerTitle: () => (
        <View className={`${Platform.OS === 'ios' ? 'mr-10' : ''} flex-1 items-center justify-center`}>
          <Text className="text-lg font-semibold text-white" numberOfLines={1}>
            {gameTitle}
          </Text>
        </View>
      ),
      headerTransparent: true,
      headerTintColor: '#ffffff',
      headerBackTitleVisible: false,
      headerShadowVisible: false,
      headerBlurEffect: undefined,
      headerStyle: { backgroundColor: 'transparent' },
      headerBackground: () => <View style={{ flex: 1, backgroundColor: 'rgba(255,255,255,0.2)' }} />,
      headerLeft: () => (
        <NPress onPressIn={() => router.back()} className="z-10 flex items-center justify-center h-10 w-10 rounded-full">
          <Ionicons name="chevron-back" size={30} color="#ffffff" />
        </NPress>
      ),
      headerRight: () => (
        <NPress onPressIn={handleToggleSettingsModal} className="z-10 flex items-center justify-center h-10 w-10 rounded-full">
          <Ionicons name="settings-outline" size={24} color="#ffffff" />
        </NPress>
      )
    });
  }, [navigation, handleToggleSettingsModal, gameTitle, router]);

  if (!gameId || !GameComponent) return null;

  return (
    <View className="flex-1 bg-background">
      <GameComponent settings={settings} onSettingsChange={handleSettingsChange} />
    </View>
  );
}
