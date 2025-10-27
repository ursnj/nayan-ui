import { useLocation } from 'react-router-dom';
import { NLink } from '@nayan-ui/react';
import { getMenuItem } from '@/services/Utils';
import Meta from '../helpers/Meta';
import Sidebar from '../helpers/Sidebar';

const GamesApiReference = () => {
  const location = useLocation();
  const component: any = getMenuItem(location.pathname);

  return (
    <Sidebar title={component?.title || 'API Reference'}>
      <Meta
        title="API Reference - React Native Games"
        description="Complete API reference for react-native-games library including exported constants, types, and components."
        keywords="react native games api, game ids, game settings, typescript types"
      />

      {/* API Reference Section */}
      <div className="bg-card border border-border rounded-lg p-8 mb-8">
        <h2 className="text-2xl font-bold text-text mb-6 flex items-center">
          <span className="mr-3">📚</span>
          API Reference
        </h2>
        <div className="space-y-6">
          <div className="bg-background rounded-lg p-4">
            <h3 className="text-lg font-semibold text-text mb-3">Exported Constants & Types</h3>
            <pre className="bg-muted/20 rounded p-3 text-sm font-mono overflow-x-auto">
              <code>{`import {
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
} from 'react-native-games';`}</code>
            </pre>
          </div>

          <div className="bg-background rounded-lg p-4">
            <h3 className="text-lg font-semibold text-text mb-3">GAME_IDS Enum</h3>
            <p className="text-muted text-sm mb-3">All available game identifiers:</p>
            <pre className="bg-muted/20 rounded p-3 text-sm font-mono overflow-x-auto">
              <code>{`GAME_IDS.FRUIT_NINJA      // 'fruit-ninja'
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
GAME_IDS.SNAKE            // 'snake'`}</code>
            </pre>
          </div>

          <div className="bg-background rounded-lg p-4">
            <h3 className="text-lg font-semibold text-text mb-3">DEFAULT_GAME_SETTINGS</h3>
            <p className="text-muted text-sm mb-3">Default configuration for all games:</p>
            <pre className="bg-muted/20 rounded p-3 text-sm font-mono overflow-x-auto">
              <code>{`const DEFAULT_GAME_SETTINGS = {
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
};`}</code>
            </pre>
          </div>

          <div className="bg-background rounded-lg p-4">
            <h3 className="text-lg font-semibold text-text mb-3">GAMES_LIST</h3>
            <p className="text-muted text-sm mb-3">Array of all game definitions with metadata:</p>
            <pre className="bg-muted/20 rounded p-3 text-sm font-mono overflow-x-auto">
              <code>{`// GAMES_LIST is an array of GameDefinition objects
GAMES_LIST.forEach(game => {
  console.log(game.id);          // GAME_IDS enum value
  console.log(game.title);       // Display title
  console.log(game.description); // Game description
  console.log(game.component);   // React component
});

// Example: Find a specific game
const fruitNinja = GAMES_LIST.find(g => g.id === GAME_IDS.FRUIT_NINJA);`}</code>
            </pre>
          </div>

          <div className="bg-background rounded-lg p-4">
            <h3 className="text-lg font-semibold text-text mb-3">GAMES_MAPPING</h3>
            <p className="text-muted text-sm mb-3">Object mapping game IDs to their components:</p>
            <pre className="bg-muted/20 rounded p-3 text-sm font-mono overflow-x-auto">
              <code>{`// Access game component by ID
const GameComponent = GAMES_MAPPING[GAME_IDS.FRUIT_NINJA];

// Render dynamically
<GameComponent settings={settings} onSettingsChange={handleChange} />`}</code>
            </pre>
          </div>

          <div className="bg-background rounded-lg p-4">
            <h3 className="text-lg font-semibold text-text mb-3">TypeScript Types</h3>
            <pre className="bg-muted/20 rounded p-3 text-sm font-mono overflow-x-auto">
              <code>{`// Game settings interface
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
}`}</code>
            </pre>
          </div>
        </div>
      </div>
    </Sidebar>
  );
};

export default GamesApiReference;
