"use client";

import { NLink } from "@nayan-ui/react";
import { usePathname } from "next/navigation";
import { CheckList } from "@/design/Primitives";
import { CARD, H2_DOC, H3_DOC } from "@/design/system";
import Code from "@/components/helpers/Code";
import Sidebar from "@/components/helpers/Sidebar";
import {
  gameFolderCode,
  gameModuleCode,
  gameScreenCode,
  registerCode,
  sceneCode,
} from "@/services/GamesCodeBlocks";
import { getMenuItem } from "@/services/Utils";

const P = "text-muted text-sm mb-3";

type Row = { name: string; detail: string };

const Table = ({ head, rows }: { head: [string, string]; rows: Row[] }) => (
  <div className="overflow-x-auto mb-4">
    <table className="w-full text-sm text-left">
      <thead>
        <tr className="border-b border-default text-foreground">
          <th className="py-2 pr-4">{head[0]}</th>
          <th className="py-2">{head[1]}</th>
        </tr>
      </thead>
      <tbody className="text-muted">
        {rows.map((row) => (
          <tr key={row.name} className="border-b border-default align-top">
            <td className="py-2 pr-4 font-mono text-xs text-foreground whitespace-nowrap">
              {row.name}
            </td>
            <td className="py-2">{row.detail}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const MODEL_ROWS: Row[] = [
  { name: "world: World | null", detail: "The engine world the screen draws." },
  { name: "camera: Camera", detail: "The camera passed to GameView." },
  {
    name: "phase",
    detail: "'ready' | 'playing' | 'over'. Change it only through onPhase(next).",
  },
  {
    name: "onPhase(phase)",
    detail:
      "Assigned by useEngineGame. Call it on every phase change. 'over' reads won (or spec.outcome) and reports the result.",
  },
  { name: "score?: number", detail: "Reported with the result unless spec.reportScore is given." },
  { name: "won?: boolean", detail: "The default outcome when the phase becomes 'over'." },
  {
    name: "hudFeedback?",
    detail:
      "{ message?, flash? }. The HUD reads it on each frame, so set message: 'PERFECT!' without a React render.",
  },
];

const SPEC_ROWS: Row[] = [
  {
    name: "gameId",
    detail: "The GAME_IDS value; also preloads GAME_SOUNDS for that game.",
  },
  {
    name: "create(theme)",
    detail: "Builds the game once per mount: world, camera, state. Do not start it here.",
  },
  {
    name: "start(g)",
    detail: "Start pressed: 'ready' to 'playing'. Start the scoreboard clock here.",
  },
  {
    name: "reset(g)",
    detail:
      "Stop (after cancel is reported) and, by default, Play Again. Return to 'ready' in the same world.",
  },
  { name: "replay?(g)", detail: "Play Again, if it should differ from reset." },
  { name: "dispose(g)", detail: "Unmount: world.dispose() and release anything else." },
  {
    name: "tick?(g, dt)",
    detail: "Every frame, unless settings are open. Ends with world.update(dt).",
  },
  { name: "setTheme?(g, theme)", detail: "Theme changed: repaint in place and keep progress." },
  {
    name: "setActive?(g, active)",
    detail:
      "false while the app is in the background, settings are open or the game is paused; true when it resumes. Clear held input here.",
  },
  {
    name: "resize?(g, w, h, offset)",
    detail: "View size or header offset changed: lay the scene out. It may return the game width.",
  },
  {
    name: "tap?(g, x, y) / drag?(g, e)",
    detail:
      "Touch in view points. A DragEvent has a phase ('start' | 'move' | 'end') and x, y, dx, dy. Pass only the handler the game uses.",
  },
  {
    name: "hud?(g, hud)",
    detail: "Every frame, with the EngineHud, for games that drive it directly.",
  },
  {
    name: "outcome?(g)",
    detail:
      "'win' | 'lose' | 'draw' when the run ends (default: g.won). A draw is reported as cancel.",
  },
  {
    name: "reportScore? / reportData?",
    detail: "The score and additionalData sent with the result.",
  },
  {
    name: "wire?(g, fx)",
    detail:
      "Called once. Connect the game's callbacks to useLiveState setters and fx(sound, haptic). It may return a cleanup function.",
  },
  {
    name: "sounds",
    detail: "A SoundConfig map, preloaded so the first sound is not skipped.",
  },
  {
    name: "onStart / onStop / onPlayAgain / onOver",
    detail: "Feedback hooks for those moments, for example fx(SOUNDS.WIN, HapticType.SUCCESS).",
  },
  {
    name: "resultsDelay?(status)",
    detail: "Milliseconds to let an ending play out before the results card appears.",
  },
];

const SCREEN_ROWS: Row[] = [
  {
    name: "{...screen}",
    detail:
      "From useEngineGame: gameId, settings, source, camera, playing, onStart / onStop, onUpdate, onResize, onTap / onDrag, onActiveChange, feedback, share / leaderboard / banner props.",
  },
  {
    name: "columns: HudColumn[]",
    detail:
      "Scoreboard columns. Use scoreColumn(score), timerColumn(seconds, theme), livesColumn(count, max) or textColumn(label, value).",
  },
  { name: "subtext?", detail: "The line under the Start/Stop button while playing." },
  {
    name: "gameOver",
    detail:
      "gameOver({ title, message?, scoreLabel, score, formatter?, buttonText }) from the hook. It is null until the card is due. Play Again and Share are filled in for you.",
  },
  {
    name: "choices?",
    detail: "HudChoice buttons drawn by the HUD (id, label, selected?, onPress).",
  },
  { name: "hudCapacity?", detail: "Extra overlay entities for HUD-heavy games." },
  { name: "onAudioChange?", detail: "Suspend or resume a game-owned audio loop." },
  {
    name: "children",
    detail: "React views over the scene. Hidden while the results card shows.",
  },
  {
    name: "GameView props",
    detail:
      "Any other GameView prop: light, background, paused and so on. The background defaults to the theme background.",
  },
];

const HELPER_ROWS: Row[] = [
  {
    name: "effects (engine)",
    detail:
      "confetti, sparkle, shatter, splash, sparks, explosion, dust, flash and pop. One call each, simulated in Rust. Use confetti for celebrations and the matching physical effect for crashes, splashes and explosions.",
  },
  {
    name: "shared/EngineBlasts",
    detail:
      "popAndBurst(world, entity, pop, burst) for cleared, matched or broken pieces (despawn when its promise resolves). popBurst for pieces that stay.",
  },
  {
    name: "shared/EngineBlocks",
    detail:
      "spawnRaisedBlock(world, { position, size, color, ... }) for glossy board pieces with a shadow. Animate them back with raisedBlockScale(size), and light the board with frontLight.",
  },
  {
    name: "shared/EngineMeshes",
    detail:
      "createGameMesh(geometry, options) and cacheGameAsset(key, build). Build each mesh once per app and keep it at module scope.",
  },
  {
    name: "shared/EngineBackdrop, EngineTilt",
    detail:
      "The themed backdrop (spawnBackdrop, setBackdropTheme) and a tilted orthographic view for 2.5D boards (aimTilted, project, unproject).",
  },
  {
    name: "shared/EngineUtils",
    detail: "toColor(css, alpha), frontLight(direction, ambient), gameWidthFor(width).",
  },
  {
    name: "shared/useLiveState",
    detail: "useState whose updates show at once while the frame loop keeps JS busy.",
  },
  {
    name: "shared/EngineTouchSurface",
    detail:
      "Raw multi-touch for games that need it (Treasure Hunt). Keep it inside getSceneInputInsets(offset) so the HUD buttons stay reachable.",
  },
  {
    name: "world.transforms",
    detail:
      "An allocation-free batch for per-frame moves: position, rotation, scale, color or transform. Call flush() once after queuing.",
  },
  {
    name: "quat",
    detail: "x, y, z, axisAngle, fromEuler and multiply, with an optional out array to reuse.",
  },
  {
    name: "world.scoreboard",
    detail:
      "Score, lives and clock in Rust: reset(lives, countdownSeconds), startCountdown, startClock, add, addLives, stop, resume, and handlers { onScore, onSecond, onTimeUp }.",
  },
  {
    name: "world.after / cancelTimers",
    detail: "Delays on the game clock. They pause with the view, and reset should cancel them.",
  },
  {
    name: "world.isDisposed",
    detail: "Check it at the top of tick and in late callbacks; a frame can arrive after unmount.",
  },
];

const BuildAGame = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Build an engine game"}>
      <p className={P}>
        Every game in @nayan-ui/games follows the same pattern. Plain TypeScript rules drive a{" "}
        <NLink href="/engine" className="text-accent hover:underline">
          @nayan-ui/engine
        </NLink>{" "}
        world. A small React screen connects those rules to the shared engine HUD (scoreboard,
        Start/Stop, results card), the settings modal and the GameProps callbacks. This page
        explains how to add a game in that style.
      </p>
      <div className={`${CARD} p-5 mb-8`}>
        <p className="text-sm text-foreground font-semibold mb-2">Where this code lives</p>
        <p className="text-muted text-sm">
          engineGame, useEngineGame, EngineGameScreen, EngineHud and the src/games/shared helpers
          are internal modules. The package does not export them. Use this pattern when you
          contribute a game to the library or work in a fork of it. For a standalone game in your
          own app, use @nayan-ui/engine directly with the{" "}
          <NLink href="/engine/first-game" className="text-accent hover:underline">
            engine&apos;s complete game guide
          </NLink>
          , and follow the lifecycle rules below so that it fits the same GameProps contract.
        </p>
      </div>

      <div className="mb-8">
        <h2 className={H2_DOC}>1. Files</h2>
        <p className={P}>
          A game is one folder under <code>src/games/&lt;game-id&gt;/</code>. Stack Tower is the
          smallest complete example.
        </p>
        <Code language="bash" code={gameFolderCode} />
        <CheckList
          items={[
            "<Name>.tsx: the screen. It calls engineGame, useEngineGame and EngineGameScreen, and declares the HUD columns and results card. No rules.",
            "<Name>Constants.ts: tuning numbers, timings, colours, the layout for a view size, and the light.",
            "<Name>Game.ts: the rules and lifecycle as plain functions over a game object. No React. It owns world.update(dt).",
            "<Name>Scene.ts: what it draws. Cached meshes, spawning and animating entities, and repainting for the theme.",
          ]}
        />
      </div>

      <div className="mb-8">
        <h2 className={H2_DOC}>2. The game module</h2>
        <p className={P}>
          createGame returns an object that satisfies EngineGameModel. The other functions take that
          object. One world serves the whole visit: Start, Stop and Play Again reset it in place, so
          the GPU view is never rebuilt.
        </p>
        <Table head={["Field", "Meaning"]} rows={MODEL_ROWS} />
        <Code code={gameModuleCode} filename="MyGameGame.ts" />
      </div>

      <div className="mb-8">
        <h2 className={H2_DOC}>3. The screen: engineGame + useEngineGame + EngineGameScreen</h2>
        <p className={P}>
          <strong>engineGame(id, Component)</strong> returns the exported React.FC&lt;GameProps&gt;.
          It memoises the component, fills in DEFAULT_GAME_SETTINGS, applies the game theme, shows
          the loading screen until warmUpEngine() resolves (or an error if the engine is missing),
          and passes onPlayingChange down.
        </p>
        <p className={P}>
          <strong>useEngineGame(props, spec)</strong> creates the game once and disposes it on
          unmount. It applies theme changes, tracks phase and result, and plays sounds and haptics
          only when the player has them switched on (never while settings are open). It reports each
          run exactly once: win or lose at the end, cancel on Stop or on unmount mid-run. It returns{" "}
          <code>{"{ game, theme, phase, status, fx, screen, gameOver }"}</code>.
        </p>
        <Table head={["Spec field", "When it runs"]} rows={SPEC_ROWS} />
        <p className={P}>
          <strong>EngineGameScreen</strong> renders the GameView with the EngineHud as its overlay,
          the results card and banner ad, and the settings modal. It pauses rendering in the
          background, freezes gameplay while settings are open, pauses for settings.paused, mutes
          audio when sounds are off, and blocks host back gestures through onPlayingChange while
          playing. On Android, the back button presses Play Again on the results card.
        </p>
        <Table head={["Prop", "Purpose"]} rows={SCREEN_ROWS} />
        <Code code={gameScreenCode} filename="MyGame.tsx" />
      </div>

      <div className="mb-8">
        <h2 className={H2_DOC}>4. The scene and shared helpers</h2>
        <p className={P}>
          Most models are built in code with lathe, tube, extrude, merge, loft, block and ellipsoid
          from the engine, then registered once with createGameMesh. Mesh ids are app-wide and never
          freed, so never build a mesh per spawn, per frame or per size that changes. Split a model
          into a white body that each entity tints and parts that keep their own colours.
        </p>
        <Table head={["Helper", "Use"]} rows={HELPER_ROWS} />
        <Code code={sceneCode} filename="MyGameScene.ts" />
      </div>

      <div className="mb-8">
        <h2 className={H2_DOC}>5. Lifecycle rules</h2>
        <CheckList
          items={[
            "Phases go ready → playing → over. start runs only from 'ready'. Every change goes through g.onPhase so the screen, HUD and result stay in step.",
            "End a run by stopping the scoreboard, setting won and calling onPhase('over'). The hook reports win or lose once. Do not call onEndGame yourself.",
            "Stop reports cancel before reset runs, so reset can clear everything: cancel timers, despawn the run's entities, reset the scoreboard, clear hudFeedback and input, then onPhase('ready').",
            "Play Again calls replay, or reset by default, and then onReplayGame. The next run reports again.",
            "tick returns early when world.isDisposed and ends with world.update(dt). Drive everything from tick, world.after and engine animations, never from setInterval or requestAnimationFrame loops.",
            "Keep score, lives and countdowns in world.scoreboard. Push changes to React through its handlers and useLiveState, not by polling.",
            "setTheme repaints the existing scene. Theme changes never reset progress. Use settings.theme === 'dark' for night scenes.",
            "Clear held touches and buffered input in setActive(false), so a pause, the settings modal or backgrounding never leaves a finger 'down'.",
            "Play sounds and haptics through fx(sound, haptic). It checks enableSounds and enableHaptics and stays silent while settings are open.",
            "Build meshes, textures and fonts once at module scope (cacheGameAsset), and spawn new entities for each run.",
          ]}
        />
      </div>

      <div className="mb-8">
        <h2 className={H2_DOC}>6. Register the game</h2>
        <Code code={registerCode} />
        <p className={P}>
          Games with expensive models can also add a stage in services/GameAssets.ts so that their
          loading screen prepares them before the module runs. tests/lifecycle.test.ts checks that
          every GAME_IDS value has a lifecycle adapter. It exercises start, stop, replay, theme,
          resize and dispose, so add the new game there.
        </p>
        <h3 className={H3_DOC}>Verify</h3>
        <Code
          language="bash"
          code={`bun run games:test        # from the monorepo root
bun check -p packages/games/tsconfig.build.json
bun run games:build       # native module build and browser build (lib/web)`}
        />
      </div>
    </Sidebar>
  );
};

export default BuildAGame;
