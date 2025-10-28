// Installation code blocks
export const installCode = `npm install react-native-games`;
export const installYarnCode = `yarn add react-native-games`;

export const peerDepsCode = `npm install @shopify/react-native-skia react-native-reanimated react-native-gesture-handler react-native-worklets expo-speech expo-haptics`;

// Usage code blocks
export const simpleUsageCode = `import React, { useState } from 'react';
import { View } from 'react-native';
import { DEFAULT_GAME_SETTINGS, FruitNinja } from 'react-native-games';

export default function GameScreen() {
  const [settings, setSettings] = useState(DEFAULT_GAME_SETTINGS);

  return (
    <View style={{ flex: 1 }}>
      <FruitNinja settings={settings} onSettingsChange={setSettings} />
    </View>
  );
}`;

export const advancedUsageCode = `import { View, TouchableOpacity } from 'react-native';
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
}`;

export const availableGamesCode = `// Import any game you want
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
/>`;

export const gameSettingsInterfaceCode = `interface GameSettings {
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
};`;

// API Reference code blocks
export const exportedConstantsCode = `import {
  // Game IDs Enum
  GAME_IDS,

  // Default Settings
  DEFAULT_GAME_SETTINGS,

  // Games List & Mapping
  GAMES_LIST,
  GAMES_MAPPING,

  // TypeScript Types
  type GameSettings,
  type GameProps,
  type GameDefinition,
  type GameComponent,

  // All Game Components
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
} from 'react-native-games';`;

export const gameIdsEnumCode = `GAME_IDS.FRUIT_NINJA      // 'fruit-ninja'
GAME_IDS.CANDY_CRUSH      // 'candy-crush'
GAME_IDS.FLAPPY_BIRD      // 'flappy-bird'
GAME_IDS.COLORS_SORT      // 'colors-sort'
GAME_IDS.DINO_JUMP        // 'dino-jump'
GAME_IDS.POPIT_FIDGET     // 'popit-fidget'
GAME_IDS.WHACK_A_MOLE     // 'whack-a-mole'
GAME_IDS.BALLOON_BLASTER  // 'balloon-blaster'
GAME_IDS.SPACE_FIGHTER    // 'space-fighter'
GAME_IDS.MAZE_RUNNER      // 'maze-runner'
GAME_IDS.SLIDING_NUMBERS  // 'sliding-numbers'
GAME_IDS.GAME_2048        // 'game-2048'
GAME_IDS.FRUIT_MERGER     // 'fruit-merger'
GAME_IDS.SNAKE            // 'snake'`;

export const defaultGameSettingsCode = `const DEFAULT_GAME_SETTINGS = {
  isVisible: false,      // Settings modal visibility
  difficulty: 'medium',  // Game difficulty level
  enableSounds: true,    // Audio feedback enabled
  enableHaptics: true,   // Haptic feedback enabled
  offset: 0,            // Top offset for notch/status bar
};

// Example: Custom settings with offset
const customSettings = {
  ...DEFAULT_GAME_SETTINGS,
  offset: 50,  // Moves game elements 50px down from top
};`;

export const gamesListCode = `// GAMES_LIST is an array of GameDefinition objects
GAMES_LIST.forEach(game => {
  console.log(game.id);          // GAME_IDS enum value
  console.log(game.title);       // Display title
  console.log(game.description); // Game description
  console.log(game.component);   // React component
});

// Example: Find a specific game
const fruitNinja = GAMES_LIST.find(g => g.id === GAME_IDS.FRUIT_NINJA);`;

export const gamesMappingCode = `// Access game component by ID
const GameComponent = GAMES_MAPPING[GAME_IDS.FRUIT_NINJA];

// Render dynamically
<GameComponent settings={settings} onSettingsChange={handleChange} />`;

export const typescriptTypesCode = `// Game settings interface
interface GameSettings {
  isVisible: boolean;        // Settings modal visibility
  difficulty: 'easy' | 'medium' | 'hard';
  enableSounds: boolean;     // Audio feedback
  enableHaptics: boolean;    // Haptic feedback
  offset?: number;           // Optional padding from top (default: 0)
}

// Game component props
interface GameProps {
  settings?: GameSettings;
  onSettingsChange?: (settings: GameSettings) => void;
}`;
