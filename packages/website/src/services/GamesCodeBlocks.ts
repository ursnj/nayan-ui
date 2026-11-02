// Code samples for the @nayan-ui/games docs. Every sample matches the library source
// (packages/games/src) of the engine-based release.

// ── Installation ──────────────────────────────────────────────────────

export const installNativeCode = `npx expo install @nayan-ui/games @nayan-ui/engine expo-asset expo-modules-core expo-build-properties`;

export const installWebCode = `npm install @nayan-ui/games @nayan-ui/engine react react-dom`;

export const peerDepsCode = `"peerDependencies": {
  "@nayan-ui/engine": "^1.0.0-beta.2",
  "react": "*",
  "react-native": "*",        // optional: React Native apps
  "expo-asset": "*",          // optional: React Native apps (bundled sounds, models, textures)
  "expo-modules-core": "*",   // optional: React Native apps
  "react-dom": "*"            // optional: browser apps
}`;

export const appJsonCode = `{
  "expo": {
    "android": { "permissions": ["android.permission.VIBRATE"] },
    "plugins": ["expo-asset", ["expo-build-properties", { "android": { "minSdkVersion": 26 } }]]
  }
}`;

export const metroConfigCode = `const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push('glb', 'gltf'); // Treasure Hunt and Play with Tua load models
module.exports = config;`;

export const devBuildCode = `npx expo prebuild
npx expo run:ios       # or: npx expo run:android`;

export const warmUpCode = `import { useEffect } from 'react';
import { warmUpGameFonts, warmUpGames } from '@nayan-ui/games/services';

export default function RootLayout() {
  useEffect(() => {
    const id = setTimeout(() => {
      warmUpGames();     // GPU device and pipelines
      warmUpGameFonts(); // scoreboard fonts
    }, 0);
    return () => clearTimeout(id);
  }, []);
  // ...providers and navigator
}`;

// ── React Native usage ────────────────────────────────────────────────

export const simpleUsageCode = `import { useState } from 'react';
import { View } from 'react-native';
import { BlockBlast, DEFAULT_GAME_SETTINGS, type GameSettings } from '@nayan-ui/games';

export default function BlockBlastScreen() {
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_GAME_SETTINGS);
  return (
    <View style={{ flex: 1 }}>
      <BlockBlast settings={settings} onSettingsChange={setSettings} onEndGame={(m) => console.log(m)} />
    </View>
  );
}`;

export const nativeScreenCode = `import { useLayoutEffect, useState } from 'react';
import { Pressable, Text, useColorScheme, View } from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useHeaderHeight } from '@react-navigation/elements';
import { DEFAULT_GAME_SETTINGS, GAME_IDS, GAMES_METADATA, loadGameComponent, type GameSettings } from '@nayan-ui/games/services';

const isGameId = (id?: string): id is GAME_IDS => (Object.values(GAME_IDS) as string[]).includes(id ?? '');

export default function GameScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const gameId = isGameId(id) ? id : null;
  const Game = loadGameComponent(gameId); // loads only this game's module
  const navigation = useNavigation();
  const headerHeight = useHeaderHeight();
  const scheme = useColorScheme();
  const [settings, setSettings] = useState<GameSettings>({ ...DEFAULT_GAME_SETTINGS, theme: scheme === 'dark' ? 'dark' : 'light' });

  useLayoutEffect(() => {
    navigation.setOptions({
      title: gameId ? GAMES_METADATA[gameId].title : 'Game',
      headerRight: () => (
        <Pressable onPress={() => setSettings((s) => ({ ...s, isVisible: true }))}>
          <Text>Settings</Text>
        </Pressable>
      )
    });
  }, [navigation, gameId]);

  if (!Game) return <Text>Game not available</Text>;
  return (
    <View style={{ flex: 1 }}>
      <Game
        settings={{ ...settings, offset: headerHeight }}
        onSettingsChange={setSettings}
        onPlayingChange={(playing) => navigation.setOptions({ gestureEnabled: !playing })}
        onEndGame={(m) => m.status !== 'cancel' && console.log(gameId, m.status, Number(m.score))}
        onShowLeaderboard={() => console.log('leaderboard')}
        onShare={() => console.log('share')}
      />
    </View>
  );
}`;

export const catalogCode = `import { FlatList, Pressable, Text } from 'react-native';
import { router } from 'expo-router';
import { GAMES_METADATA_LIST } from '@nayan-ui/games/services';

export function GameCatalog() {
  return (
    <FlatList
      data={GAMES_METADATA_LIST}
      keyExtractor={(game) => game.id}
      renderItem={({ item }) => (
        <Pressable onPress={() => router.push(\`/games/\${item.id}\`)}>
          <Text>{item.title}</Text>
          <Text>{item.categories.join(', ')}</Text>
        </Pressable>
      )}
    />
  );
}`;

// ── Browser usage ─────────────────────────────────────────────────────

export const webNextPlayerCode = `'use client';
import dynamic from 'next/dynamic';
import type { GAME_IDS } from '@nayan-ui/games/services';

const GameSession = dynamic(() => import('./GameSession'), { ssr: false, loading: () => <p>Loading…</p> });

export default function GamePlayer({ gameId }: { gameId: GAME_IDS }) {
  return (
    <div style={{ position: 'relative', height: '100dvh' }}>
      <GameSession gameId={gameId} />
    </div>
  );
}`;

export const webSessionCode = `'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createKeyboardInput, type KeyboardInputMode } from '@nayan-ui/engine';
import { DEFAULT_GAME_SETTINGS, loadGameComponent, type GAME_IDS, type GameSettings } from '@nayan-ui/games/services';

const DRAG = new Set(['car-racing', 'bike-racing', 'penguin-run', 'treasure-hunt', 'tank-1990', 'mob-control', 'paper-io', 'space-fighter']);
const SWIPE = new Set(['game-2048', 'snake-3d', 'pac-man', 'maze-runner', 'crossy-road']);

export default function GameSession({ gameId, panelOpen = false }: { gameId: GAME_IDS; panelOpen?: boolean }) {
  const Game = useMemo(() => loadGameComponent(gameId), [gameId]);
  const surface = useRef<HTMLDivElement>(null);
  const [settings, setSettings] = useState<GameSettings>({ ...DEFAULT_GAME_SETTINGS, theme: 'light' });
  const mode: KeyboardInputMode = DRAG.has(gameId) ? 'drag' : SWIPE.has(gameId) ? 'swipe' : 'pointer';

  useEffect(() => {
    const element = surface.current;
    if (!element || settings.isVisible || panelOpen) return; // let modals and panels take the keys
    element.focus({ preventScroll: true });
    const keyboard = createKeyboardInput(element, { mode });
    return () => keyboard.dispose();
  }, [mode, settings.isVisible, panelOpen]);

  if (!Game) return <p role="alert">This game is unavailable.</p>;
  return (
    <div ref={surface} tabIndex={0} style={{ position: 'absolute', inset: 0, display: 'flex', outline: 'none' }}>
      <Game settings={{ ...settings, offset: 0, paused: panelOpen }} onSettingsChange={setSettings} />
      <button style={{ position: 'absolute', top: 16, right: 16 }}
        onClick={() => setSettings((s) => ({ ...s, isVisible: true, anchor: { top: 64, right: 16 } }))}>
        Settings
      </button>
    </div>
  );
}`;

export const webDirectImportCode = `import { useState } from 'react';
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

export const pauseCode = `// Pause under your own sheet or panel (no modal)
<Game settings={{ ...settings, paused: sheetOpen }} onSettingsChange={setSettings} />

// Open the built-in settings modal (also pauses)
setSettings((s) => ({ ...s, isVisible: true }));`;

export const endGameCode = `import type { GameCompletionMetrics } from '@nayan-ui/games';

function handleEndGame({ status, score, additionalData }: GameCompletionMetrics) {
  if (status === 'cancel') return;   // Stop, leaving mid-run, or a draw
  saveResult({ status, score: Number(score) || 0, ...additionalData });
}`;

export const themeCode = `import { configureGameThemes, resolveGameTheme } from '@nayan-ui/games/services';

// Once at app start, before any game renders
configureGameThemes({
  light: { BACKGROUND: '#F4F2FB', SURFACE: '#FFFFFF', SOLID: '#6D3DF5' },
  dark: { BACKGROUND: '#17122B', SURFACE: '#241D40', SOLID: '#9976F9', HEADER: { TINT: '#F9F8FB' } }
});

<Game settings={{ ...settings, theme: isDark ? 'dark' : 'light' }} onSettingsChange={setSettings} />

// Same tokens for your header and status bar
const { SURFACE, BORDER, TEXT } = resolveGameTheme(isDark ? 'dark' : 'light');`;

export const clearGameAssetsCode = `import { Alert, Button } from 'react-native';
import { clearAssetCache } from '@nayan-ui/engine';

export function ClearSavedGameAssets() {
  const clear = () =>
    clearAssetCache().then(
      () => Alert.alert('Saved assets cleared', 'They rebuild on the next launch.'),
      () => Alert.alert('Unable to clear assets', 'Please try again.')
    );
  return <Button title="Clear saved game assets" onPress={() => void clear()} />;
}`;

// ── API reference ─────────────────────────────────────────────────────

export const rootExportsCode = `import {
  // 53 components, each React.FC<GameProps>
  Arrows, BalloonBlaster, BikeRacing, BlockBlast, BlockBreaker, Bluk, BubbleShooter,
  CandyCrush, CarRacing, ChameleonRun, Checkers, ColorSwitch, ColorsSort, ConnectEmAll,
  CrossyRoad, DinoJump, DotsAndBoxes, FallingSticks, FindDifferentNumber, FlappyBird,
  FruitMerger, FruitNinja, Game2048, KnifeHit, LudoKing, MazeRunner, MemoryMatch,
  MineSweeper, MobControl, NumberSearch, NutsAndBolts, PacMan, PaperIo, PenguinRun,
  PerfectCircle, PipeConnect, PlayWithTua, PopitFidget, Reversi, SlidingNumbers, Snake3D,
  SnakesAndLadders, SpaceFighter, SpiderSolitaire, StackTower, Sudoku, Tangram, Tank1990,
  TicTacToe, TileHome, TreasureHunt, WhackAMole, WordSearch,

  GAMES, GAMES_LIST, GAMES_MAPPING,                      // GamesService (imports every game)
  GAMES_METADATA, GAMES_METADATA_LIST, type GameMetadata, // GamesMetadata
  GAME_IDS, DEFAULT_GAME_SETTINGS, formatTime, getScreenDimensions, getGameDimensions, isTablet,
  type GameProps, type GameSettings, type GameCompletionMetrics, type GameThemeMode,
  type GameComponent, type GameDefinition, type GameCategory, // UtilsService
  GAME_SOUNDS, playSound, playSoundVoice, playBankSound, stopAllSounds,
  preloadSounds, preloadGameSounds, warmSoundAssets, type SoundConfig // SoundsService
} from '@nayan-ui/games';`;

export const servicesExportsCode = `import {
  loadGameComponent, warmUpGames, warmUpGameFonts, getGameAssetWarmupStatus,
  prioritizeGameAssets, pauseGameAssetWarmup,              // deprecated no-ops
  configureGameThemes, resolveGameTheme, isThemedGame, THEMED_GAMES, GAME_THEMES,
  NIGHT_SCENE, DAY_SCENE, type GameTheme, type GameThemeOverrides,
  gamePattern, PATTERN_GRID_COLOR,
  // plus everything from GamesMetadata, SoundsService and UtilsService
} from '@nayan-ui/games/services';`;

export const gameComponentCode = `import { Sudoku, type GameCompletionMetrics } from '@nayan-ui/games';

<View style={{ flex: 1 }}>
  <Sudoku settings={settings} onSettingsChange={setSettings} onEndGame={(m: GameCompletionMetrics) => save(m)} />
</View>`;

export const typescriptTypesCode = `type GameThemeMode = 'light' | 'dark';

interface GameSettings {
  isVisible: boolean;                   // settings modal open (pauses)
  paused?: boolean;                     // pause without the modal
  enableSounds: boolean;
  enableHaptics: boolean;
  enableMusic: boolean;                 // compatibility only
  offset?: number;                      // host header height, 0 if none
  anchor?: { top: number; right: number }; // web popover position
  theme?: GameThemeMode;                // unset: classic palette
}

interface GameCompletionMetrics {
  status: 'win' | 'lose' | 'cancel';
  score: string;
  additionalData?: Record<string, any>;
}

interface GameProps {
  settings: GameSettings;
  onPlayingChange?: (playing: boolean) => void;
  onSettingsChange?: (settings: GameSettings) => void;
  onEndGame?: (metrics: GameCompletionMetrics) => void;
  onReplayGame?: () => void;
  onShare?: () => void;
  onShareScreenshot?: () => void;
  onShowLeaderboard?: () => void;
  bannerAd?: ReactNode;
}

type GameComponent = ComponentType<GameProps>;
type GameCategory = 'arcade' | 'block' | 'casual' | 'action' | 'brain' | 'education' | 'puzzle' | 'racing' | 'strategy';

interface GameMetadata {
  id: GAME_IDS;
  title: string;
  description: string;
  instructions: string[];               // "How to play" in the settings modal
  categories: GameCategory[];
  isPremium?: boolean;                  // catalog badge only
}

interface GameDefinition {
  id: GAME_IDS; title: string; description: string; instructions: string[]; categories: GameCategory[];
  component: GameComponent;
}`;

export const defaultGameSettingsCode = `const DEFAULT_GAME_SETTINGS: GameSettings = {
  isVisible: false,
  enableSounds: true,
  enableHaptics: true,
  enableMusic: false,
  offset: 0
}; // theme unset`;

export const gameIdsEnumCode = `enum GAME_IDS {
  WHACK_A_MOLE = 'whack-a-mole',          POPIT_FIDGET = 'popit-fidget',
  FRUIT_NINJA = 'fruit-ninja',            BALLOON_BLASTER = 'balloon-blaster',
  SPACE_FIGHTER = 'space-fighter',        MAZE_RUNNER = 'maze-runner',
  SLIDING_NUMBERS = 'sliding-numbers',    GAME_2048 = 'game-2048',
  DINO_JUMP = 'dino-jump',                COLORS_SORT = 'colors-sort',
  FRUIT_MERGER = 'fruit-merger',          FLAPPY_BIRD = 'flappy-bird',
  CANDY_CRUSH = 'candy-crush',            SNAKE_3D = 'snake-3d',
  CAR_RACING = 'car-racing',              BIKE_RACING = 'bike-racing',
  BLOCK_BLAST = 'block-blast',            BUBBLE_SHOOTER = 'bubble-shooter',
  PERFECT_CIRCLE = 'perfect-circle',      SPIDER_SOLITAIRE = 'spider-solitaire',
  TIC_TAC_TOE = 'tic-tac-toe',            PAC_MAN = 'pac-man',
  TILE_HOME = 'tile-home',                WORD_SEARCH = 'word-search',
  CONNECT_EM_ALL = 'connect-em-all',      NUTS_AND_BOLTS = 'nuts-and-bolts',
  NUMBER_SEARCH = 'number-search',        DOTS_AND_BOXES = 'dots-and-boxes',
  LUDO_KING = 'ludo-king',                TANK_1990 = 'tank-1990',
  BLOCK_BREAKER = 'block-breaker',        STACK_TOWER = 'stack-tower',
  MINE_SWEEPER = 'mine-sweeper',          SUDOKU = 'sudoku',
  KNIFE_HIT = 'knife-hit',                COLOR_SWITCH = 'color-switch',
  PIPE_CONNECT = 'pipe-connect',          ARROWS = 'arrows',
  FIND_DIFFERENT_NUMBER = 'find-different-number',
  SNAKES_AND_LADDERS = 'snakes-and-ladders',
  BLUK = 'bluk',                          CHAMELEON_RUN = 'chameleon-run',
  MOB_CONTROL = 'mob-control',            PAPER_IO = 'paper-io',
  CROSSY_ROAD = 'crossy-road',            TANGRAM = 'tangram',
  CHECKERS = 'checkers',                  MEMORY_MATCH = 'memory-match',
  FALLING_STICKS = 'falling-sticks',      REVERSI = 'reversi',
  PENGUIN_RUN = 'penguin-run',            PLAY_WITH_TUA = 'play-with-tua',
  TREASURE_HUNT = 'treasure-hunt'
}`;

export const loadersCode = `loadGameComponent(gameId: GAME_IDS | null | undefined): ComponentType<GameProps> | null; // lazy, null if unknown
warmUpGames(): () => void;      // GPU device + pipelines on a native thread; returns a no-op cleanup
warmUpGameFonts(): void;        // scoreboard fonts on native threads

// Kept for older integrations
getGameAssetWarmupStatus(): { running: false; completed: 0; failed: 0; complete: false };
prioritizeGameAssets(ids: readonly string[]): void;  // deprecated no-op
pauseGameAssetWarmup(): void;                        // deprecated no-op`;

export const gamesCollectionsCode = `// Root entry only (imports every game)
GAMES: Record<GAME_IDS, GameDefinition>;
GAMES_LIST: GameDefinition[];
GAMES_MAPPING: Record<GAME_IDS, GameComponent>;

// Both entries (metadata only)
GAMES_METADATA: Record<GAME_IDS, GameMetadata>;
GAMES_METADATA_LIST: GameMetadata[];

const { title, instructions } = GAMES_METADATA[GAME_IDS.SUDOKU];`;

export const themeApiCode = `configureGameThemes(overrides: GameThemeOverrides): void; // merge over light / dark (classic is fixed)
resolveGameTheme(mode?: GameThemeMode): GameTheme;        // no mode: classic
THEMED_GAMES: ReadonlySet<GAME_IDS>;                      // every game
isThemedGame(gameId: GAME_IDS | null | undefined): boolean;
GAME_THEMES: { classic: GameTheme; light: GameTheme; dark: GameTheme };
NIGHT_SCENE; DAY_SCENE;                                   // outdoor sky / hill palettes

type GameThemeOverrides = Partial<Record<GameThemeMode, DeepPartial<Omit<GameTheme, 'mode' | 'isDark'>>>>;

interface GameTheme {
  mode: 'classic' | GameThemeMode; isDark: boolean;
  BACKGROUND: string; PATTERN_OPACITY: number;
  SURFACE: string; BORDER: string; BORDER_WIDTH: number; DIVIDER: string;
  TEXT: string; TEXT_MUTED: string; LABEL: string; TEXT_SUBTLE: string; TEXT_SHADOW: string;
  SOLID: string; ON_SOLID: string; SCORE_HIGHLIGHT: string; DANGER: string; CHIP: string; OVERLAY: string;
  SWITCH_TRACK_OFF: string; SWITCH_TRACK_ON: string; SWITCH_THUMB: string;
  HEADER: { BACKGROUND: string; BORDER: string; TINT: string };
  BOARD: { SURFACE: string; BORDER: string; CELL_EMPTY: string; GRID_LINE: string;
           CELL_HIGHLIGHT: string; CELL_INVALID: string; FLASH: string };
}`;

export const soundsApiCode = `interface SoundConfig {
  sfx?: SfxName; volume?: number; pitch?: number; // volume 0..2, pitch = playback speed
  cooldown?: number; loop?: boolean;              // cooldown in ms
  text?: string; rate?: number; language?: string; // legacy, ignored
}

playSound(sound: SoundConfig, enabled: boolean): void;
playSoundVoice(sound: SoundConfig, enabled: boolean): Voice | null;   // stop it later
playBankSound(bank: SoundBank<K> | undefined, name: K, options?: AudioPlayOptions): Voice | null;
stopAllSounds(): void;
preloadSounds(sounds?: Record<string, SoundConfig> | SoundConfig[]): void;
preloadGameSounds(gameId: string): void;
warmSoundAssets(gameIds: readonly string[]): Iterable<() => Promise<unknown>>;

GAME_SOUNDS.STOP; GAME_SOUNDS.STACK_TOWER.PLACE;  // shared, and GAME_SOUNDS.<GAME>.<EVENT>`;

export const utilsApiCode = `formatTime(seconds: number): string;      // 75 -> '01:15'
getScreenDimensions(): { width: number; height: number };
getGameDimensions(): { width: number; height: number; screenWidth: number }; // width capped on tablets
isTablet: boolean;                         // width > 640 at import
gamePattern(width: number, height: number): GamePattern; // services entry
PATTERN_GRID_COLOR: string;                              // services entry`;

// ── Build your own engine game ────────────────────────────────────────

export const gameFolderCode = `src/games/stack-tower/
├── StackTower.tsx           # screen: engineGame + useEngineGame + EngineGameScreen
├── StackTowerConstants.ts   # tuning, timings, colours, layout, light
├── StackTowerGame.ts        # rules, no React: createGame / start / reset / tick / tap
└── StackTowerScene.ts       # cached meshes, spawning, animation, theme repaint
# Larger games add <Name>Rules.ts (pure, testable) and <Name>Meshes.ts (cached models)`;

export const gameModuleCode = `import { type Camera, World } from '@nayan-ui/engine';
import type { GameTheme } from '../../services/ThemeService';
import type { HudFeedback } from '../shared/EngineHud';
import type { GamePhase } from '../shared/useEngineGame';
import { POINTS, TIME_LIMIT } from './MyGameConstants';
import { buildScene, setSceneTheme, type Scene } from './MyGameScene';

export type GameEvent = 'hit' | 'miss';

export function createGame(theme: GameTheme) {
  const world = new World(400);
  const camera: Camera = { eye: [0, 0, 240], target: [0, 0, 0], fov: 1, ortho: 1 };
  const g = {
    world, camera, theme,
    scene: null as Scene | null,
    phase: 'ready' as GamePhase,
    won: false,
    get score() { return world.scoreboard.score; },
    onPhase: (_p: GamePhase) => {},   // assigned by useEngineGame
    onEvent: (_e: GameEvent) => {},   // assigned by useEngineGame
    hudFeedback: {} as HudFeedback
  };
  world.scoreboard.reset(0, TIME_LIMIT);
  world.scoreboard.handlers = { onTimeUp: () => g.phase === 'playing' && end(g, true) }; // rules only
  return g;
}
export type Game = ReturnType<typeof createGame>;

export const setLayout = (g: Game, width: number, height: number) => { g.scene = buildScene(g.world, width, height, g.theme); };

export function setTheme(g: Game, theme: GameTheme) {
  g.theme = theme;
  if (g.scene) setSceneTheme(g.world, g.scene, theme); // repaint, keep progress
}

export function start(g: Game) {
  if (g.phase !== 'ready') return;
  g.phase = 'playing';
  g.world.scoreboard.reset();
  g.world.scoreboard.startCountdown(TIME_LIMIT);
  g.onPhase('playing');
}

export function reset(g: Game) {
  g.world.cancelTimers();
  // ...despawn this run's entities
  g.world.scoreboard.reset(0, TIME_LIMIT);
  g.won = false;
  g.phase = 'ready';
  g.hudFeedback.message = undefined;
  g.onPhase('ready');
}

export function tick(g: Game, dt: number) {
  // ...this frame's movement; the world steps after
}

export function tap(g: Game, x: number, y: number) {
  if (g.phase !== 'playing') return;
  g.world.scoreboard.add(POINTS);
  g.onEvent('hit');
}

function end(g: Game, won: boolean) {
  g.world.scoreboard.stop();
  g.won = won;
  g.phase = 'over';
  g.onPhase('over'); // the hook reports win / lose once
}`;

export const gameScreenCode = `import { HapticType } from '../../services/HapticsService';
import { GAME_SOUNDS } from '../../services/SoundsService';
import { GAME_IDS } from '../../services/UtilsService';
import { engineGame, EngineGameScreen } from '../shared/EngineGameScreen';
import { scoreColumn, timerColumn } from '../shared/EngineHud';
import { useEngineGame } from '../shared/useEngineGame';
import { LIGHT } from './MyGameConstants'; // e.g. frontLight([-0.45, 0.6, 1], 0.5)
import { createGame, reset, setLayout, setTheme, start, tap, tick } from './MyGameGame';

const SOUNDS = GAME_SOUNDS.MY_GAME;

export const MyGame = engineGame(GAME_IDS.MY_GAME, (props) => {
  const { board, theme, status, screen, gameOver } = useEngineGame(props, {
    gameId: GAME_IDS.MY_GAME,
    create: createGame,
    start, reset, tick, setTheme,
    resize: (g, width, height) => setLayout(g, width, height),
    tap: (g, x, y) => tap(g, x, y),
    sounds: SOUNDS,
    events: {
      hit: { sound: SOUNDS.HIT, haptic: HapticType.LIGHT },
      miss: { sound: SOUNDS.MISS, haptic: HapticType.ERROR }
    },
    onStart: (fx) => fx(SOUNDS.START, HapticType.SUCCESS),
    onOver: (fx, s) => fx(s === 'win' ? SOUNDS.WIN : SOUNDS.GAME_OVER, s === 'win' ? HapticType.SUCCESS : HapticType.ERROR)
  });

  return (
    <EngineGameScreen
      {...screen}
      light={LIGHT}
      columns={[scoreColumn(board.score), timerColumn(board.seconds, theme)]}
      subtext="Tap to play!"
      gameOver={gameOver({
        title: status === 'win' ? 'AMAZING!' : 'GAME OVER',
        scoreLabel: 'Final Score',
        score: board.score,
        buttonText: 'Play Again!'
      })}
    />
  );
});`;

export const sceneCode = `import { effects, extrude, merge, Path, quat, type Entity, type World } from '@nayan-ui/engine';
import { createGameMesh, meshCache } from '../shared/EngineMeshes';

const cached = meshCache('my-game/MyGameScene:'); // folder-prefixed key
const block = () =>
  cached('block', () =>
    createGameMesh(merge([{ geometry: extrude(new Path().addRoundedRect(-20, -10, 40, 20, 4), { depth: 16 }) }]), { shine: 0.4 })
  );

export const spawnBlock = (world: World, x: number, y: number, color: string): Entity =>
  world.spawn({ mesh: block(), position: [x, y, 0], color }); // CSS string or 0..1 tuple

export function moveBlocks(world: World, blocks: { entity: Entity; x: number; y: number; angle: number }[]) {
  const t = world.transforms; // allocation-free, applied when the world steps
  for (const b of blocks) {
    const [qx, qy, qz, qw] = quat.z(b.angle);
    t.transform(b.entity, b.x, b.y, 0, qx, qy, qz, qw);
  }
}

export const celebrate = (world: World, x: number, y: number) =>
  effects.confetti(world, { position: [x, y, 10], colors: ['#FFD43B', '#FF6BD6'], size: 4, speed: 160, count: 40, lifetime: 1.2, gravity: -300 });

export async function clearPiece(world: World, entity: Entity, color: string) {
  await effects.pop(world, entity, { scale: 1, color });
  world.despawn(entity); // safe no-op after disposal
}`;

export const registerCode = `// services/UtilsService.ts
export enum GAME_IDS { /* ... */ MY_GAME = 'my-game' }

// services/GamesMetadata.ts
[GAME_IDS.MY_GAME]: { id: GAME_IDS.MY_GAME, title: 'My Game', description: 'One sentence.', instructions: ['Tap to drop.'], categories: ['arcade'] },

// services/GamesService.ts
[GAME_IDS.MY_GAME]: { ...GAMES_METADATA[GAME_IDS.MY_GAME], component: MyGame },

// services/GameLoaders.ts
[GAME_IDS.MY_GAME]: () => require('../games/my-game/MyGame').MyGame,

// services/SoundsService.ts
MY_GAME: { START: { sfx: '...' }, WIN: { sfx: '...' } /* ... */ },

// src/index.tsx
export * from './games/my-game/MyGame';`;

export const verifyCode = `bun run games:test
bun check -p packages/games/tsconfig.build.json
bun run games:build`;
