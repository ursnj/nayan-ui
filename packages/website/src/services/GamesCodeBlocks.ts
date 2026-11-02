// Code samples for the @nayan-ui/games docs. Every sample matches the library source
// (packages/games/src) of the engine-based release: GameProps, GameSettings, GAME_IDS,
// loadGameComponent and the theme helpers are copied from their declarations.

// ── Installation ──────────────────────────────────────────────────────

export const installNativeCode = `npx expo install @nayan-ui/games @nayan-ui/engine expo-asset expo-modules-core expo-build-properties`;

export const installWebCode = `npm install @nayan-ui/games @nayan-ui/engine react react-dom`;

export const peerDepsCode = `// package.json of @nayan-ui/games
"peerDependencies": {
  "@nayan-ui/engine": "*",
  "expo-asset": "*",          // optional: React Native apps (bundled sounds, models, textures)
  "expo-modules-core": "*",   // optional: React Native apps
  "react": "*",
  "react-dom": "*",           // optional: browser apps
  "react-native": "*"         // optional: React Native apps
}`;

export const appJsonCode = `{
  "expo": {
    "android": {
      "permissions": ["android.permission.VIBRATE"]
    },
    "plugins": [
      "expo-asset",
      ["expo-build-properties", { "android": { "minSdkVersion": 26 } }]
    ]
  }
}`;

export const metroConfigCode = `// metro.config.js
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Treasure Hunt and Play with Tua load .glb models through the engine
config.resolver.assetExts.push('glb', 'gltf');

module.exports = config;`;

export const devBuildCode = `# Expo Go does not contain the engine's native Rust core: use a development build
npx expo prebuild
npx expo run:ios       # or: npx expo run:android`;

// ── React Native usage ────────────────────────────────────────────────

export const simpleUsageCode = `import { useState } from 'react';
import { View } from 'react-native';
import { BlockBlast, DEFAULT_GAME_SETTINGS, type GameSettings } from '@nayan-ui/games';

export default function BlockBlastScreen() {
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_GAME_SETTINGS);

  // The parent must have a height: flex: 1 fills the screen
  return (
    <View style={{ flex: 1 }}>
      <BlockBlast settings={settings} onSettingsChange={setSettings} onEndGame={(m) => console.log(m)} />
    </View>
  );
}`;

export const nativeScreenCode = `// app/games/[id].tsx (Expo Router). One screen renders any game by id.
import { useCallback, useLayoutEffect, useState } from 'react';
import { Pressable, Text, useColorScheme, View } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useHeaderHeight } from '@react-navigation/elements';
import {
  DEFAULT_GAME_SETTINGS,
  GAME_IDS,
  GAMES_METADATA,
  loadGameComponent,
  type GameCompletionMetrics,
  type GameSettings
} from '@nayan-ui/games/services';

const isGameId = (id: string | undefined): id is GAME_IDS =>
  !!id && (Object.values(GAME_IDS) as string[]).includes(id);

export default function GameScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const gameId = isGameId(id) ? id : null;
  // Loads the game's module on first use, behind the library's loading screen
  const Game = loadGameComponent(gameId);
  const navigation = useNavigation();
  const headerHeight = useHeaderHeight();
  const scheme = useColorScheme();

  const [settings, setSettings] = useState<GameSettings>(() => ({
    ...DEFAULT_GAME_SETTINGS,
    theme: scheme === 'dark' ? 'dark' : 'light'
  }));

  // The built-in settings modal opens when isVisible is true and closes itself
  // by calling onSettingsChange({ ...settings, isVisible: false }).
  useLayoutEffect(() => {
    navigation.setOptions({
      title: gameId ? GAMES_METADATA[gameId].title : 'Game',
      headerRight: () => (
        <Pressable onPress={() => setSettings((s) => ({ ...s, isVisible: !s.isVisible }))}>
          <Text>Settings</Text>
        </Pressable>
      )
    });
  }, [navigation, gameId]);

  // Disable the back swipe while a run is in progress (including while paused)
  const onPlayingChange = useCallback(
    (playing: boolean) => navigation.setOptions({ gestureEnabled: !playing }),
    [navigation]
  );

  const onEndGame = useCallback((metrics: GameCompletionMetrics) => {
    // 'win' | 'lose' when a run ends, 'cancel' on Stop or leaving mid-run (draws are reported as 'cancel')
    if (metrics.status === 'cancel') return;
    console.log(gameId, metrics.status, Number(metrics.score), metrics.additionalData);
  }, [gameId]);

  if (!Game) return <Text>Game not available</Text>;

  return (
    <View style={{ flex: 1 }}>
      <Game
        settings={{ ...settings, offset: headerHeight }}
        onSettingsChange={setSettings}
        onPlayingChange={onPlayingChange}
        onEndGame={onEndGame}
        onReplayGame={() => console.log('Play again')}
        onShowLeaderboard={() => console.log('Open your leaderboard screen')}
        onShare={() => console.log('Share')}
      />
    </View>
  );
}`;

export const catalogCode = `import { FlatList, Pressable, Text } from 'react-native';
import { router } from 'expo-router';
import { GAMES_METADATA_LIST } from '@nayan-ui/games/services';

// Metadata only: importing @nayan-ui/games/services does not load any game module
export function GameCatalog() {
  return (
    <FlatList
      data={GAMES_METADATA_LIST}
      keyExtractor={(game) => game.id}
      renderItem={({ item }) => (
        <Pressable onPress={() => router.push(\`/games/\${item.id}\`)}>
          <Text>{item.title}</Text>
          <Text>{item.description}</Text>
          <Text>{item.categories.join(', ')}</Text>
        </Pressable>
      )}
    />
  );
}`;

// ── Browser usage ─────────────────────────────────────────────────────

export const webNextPlayerCode = `// components/GamePlayer.tsx (Next.js App Router)
'use client';

import dynamic from 'next/dynamic';
import type { GAME_IDS } from '@nayan-ui/games/services';

// The engine needs browser rendering and audio APIs: keep the game out of server rendering
const GameSession = dynamic(() => import('./GameSession'), {
  ssr: false,
  loading: () => <p>Loading game…</p>
});

export default function GamePlayer({ gameId }: { gameId: GAME_IDS }) {
  return (
    <div style={{ position: 'relative', height: '100dvh' }}>
      <GameSession gameId={gameId} />
    </div>
  );
}`;

export const webSessionCode = `// components/GameSession.tsx — works the same in Vite (render it directly, no dynamic()).
'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createKeyboardInput, type KeyboardInputMode } from '@nayan-ui/engine';
import {
  DEFAULT_GAME_SETTINGS,
  loadGameComponent,
  type GAME_IDS,
  type GameCompletionMetrics,
  type GameSettings
} from '@nayan-ui/games/services';

// Keyboard mapping per game (the same split the Playtura website uses)
const DRAG_GAMES = new Set(['car-racing', 'bike-racing', 'penguin-run', 'treasure-hunt', 'tank-1990', 'mob-control', 'paper-io', 'space-fighter']);
const SWIPE_GAMES = new Set(['game-2048', 'snake-3d', 'pac-man', 'maze-runner', 'crossy-road']);

export default function GameSession({ gameId, panelOpen = false }: { gameId: GAME_IDS; panelOpen?: boolean }) {
  const Game = useMemo(() => loadGameComponent(gameId), [gameId]);
  const surface = useRef<HTMLDivElement>(null);
  const [settings, setSettings] = useState<GameSettings>({ ...DEFAULT_GAME_SETTINGS, theme: 'light' });

  // Arrows / WASD, Space and Enter (Start / Stop / Play Again) drive the same pointer input as mouse and touch
  const mode: KeyboardInputMode = DRAG_GAMES.has(gameId) ? 'drag' : SWIPE_GAMES.has(gameId) ? 'swipe' : 'pointer';
  useEffect(() => {
    const element = surface.current;
    if (!element || settings.isVisible || panelOpen) return;
    element.focus({ preventScroll: true });
    const keyboard = createKeyboardInput(element, { mode });
    return () => keyboard.dispose();
  }, [mode, settings.isVisible, panelOpen]);

  const onEndGame = (metrics: GameCompletionMetrics) => {
    if (metrics.status !== 'cancel') console.log('Result', metrics);
  };

  if (!Game) return <p role="alert">This game is unavailable.</p>;

  return (
    <div ref={surface} tabIndex={0} style={{ position: 'absolute', inset: 0, display: 'flex', outline: 'none' }}>
      <Game
        settings={{ ...settings, offset: 0, paused: panelOpen }}
        onSettingsChange={setSettings}
        onEndGame={onEndGame}
      />
      <button
        type="button"
        style={{ position: 'absolute', top: 16, right: 16 }}
        onClick={() => setSettings((s) => ({ ...s, isVisible: true, anchor: { top: 64, right: 16 } }))}
      >
        Settings
      </button>
    </div>
  );
}`;

export const webDirectImportCode = `// A single game without the loader (Vite / client component)
import { useState } from 'react';
import { DEFAULT_GAME_SETTINGS, Sudoku, type GameSettings } from '@nayan-ui/games';

export function SudokuPage() {
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_GAME_SETTINGS);
  return (
    <div style={{ height: '100vh', display: 'flex' }}>
      <Sudoku settings={settings} onSettingsChange={setSettings} />
    </div>
  );
}`;

// ── Settings, results and theming ─────────────────────────────────────

export const pauseCode = `// Pause gameplay while your own panel, sheet or popover covers the game.
// Unlike isVisible, paused does not open the library's settings modal.
<Game settings={{ ...settings, paused: sheetOpen || infoPanelOpen }} onSettingsChange={setSettings} />

// Open the built-in settings (sounds, haptics, dark mode, how to play); gameplay pauses while it is open
setSettings((s) => ({ ...s, isVisible: true }));`;

export const endGameCode = `import type { GameCompletionMetrics } from '@nayan-ui/games';

function handleEndGame({ status, score, additionalData }: GameCompletionMetrics) {
  // Reported exactly once per run:
  //   'win' / 'lose'  when the run ends
  //   'cancel'        on Stop, on leaving the screen mid-run, and for a draw
  //                   (games whose rules allow a draw, e.g. Tic Tac Toe)
  // score is a string: Number(score) for leaderboards
  // additionalData is game-specific, e.g.
  //   Treasure Hunt: { gems, defeated, seconds }
  //   Play with Tua: { action, moves }
  if (status === 'cancel') return;
  saveResult({ status, score: Number(score) || 0, ...additionalData });
}`;

export const themeCode = `// Call once at app start (module scope of the root layout), before any game renders.
import { configureGameThemes, resolveGameTheme } from '@nayan-ui/games/services';

configureGameThemes({
  light: { BACKGROUND: '#F4F2FB', SURFACE: '#FFFFFF', BORDER: '#E4E0F2', SOLID: '#6D3DF5' },
  dark: { BACKGROUND: '#17122B', SURFACE: '#241D40', BORDER: '#3A3160', SOLID: '#9976F9', HEADER: { TINT: '#F9F8FB' } }
});

// Games render with settings.theme ('light' | 'dark'); without it they use the classic palette.
<Game settings={{ ...settings, theme: isDark ? 'dark' : 'light' }} onSettingsChange={setSettings} />

// Theme your own header / status bar with the same tokens
const { SURFACE, BORDER, TEXT } = resolveGameTheme(isDark ? 'dark' : 'light');`;

export const clearGameAssetsCode = `import { useState } from 'react';
import { Alert, Button } from 'react-native';
import { clearAssetCache } from '@nayan-ui/engine';

export function ClearSavedGameAssets() {
  const [busy, setBusy] = useState(false);
  async function clear() {
    setBusy(true);
    try {
      await clearAssetCache();
      Alert.alert('Saved assets cleared', 'Assets reload or rebuild on the next launch.');
    } catch {
      Alert.alert('Unable to clear assets', 'Please try again.');
    } finally {
      setBusy(false);
    }
  }
  return <Button title="Clear saved game assets" disabled={busy} onPress={() => void clear()} />;
}`;

// ── API reference ─────────────────────────────────────────────────────

export const rootExportsCode = `import {
  // 53 game components, each React.FC<GameProps>
  Arrows, BalloonBlaster, BikeRacing, BlockBlast, BlockBreaker, Bluk, BubbleShooter,
  CandyCrush, CarRacing, ChameleonRun, Checkers, ColorSwitch, ColorsSort, ConnectEmAll,
  CrossyRoad, DinoJump, DotsAndBoxes, FallingSticks, FindDifferentNumber, FlappyBird,
  FruitMerger, FruitNinja, Game2048, KnifeHit, LudoKing, MazeRunner, MemoryMatch,
  MineSweeper, MobControl, NumberSearch, NutsAndBolts, PacMan, PaperIo, PenguinRun,
  PerfectCircle, PipeConnect, PlayWithTua, PopitFidget, Reversi, SlidingNumbers, Snake3D,
  SnakesAndLadders, SpaceFighter, SpiderSolitaire, StackTower, Sudoku, Tangram, Tank1990,
  TicTacToe, TileHome, TreasureHunt, WhackAMole, WordSearch,

  // GamesService: every component, eagerly imported
  GAMES, GAMES_LIST, GAMES_MAPPING,

  // GamesMetadata
  GAMES_METADATA, GAMES_METADATA_LIST, type GameMetadata,

  // UtilsService
  GAME_IDS, DEFAULT_GAME_SETTINGS, formatTime, getScreenDimensions, getGameDimensions, isTablet,
  type GameProps, type GameSettings, type GameCompletionMetrics, type GameThemeMode,
  type GameComponent, type GameDefinition, type GameCategory,

  // SoundsService
  GAME_SOUNDS, playSound, playSoundVoice, playBankSound, stopAllSounds,
  preloadSounds, preloadGameSounds, warmSoundAssets, type SoundConfig
} from '@nayan-ui/games';`;

export const servicesExportsCode = `// No game component is imported here: use it for catalogs and lazy loading.
import {
  // GameLoaders
  loadGameComponent, warmUpGames, getGameAssetWarmupStatus,
  prioritizeGameAssets, pauseGameAssetWarmup, // deprecated no-ops

  // ThemeService
  configureGameThemes, resolveGameTheme, isThemedGame, THEMED_GAMES, GAME_THEMES,
  NIGHT_SCENE, DAY_SCENE, type GameTheme, type GameThemeOverrides,

  // Background pattern data
  gamePattern, PATTERN_GRID_COLOR,

  // Re-exported: GamesMetadata, SoundsService and UtilsService (GAME_IDS, GameProps, ...)
  GAMES_METADATA, GAMES_METADATA_LIST, GAME_IDS, DEFAULT_GAME_SETTINGS, type GameSettings
} from '@nayan-ui/games/services';`;

export const typescriptTypesCode = `export type GameThemeMode = 'light' | 'dark';

export interface GameSettings {
  isVisible: boolean;                       // the built-in settings modal is open (pauses gameplay)
  /** Pause gameplay while a host panel is open, without opening settings. */
  paused?: boolean;
  enableSounds: boolean;
  enableHaptics: boolean;
  enableMusic: boolean;                     // kept for compatibility; no game plays music
  offset?: number;                          // height of the host header above the game, 0 if none
  /** Host settings trigger's screen-space attachment point (web popover position). */
  anchor?: { top: number; right: number };
  /** Host app's colour scheme. Without it games use the classic palette. */
  theme?: GameThemeMode;
}

export interface GameCompletionMetrics {
  status: 'win' | 'lose' | 'cancel';
  score: string;
  additionalData?: Record<string, any>;     // optional game-specific data
}

export interface GameProps {
  settings: GameSettings;
  /** Hosts can disable navigation gestures for the duration of a run, including pauses. */
  onPlayingChange?: (playing: boolean) => void;
  onSettingsChange?: (settings: GameSettings) => void;
  onEndGame?: (metrics: GameCompletionMetrics) => void;
  onReplayGame?: () => void;                // Play Again pressed on the results card
  onShare?: () => void;                     // share button on the scoreboard
  onShareScreenshot?: () => void;           // preferred over onShare; also on the results card
  onShowLeaderboard?: () => void;           // leaderboard button on the scoreboard
  bannerAd?: ReactNode;                     // rendered in the results card
}

export type GameComponent = ComponentType<GameProps>;

export type GameCategory =
  | 'arcade' | 'block' | 'casual' | 'action' | 'brain'
  | 'education' | 'puzzle' | 'racing' | 'strategy';

export interface GameMetadata {
  id: GAME_IDS;
  title: string;
  description: string;
  instructions: string[];                   // shown under "How to play" in the settings modal
  categories: GameCategory[];
  /** Catalog badge only; this does not restrict gameplay. */
  isPremium?: boolean;
}

export interface GameDefinition {
  id: GAME_IDS;
  title: string;
  description: string;
  instructions: string[];
  categories: GameCategory[];
  component: GameComponent;
}`;

export const defaultGameSettingsCode = `export const DEFAULT_GAME_SETTINGS: GameSettings = {
  isVisible: false,
  enableSounds: true,
  enableHaptics: true,
  enableMusic: false,
  offset: 0
};
// theme is unset: pass 'light' or 'dark' to follow your app (classic palette otherwise)`;

export const gameIdsEnumCode = `export enum GAME_IDS {
  WHACK_A_MOLE = 'whack-a-mole',
  POPIT_FIDGET = 'popit-fidget',
  FRUIT_NINJA = 'fruit-ninja',
  BALLOON_BLASTER = 'balloon-blaster',
  SPACE_FIGHTER = 'space-fighter',
  MAZE_RUNNER = 'maze-runner',
  SLIDING_NUMBERS = 'sliding-numbers',
  GAME_2048 = 'game-2048',
  DINO_JUMP = 'dino-jump',
  COLORS_SORT = 'colors-sort',
  FRUIT_MERGER = 'fruit-merger',
  FLAPPY_BIRD = 'flappy-bird',
  CANDY_CRUSH = 'candy-crush',
  SNAKE_3D = 'snake-3d',
  CAR_RACING = 'car-racing',
  BIKE_RACING = 'bike-racing',
  BLOCK_BLAST = 'block-blast',
  BUBBLE_SHOOTER = 'bubble-shooter',
  PERFECT_CIRCLE = 'perfect-circle',
  SPIDER_SOLITAIRE = 'spider-solitaire',
  TIC_TAC_TOE = 'tic-tac-toe',
  PAC_MAN = 'pac-man',
  TILE_HOME = 'tile-home',
  WORD_SEARCH = 'word-search',
  CONNECT_EM_ALL = 'connect-em-all',
  NUTS_AND_BOLTS = 'nuts-and-bolts',
  NUMBER_SEARCH = 'number-search',
  DOTS_AND_BOXES = 'dots-and-boxes',
  LUDO_KING = 'ludo-king',
  TANK_1990 = 'tank-1990',
  BLOCK_BREAKER = 'block-breaker',
  STACK_TOWER = 'stack-tower',
  MINE_SWEEPER = 'mine-sweeper',
  SUDOKU = 'sudoku',
  KNIFE_HIT = 'knife-hit',
  COLOR_SWITCH = 'color-switch',
  PIPE_CONNECT = 'pipe-connect',
  ARROWS = 'arrows',
  FIND_DIFFERENT_NUMBER = 'find-different-number',
  SNAKES_AND_LADDERS = 'snakes-and-ladders',
  BLUK = 'bluk',
  CHAMELEON_RUN = 'chameleon-run',
  MOB_CONTROL = 'mob-control',
  PAPER_IO = 'paper-io',
  CROSSY_ROAD = 'crossy-road',
  TANGRAM = 'tangram',
  CHECKERS = 'checkers',
  MEMORY_MATCH = 'memory-match',
  FALLING_STICKS = 'falling-sticks',
  REVERSI = 'reversi',
  PENGUIN_RUN = 'penguin-run',
  PLAY_WITH_TUA = 'play-with-tua',
  TREASURE_HUNT = 'treasure-hunt'
}`;

export const loadersCode = `/** The React component for a game id, loading its module on first use (null for an unknown id). */
loadGameComponent(gameId: GAME_IDS | null | undefined): React.ComponentType<GameProps> | null;

/** Starts engine initialization early (e.g. on the home screen). Returns a no-op cleanup. */
warmUpGames(): () => void;

/** Kept for older integrations: always { running: false, completed: 0, failed: 0, complete: false }. */
getGameAssetWarmupStatus(): { running: boolean; completed: number; failed: number; complete: boolean };

/** @deprecated No-ops: each game's loading screen now prepares its own assets. */
prioritizeGameAssets(ids: readonly string[]): void;
pauseGameAssetWarmup(): void;`;

export const gamesCollectionsCode = `// Root export only: importing these loads every game module.
const GAMES: Record<GAME_IDS, GameDefinition>;          // metadata + component per id
const GAMES_LIST: GameDefinition[];                      // Object.values(GAMES)
const GAMES_MAPPING: Record<GAME_IDS, GameComponent>;    // id -> component

// Also in @nayan-ui/games/services (metadata only, no components)
const GAMES_METADATA: Record<GAME_IDS, GameMetadata>;
const GAMES_METADATA_LIST: GameMetadata[];

// Example
const { title, instructions, categories } = GAMES_METADATA[GAME_IDS.SUDOKU];
const Component = GAMES_MAPPING[GAME_IDS.SUDOKU];`;

export const themeApiCode = `/** Merge your palette over the built-in light / dark themes. The classic theme is fixed. */
configureGameThemes(overrides: GameThemeOverrides): void;

/** The active theme for a mode; no mode returns the classic palette. */
resolveGameTheme(mode?: GameThemeMode): GameTheme;

/** Games that render with settings.theme (currently every GAME_IDS value). */
THEMED_GAMES: ReadonlySet<GAME_IDS>;
isThemedGame(gameId: GAME_IDS | null | undefined): boolean;

GAME_THEMES: { classic: GameTheme; light: GameTheme; dark: GameTheme };  // built-ins
NIGHT_SCENE, DAY_SCENE                    // sky / hill palettes used by outdoor scenes

type GameThemeOverrides = Partial<Record<GameThemeMode, DeepPartial<Omit<GameTheme, 'mode' | 'isDark'>>>>;

interface GameTheme {
  mode: 'classic' | GameThemeMode;
  isDark: boolean;
  BACKGROUND: string; PATTERN_OPACITY: number;
  SURFACE: string; BORDER: string; BORDER_WIDTH: number; DIVIDER: string;
  TEXT: string; TEXT_MUTED: string; LABEL: string; TEXT_SUBTLE: string; TEXT_SHADOW: string;
  SOLID: string; ON_SOLID: string;
  SCORE_HIGHLIGHT: string; DANGER: string; CHIP: string;
  OVERLAY: string;
  SWITCH_TRACK_OFF: string; SWITCH_TRACK_ON: string; SWITCH_THUMB: string;
  HEADER: { BACKGROUND: string; BORDER: string; TINT: string };
  BOARD: { SURFACE: string; BORDER: string; CELL_EMPTY: string; GRID_LINE: string;
           CELL_HIGHLIGHT: string; CELL_INVALID: string; FLASH: string };
}`;

export const soundsApiCode = `interface SoundConfig {
  sfx?: SfxName;        // a bundled sound effect
  volume?: number;      // 0..2, default 1
  pitch?: number;       // playback speed (shifts pitch), default 1
  cooldown?: number;    // minimum gap between repeats, ms
  loop?: boolean;       // repeat until the voice is stopped
  text?: string; rate?: number; language?: string;  // legacy, ignored
}

playSound(sound: SoundConfig, enabled: boolean): void;              // no-op when !enabled or muted
playSoundVoice(sound: SoundConfig, enabled: boolean): Voice | null; // returns the engine voice to stop later
playBankSound(bank: SoundBank<K> | undefined, name: K, options?: AudioPlayOptions): Voice | null;
stopAllSounds(): void;
preloadSounds(sounds?: Record<string, SoundConfig> | SoundConfig[]): void;
preloadGameSounds(gameId: string): void;
warmSoundAssets(gameIds: readonly string[]): Iterable<() => Promise<unknown>>;

GAME_SOUNDS.STOP; GAME_SOUNDS.RESET; GAME_SOUNDS.DRAW;   // shared
GAME_SOUNDS.STACK_TOWER.PLACE;                           // per game: GAME_SOUNDS.<GAME_ID_IN_CAPS>.<EVENT>`;

export const utilsApiCode = `formatTime(seconds: number): string;            // 75 -> '01:15'
getScreenDimensions(): { width: number; height: number };
getGameDimensions(): { width: number; height: number; screenWidth: number };  // width capped for tablets
isTablet: boolean;                               // window width > 640 at import time
gamePattern(width: number, height: number): GamePattern;  // the background pattern's shapes
PATTERN_GRID_COLOR: string;`;

// ── Build your own engine game ────────────────────────────────────────

export const gameFolderCode = `src/games/stack-tower/
├── StackTower.tsx           # screen: engineGame + useEngineGame + EngineGameScreen (HUD columns, results card)
├── StackTowerConstants.ts   # tuning: rules, timings, colours, layout for a view size, light
├── StackTowerGame.ts        # rules with no React: createGame / start / reset / tick / tap / dispose
└── StackTowerScene.ts       # what it draws: cached meshes, spawn / animate entities, theme repaint

# Larger games split further and keep the same roles:
#   <Name>Rules.ts   pure rules (boards, moves, AI) that tests can call without an engine
#   <Name>Meshes.ts  procedural models cached once per app`;

export const gameModuleCode = `// MyGameGame.ts — rules and lifecycle, no React
import { type Camera, World } from '@nayan-ui/engine';
import type { GameTheme } from '../../services/ThemeService';
import type { HudFeedback } from '../shared/EngineHud';
import { POINTS, TIME_LIMIT } from './MyGameConstants';
import { buildScene, setSceneTheme, type Scene } from './MyGameScene';

type Phase = 'ready' | 'playing' | 'over';

export function createGame(theme: GameTheme) {
  const world = new World(400);                    // entity capacity, shared with particles
  const camera: Camera = { eye: [0, 0, 240], target: [0, 0, 0], fov: 1, ortho: 1 };
  const g = {
    world, camera, theme,
    scene: null as Scene | null,
    phase: 'ready' as Phase,
    won: false,
    // Score and countdown live in the engine's Rust scoreboard, advanced by world.update
    get score() { return world.scoreboard.score; },
    // UI hooks, assigned by the screen's wire()
    onPhase: (_p: Phase) => {},
    onScore: (_s: number) => {},
    onTime: (_t: number) => {},
    hudFeedback: {} as HudFeedback                // { message: 'PERFECT!' } shows on the next frame
  };
  world.scoreboard.reset(0, TIME_LIMIT);           // lives, countdown shown (stopped) on the ready screen
  world.scoreboard.handlers = {
    onScore: (s) => g.onScore(s),
    onSecond: (t) => g.onTime(t),
    onTimeUp: () => g.phase === 'playing' && end(g, true)
  };
  return g;
}
export type Game = ReturnType<typeof createGame>;

export function setLayout(g: Game, width: number, height: number) {
  g.scene = buildScene(g.world, width, height, g.theme);
}

export function setTheme(g: Game, theme: GameTheme) {
  g.theme = theme;
  if (g.scene) setSceneTheme(g.world, g.scene, theme);   // repaint in place, keep progress
}

export function start(g: Game) {
  if (g.phase !== 'ready') return;
  g.phase = 'playing';
  g.world.scoreboard.reset();
  g.world.scoreboard.startCountdown(TIME_LIMIT);
  g.onPhase('playing');
}

/** Stop and Play Again: back to the ready state in the same world (the GPU view is kept). */
export function reset(g: Game) {
  g.world.cancelTimers();                          // drop pending world.after() callbacks
  // ...despawn this run's entities
  g.world.scoreboard.reset(0, TIME_LIMIT);
  g.won = false;
  g.phase = 'ready';
  g.hudFeedback.message = undefined;
  g.onPhase('ready');
}

export function dispose(g: Game) {
  g.world.dispose();
}

export function tick(g: Game, dt: number) {
  if (g.world.isDisposed) return;                 // a frame can arrive after unmount
  // ...move things for this frame
  g.world.update(dt);                              // the game steps its own world
}

export function tap(g: Game, x: number, y: number) {
  if (g.phase !== 'playing') return;
  g.world.scoreboard.add(POINTS);
  // after a miss: g.world.scoreboard.stop(); g.world.after(0.3, () => end(g, false));
}

function end(g: Game, won: boolean) {
  g.world.scoreboard.stop();
  g.won = won;
  g.phase = 'over';
  g.onPhase('over');                               // useEngineGame reports win / lose once
}`;

export const gameScreenCode = `// MyGame.tsx — the screen
import { HapticType } from '../../services/HapticsService';
import { GAME_SOUNDS } from '../../services/SoundsService';
import { GAME_IDS } from '../../services/UtilsService';
import { engineGame, EngineGameScreen } from '../shared/EngineGameScreen';
import { scoreColumn, timerColumn } from '../shared/EngineHud';
import { useEngineGame } from '../shared/useEngineGame';
import { useLiveState } from '../shared/useLiveState';
import { LIGHT, TIME_LIMIT } from './MyGameConstants';
import { createGame, dispose, reset, setLayout, setTheme, start, tap, tick } from './MyGameGame';

const SOUNDS = GAME_SOUNDS.MY_GAME;

export const MyGame = engineGame(GAME_IDS.MY_GAME, (props) => {
  const [score, setScore] = useLiveState(0);
  const [timeLeft, setTimeLeft] = useLiveState(TIME_LIMIT);

  const { theme, status, screen, gameOver } = useEngineGame(props, {
    gameId: GAME_IDS.MY_GAME,
    create: createGame,
    start, reset, dispose, tick, setTheme,
    resize: (g, width, height) => setLayout(g, width, height),
    tap: (g, x, y) => tap(g, x, y),             // or drag: (g, e) => ... for e.phase 'start' | 'move' | 'end'
    sounds: SOUNDS,                              // preloaded before the first sound
    onStart: (fx) => fx(SOUNDS.START, HapticType.SUCCESS),
    onStop: (fx) => fx(null, HapticType.MEDIUM),
    onOver: (fx, s) => fx(s === 'win' ? SOUNDS.WIN : SOUNDS.GAME_OVER, s === 'win' ? HapticType.SUCCESS : HapticType.ERROR),
    wire: (g, fx) => {
      g.onScore = setScore;
      g.onTime = setTimeLeft;
    }
  });

  return (
    <EngineGameScreen
      {...screen}
      light={LIGHT}
      columns={[scoreColumn(score), timerColumn(timeLeft, theme)]}
      subtext="Tap to play!"
      gameOver={gameOver({
        title: status === 'win' ? 'AMAZING!' : 'GAME OVER',
        message: status === 'win' ? 'You beat the clock!' : 'So close!',
        scoreLabel: 'Final Score',
        score,
        buttonText: 'Play Again!'
      })}
    />
  );
});`;

export const sceneCode = `// MyGameScene.ts — what the game draws
import { effects, extrude, merge, Path, quat, type Entity, type Model, type World } from '@nayan-ui/engine';
import { cacheGameAsset, createGameMesh } from '../shared/EngineMeshes';
import { toColor } from '../shared/EngineUtils';

// Build each mesh once per app session and reuse it: mesh ids are app-wide and never freed.
let blockMesh: Model | undefined;
const block = () =>
  (blockMesh ??= cacheGameAsset('my-game/MyGameScene:block', () =>
    createGameMesh(merge([{ geometry: extrude(new Path().addRoundedRect(-20, -10, 40, 20, 4), { depth: 16 }) }]), { shine: 0.4 })
  ));

export function spawnBlock(world: World, x: number, y: number, color: string): Entity {
  return world.spawn({ mesh: block(), position: [x, y, 0], color: toColor(color) });
}

// Per-frame moves without allocating: queue on world.transforms after update(), flush once
export function moveBlocks(world: World, blocks: { entity: Entity; x: number; y: number; angle: number }[]) {
  const t = world.transforms;
  for (const b of blocks) {
    const [qx, qy, qz, qw] = quat.z(b.angle);
    t.transform(b.entity, b.x, b.y, 0, qx, qy, qz, qw);
  }
  t.flush();
}

// One call each; the particles run in the Rust core
export function celebrate(world: World, x: number, y: number) {
  effects.confetti(world, { position: [x, y, 10], colors: [toColor('#FFD43B'), toColor('#FF6BD6')], size: 4, speed: 160, count: 40, lifetime: 1.2, gravity: -300 });
}

export async function clearPiece(world: World, entity: Entity, color: string) {
  await effects.pop(world, entity, { scale: 1, color: toColor(color) });
  world.despawn(entity);
}`;

export const registerCode = `// 1. services/UtilsService.ts — the id
export enum GAME_IDS { /* ... */ MY_GAME = 'my-game' }

// 2. services/GamesMetadata.ts — title, description, instructions (shown in the settings modal), categories
[GAME_IDS.MY_GAME]: {
  id: GAME_IDS.MY_GAME,
  title: 'My Game',
  description: 'One sentence for catalogs.',
  instructions: ['Tap to drop the block.', 'Survive the timer to win.'],
  categories: ['arcade']
},

// 3. services/GamesService.ts — the eager registry
[GAME_IDS.MY_GAME]: { ...GAMES_METADATA[GAME_IDS.MY_GAME], component: MyGame },

// 4. services/GameLoaders.ts — the lazy loader used by loadGameComponent
[GAME_IDS.MY_GAME]: () => require('../games/my-game/MyGame').MyGame,

// 5. services/SoundsService.ts — GAME_SOUNDS.MY_GAME = { START: {...}, WIN: {...}, ... }

// 6. src/index.tsx — the public export
export * from './games/my-game/MyGame';`;
