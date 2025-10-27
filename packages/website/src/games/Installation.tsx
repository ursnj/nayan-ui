import { useLocation } from 'react-router-dom';
import { NLink } from '@nayan-ui/react';
import { getMenuItem } from '@/services/Utils';
import Meta from '../helpers/Meta';
import Sidebar from '../helpers/Sidebar';

const GamesInstallation = () => {
  const location = useLocation();
  const component: any = getMenuItem(location.pathname);

  return (
    <Sidebar title={component?.title || 'Installation'}>
      <Meta
        title="Installation - React Native Games"
        description="Installation guide for react-native-games library including peer dependencies and platform setup."
        keywords="react native games installation, setup, peer dependencies"
      />

      {/* Installation Section */}
      <div className="bg-card border border-border rounded-lg p-8 mb-8">
        <h2 className="text-2xl font-bold text-text mb-6 flex items-center">
          <span className="mr-3">📦</span>
          Installation
        </h2>
        <div className="space-y-4">
          <div className="bg-background rounded-lg p-4">
            <pre className="bg-muted/20 rounded p-3 text-sm font-mono overflow-x-auto">
              <code>npm install react-native-games</code>
            </pre>
            <p className="text-muted text-sm mt-2 text-center">or</p>
            <pre className="bg-muted/20 rounded p-3 text-sm font-mono overflow-x-auto mt-2">
              <code>yarn add react-native-games</code>
            </pre>
          </div>

          <div className="bg-background rounded-lg p-4">
            <h3 className="text-lg font-semibold text-text mb-3">Peer Dependencies</h3>
            <p className="text-muted text-sm mb-3">This library requires the following peer dependencies to be installed in your project:</p>
            <pre className="bg-muted/20 rounded p-3 text-sm font-mono overflow-x-auto">
              <code>
                npm install @shopify/react-native-skia react-native-reanimated react-native-gesture-handler react-native-worklets expo-speech
                expo-haptics
              </code>
            </pre>
          </div>

          <div className="bg-background rounded-lg p-4">
            <h3 className="text-lg font-semibold text-text mb-3">Platform Setup</h3>
            <p className="text-muted text-sm mb-3">Follow the installation guides for each peer dependency:</p>
            <ul className="text-muted text-sm space-y-2">
              <li>
                •{' '}
                <NLink
                  href="https://shopify.github.io/react-native-skia/docs/getting-started/installation"
                  target="_blank"
                  className="text-primary hover:underline">
                  @shopify/react-native-skia
                </NLink>{' '}
                - Graphics
              </li>
              <li>
                •{' '}
                <NLink
                  href="https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started"
                  target="_blank"
                  className="text-primary hover:underline">
                  react-native-reanimated
                </NLink>{' '}
                - Animations
              </li>
              <li>
                •{' '}
                <NLink
                  href="https://docs.swmansion.com/react-native-gesture-handler/docs/fundamentals/installation"
                  target="_blank"
                  className="text-primary hover:underline">
                  react-native-gesture-handler
                </NLink>{' '}
                - Gestures
              </li>
              <li>
                •{' '}
                <NLink href="https://docs.expo.dev/versions/latest/sdk/speech/" target="_blank" className="text-primary hover:underline">
                  expo-speech
                </NLink>{' '}
                - Sounds
              </li>
              <li>
                •{' '}
                <NLink href="https://docs.expo.dev/versions/latest/sdk/haptics/" target="_blank" className="text-primary hover:underline">
                  expo-haptics
                </NLink>{' '}
                - Haptics
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Usage Section */}
      <div className="bg-card border border-border rounded-lg p-8 mb-8">
        <h2 className="text-2xl font-bold text-text mb-6 flex items-center">
          <span className="mr-3">🚀</span>
          Usage
        </h2>
        <div className="space-y-6">
          <div className="bg-background rounded-lg p-4">
            <h3 className="text-lg font-semibold text-text mb-3">Simple Implementation</h3>
            <p className="text-muted text-sm mb-3">For basic usage without settings persistence:</p>
            <pre className="bg-muted/20 rounded p-3 text-sm font-mono overflow-x-auto">
              <code>{`import React, { useState } from 'react';
import { View } from 'react-native';
import { DEFAULT_GAME_SETTINGS, FruitNinja } from 'react-native-games';

export default function GameScreen() {
  const [settings, setSettings] = useState(DEFAULT_GAME_SETTINGS);

  return (
    <View style={{ flex: 1 }}>
      <FruitNinja settings={settings} onSettingsChange={setSettings} />
    </View>
  );
}`}</code>
            </pre>
          </div>

          <div className="bg-background rounded-lg p-4">
            <h3 className="text-lg font-semibold text-text mb-3">Advanced Implementation Example</h3>
            <p className="text-muted text-sm mb-3">
              All games use the same props pattern for consistency. Here's a complete example with settings persistence and navigation integration:
            </p>
            <pre className="bg-muted/20 rounded p-3 text-sm font-mono overflow-x-auto">
              <code>{`import { View, TouchableOpacity } from 'react-native';
import { useState, useLayoutEffect } from 'react';
import { useNavigation, useTheme } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { DEFAULT_GAME_SETTINGS, GAME_IDS, type GameSettings, FruitNinja } from 'react-native-games';
import { StorageService } from '../services/StorageService';

export default function FruitNinjaScreen() {
  const { colors } = useTheme();
  const storedSettings = StorageService.get(GAME_IDS.FRUIT_NINJA);
  const [settings, setSettings] = useState(storedSettings || DEFAULT_GAME_SETTINGS);
  const navigation = useNavigation();

  const handleSettingsChange = (newSettings: GameSettings) => {
    setSettings(newSettings);
    StorageService.set(GAME_IDS.FRUIT_NINJA, newSettings);
  };

  const handleToggleSettingsModal = () => {
    setSettings({...settings, isVisible: !settings.isVisible});
  };

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity className="p-2" onPress={handleToggleSettingsModal}>
          <Ionicons name="settings-outline" size={24} color={colors.text} />
        </TouchableOpacity>
      ),
    });
  }, [navigation, handleToggleSettingsModal]);

  return (
    <View className="flex-1 bg-background">
      <FruitNinja settings={settings} onSettingsChange={handleSettingsChange} />
    </View>
  );
}`}</code>
            </pre>
          </div>

          <div className="bg-background rounded-lg p-4">
            <h3 className="text-lg font-semibold text-text mb-3">Available Games</h3>
            <p className="text-muted text-sm mb-3">All games use the same props interface:</p>
            <pre className="bg-muted/20 rounded p-3 text-sm font-mono overflow-x-auto">
              <code>{`// Import any game you want
import {
  FruitNinja,
  CandyCrush,
  FlappyBird,
  ColorsSort,
  DinoJump,
  PopitFidget,
  WhackAMole,
  BalloonBlaster,
  SpaceFighter,
  MazeRunner,
  SlidingNumbers,
  Game2048,
  FruitMerger,
  Snake
} from 'react-native-games';

// All games accept the same props:
<GameComponent
  settings={settings}
  onSettingsChange={handleSettingsChange}
/>`}</code>
            </pre>
          </div>

          <div className="bg-background rounded-lg p-4">
            <h3 className="text-lg font-semibold text-text mb-3">Game Settings & Configuration</h3>
            <p className="text-muted text-sm mb-3">All games use the unified GameSettings interface:</p>
            <pre className="bg-muted/20 rounded p-3 text-sm font-mono overflow-x-auto">
              <code>{`interface GameSettings {
  isVisible: boolean;        // Settings modal visibility
  difficulty: 'easy' | 'medium' | 'hard';
  enableSounds: boolean;     // Audio feedback
  enableHaptics: boolean;    // Haptic feedback
}

// Default settings for all games
const DEFAULT_GAME_SETTINGS = {
  isVisible: false,
  difficulty: 'medium',
  enableSounds: true,
  enableHaptics: true,
  offset: 0,
};`}</code>
            </pre>
          </div>

          <div className="bg-background rounded-lg p-4">
            <h3 className="text-lg font-semibold text-text mb-3">Game Settings</h3>
            <p className="text-muted text-sm mb-3">Each game includes built-in settings screens with a unified, simplified interface:</p>
            <ul className="text-muted text-sm space-y-2">
              <li>
                • <strong>Difficulty Levels</strong>: Easy, Medium, Hard - each game has custom difficulty descriptions and behaviors
              </li>
              <li>
                • <strong>Sound Effects</strong>: Toggle audio feedback on/off
              </li>
              <li>
                • <strong>Haptic Feedback</strong>: Toggle vibration feedback on/off
              </li>
            </ul>
            <p className="text-muted text-sm mt-3">
              All games use a centralized settings system for consistency and ease of maintenance. Game durations and difficulty behaviors are
              customized per game for optimal gameplay experience.
            </p>
          </div>
        </div>
      </div>
    </Sidebar>
  );
};

export default GamesInstallation;
