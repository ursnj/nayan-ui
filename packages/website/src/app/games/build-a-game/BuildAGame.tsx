"use client";

import { NLink } from "@nayan-ui/react";
import { usePathname } from "next/navigation";
import { CheckList } from "@/design/Primitives";
import { H2_DOC, H3_DOC } from "@/design/system";
import Code from "@/components/helpers/Code";
import Sidebar from "@/components/helpers/Sidebar";
import {
  gameFolderCode,
  gameModuleCode,
  gameScreenCode,
  registerCode,
  sceneCode,
  verifyCode,
} from "@/services/GamesCodeBlocks";
import { getMenuItem } from "@/services/Utils";

const P = "text-muted text-sm mb-3";
const LINK = "text-accent hover:underline";

type Row = [string, string];

const Table = ({ head, rows }: { head: Row; rows: Row[] }) => (
  <div className="overflow-x-auto mb-4">
    <table className="w-full text-sm text-left">
      <thead>
        <tr className="border-b border-default text-foreground">
          <th className="py-2 pr-4">{head[0]}</th>
          <th className="py-2">{head[1]}</th>
        </tr>
      </thead>
      <tbody className="text-muted">
        {rows.map(([name, detail]) => (
          <tr key={name} className="border-b border-default align-top">
            <td className="py-2 pr-4 font-mono text-xs text-foreground whitespace-nowrap">
              {name}
            </td>
            <td className="py-2">{detail}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const MODEL_ROWS: Row[] = [
  ["world: World | null", "The world the screen draws."],
  ["camera: Camera", "Passed to GameView."],
  ["phase", "'ready' | 'playing' | 'over' (GamePhase)."],
  ["onPhase(phase)", "Assigned by the hook; call on every change. 'over' reports the result."],
  ["score?", "Reported unless spec.reportScore is set."],
  ["won?", "Default outcome at 'over'."],
  ["onEvent?(event)", "Assigned when the spec has events; plays that event's sound and haptic."],
  ["hudFeedback?", "{ message?, flash? }, read by the HUD each frame without a render."],
];

const SPEC_ROWS: Row[] = [
  ["gameId", "GAME_IDS value; preloads its GAME_SOUNDS."],
  ["create(theme)", "Once per mount: world, camera, state."],
  ["start(g)", "Start pressed: 'ready' → 'playing'."],
  ["reset(g)", "Stop (after cancel is reported) and, by default, Play Again."],
  ["replay?(g)", "Play Again, when it differs from reset."],
  ["dispose?(g)", "Unmount: non-world resources only; the hook disposes the world."],
  ["tick?(g, dt)", "The game's own frame work; the world steps after. Never runs after disposal."],
  ["setTheme?(g, theme)", "Repaint in place, keep progress."],
  ["setActive?(g, active)", "false in background, settings or pause; clear held input."],
  ["resize?(g, w, h, offset)", "Lay out for the view; may return the game width."],
  ["tap?(g, x, y) / drag?(g, e)", "Touch in view points; e.phase is 'start' | 'move' | 'end'."],
  ["hud?(g, hud)", "Every frame, for games that drive EngineHud directly."],
  ["outcome?(g)", "'win' | 'lose' | 'draw' (default g.won); a draw reports cancel."],
  ["reportScore? / reportData?", "Score and additionalData for the result."],
  ["events?", "{ hit: { sound, haptic } } for each g.onEvent(event)."],
  ["wire?(g, fx)", "Once, for callbacks events and board don't cover; may return a cleanup."],
  ["sounds?", "SoundConfig map preloaded before the first sound."],
  ["onStart / onStop / onPlayAgain / onOver", "Feedback hooks: fx(sound, haptic)."],
  ["resultsDelay?(status)", "Milliseconds before the results card."],
];

const RETURN_ROWS: Row[] = [
  ["game", "The object from create."],
  ["theme / phase / status", "Current GameTheme, GamePhase and result."],
  ["board", "Live mirror of world.scoreboard: { score, seconds, lives }."],
  ["fx(sound, haptic)", "Feedback that respects settings and stays silent in the modal."],
  ["screen", "Props to spread on EngineGameScreen."],
  ["gameOver(card)", "The results card, or null until it is due."],
];

const SCREEN_ROWS: Row[] = [
  ["{...screen}", "Source, camera, playing, input, lifecycle and share/leaderboard/banner props."],
  [
    "columns",
    "HudColumn[]: scoreColumn, timerColumn(seconds, theme), livesColumn(n, max), textColumn.",
  ],
  ["subtext?", "Line under Start/Stop while playing."],
  ["gameOver", "gameOver({ title, message?, scoreLabel, score, formatter?, buttonText })."],
  ["choices?", "HudChoice buttons: id, label, selected?, onPress."],
  ["hudCapacity?", "Extra overlay entities."],
  ["onAudioChange?", "Suspend or resume a game-owned audio loop."],
  ["children", "React views over the scene, hidden under the results card."],
  ["GameView props", "light, background (theme default), paused and the rest."],
];

const HELPER_ROWS: Row[] = [
  ["effects (engine)", "confetti, sparkle, shatter, splash, sparks, explosion, dust, flash, pop."],
  ["shared/EngineBlasts", "popAndBurst for cleared pieces, popBurst for pieces that stay."],
  [
    "shared/EngineBlocks",
    "spawnRaisedBlock and raisedBlockScale(size) for glossy board pieces; light with frontLight.",
  ],
  [
    "shared/EngineMeshes",
    "createGameMesh, meshCache('<folder>/<File>:'), cacheGameAsset; keys need the folder prefix.",
  ],
  ["shared/EngineBackdrop, EngineTilt", "Themed backdrop; tilted 2.5D view (aimTilted, project)."],
  ["shared/EngineUtils", "toColor and frontLight (from the engine), gameWidthFor."],
  ["shared/useLiveState", "useState that updates while the frame loop keeps JS busy."],
  ["shared/EngineTouchSurface", "Raw multi-touch inside getSceneInputInsets(offset)."],
  ["world.transforms", "Allocation-free per-frame moves; flush() only before queries."],
  ["quat", "x, y, z, axisAngle, fromEuler, multiply, slerp (optional out)."],
  [
    "world.scoreboard",
    "reset, startCountdown, startClock, add, addLives, stop, resume; handlers for rules, listen for observers.",
  ],
  ["world.after / cancelTimers", "Game-clock delays that pause with the view."],
  ["world.isDisposed", "Guard only spawn, update, scoreboard, audio and React callbacks."],
];

const BuildAGame = () => {
  const pathname = usePathname();
  const component: any = getMenuItem(pathname);

  return (
    <Sidebar title={component?.title || "Build an engine game"}>
      <p className={P}>
        Library games pair plain TypeScript rules on a{" "}
        <NLink href="/game-engine" className={LINK}>
          @nayan-ui/engine
        </NLink>{" "}
        world with a small screen on the shared HUD. These modules are internal, so use this pattern
        in the library or a fork; for your own app, follow the{" "}
        <NLink href="/game-engine/first-game" className={LINK}>
          engine game guide
        </NLink>{" "}
        and the lifecycle rules below.
      </p>

      <div className="mb-8">
        <h2 className={H2_DOC}>1. Files</h2>
        <p className={P}>
          One folder per game under <code>src/games/&lt;game-id&gt;/</code>; Stack Tower is the
          smallest example.
        </p>
        <Code language="bash" code={gameFolderCode} />
      </div>

      <div className="mb-8">
        <h2 className={H2_DOC}>2. The game module</h2>
        <p className={P}>
          createGame returns an EngineGameModel; one world serves the whole visit and is reset in
          place.
        </p>
        <Table head={["Field", "Meaning"]} rows={MODEL_ROWS} />
        <Code code={gameModuleCode} filename="MyGameGame.ts" />
      </div>

      <div className="mb-8">
        <h2 className={H2_DOC}>3. The screen</h2>
        <p className={P}>
          <strong>engineGame(id, Component)</strong> returns the exported game: memoised, with
          default settings, theme and the engine loading screen.
        </p>
        <h3 className={H3_DOC}>useEngineGame(props, spec)</h3>
        <p className={P}>
          Creates the game, steps and disposes its world, and reports each run once. Import
          GamePhase from shared/useEngineGame rather than redeclaring it.
        </p>
        <Table head={["Spec field", "When it runs"]} rows={SPEC_ROWS} />
        <Table head={["Returns", "Value"]} rows={RETURN_ROWS} />
        <h3 className={H3_DOC}>EngineGameScreen</h3>
        <p className={P}>
          Renders GameView with the HUD, results card, banner and settings modal, and handles pause,
          mute and the back gesture while playing.
        </p>
        <Table head={["Prop", "Purpose"]} rows={SCREEN_ROWS} />
        <Code code={gameScreenCode} filename="MyGame.tsx" />
      </div>

      <div className="mb-8">
        <h2 className={H2_DOC}>4. The scene and helpers</h2>
        <p className={P}>
          Build models in code (lathe, tube, extrude, merge, loft, block, ellipsoid) once per app;
          mesh ids are never freed. Tint a white body per entity and keep coloured parts separate.
        </p>
        <Table head={["Helper", "Use"]} rows={HELPER_ROWS} />
        <Code code={sceneCode} filename="MyGameScene.ts" />
      </div>

      <div className="mb-8">
        <h2 className={H2_DOC}>5. Lifecycle rules</h2>
        <CheckList
          items={[
            "ready → playing → over, always through g.onPhase; start only from 'ready'.",
            "End a run by stopping the scoreboard, setting won and calling onPhase('over'); never call onEndGame.",
            "reset clears timers, entities, scoreboard, hudFeedback and input, then onPhase('ready').",
            "Drive frames from tick, world.after and engine animations, never setInterval or requestAnimationFrame.",
            "Show score, lives and time from board; keep only rule handlers in scoreboard.handlers.",
            "setTheme repaints without resetting; settings.theme === 'dark' picks night scenes.",
            "Clear held input in setActive(false).",
            "Use g.onEvent with spec events, or fx, for sounds and haptics.",
            "Cache meshes, textures and fonts at module scope; spawn new entities per run.",
          ]}
        />
      </div>

      <div className="mb-8">
        <h2 className={H2_DOC}>6. Register and verify</h2>
        <p className={P}>
          Add the game to each registry, and to tests/lifecycle.test.ts; expensive models can add a
          stage in services/GameAssets.ts.
        </p>
        <Code code={registerCode} />
        <Code language="bash" code={verifyCode} />
      </div>
    </Sidebar>
  );
};

export default BuildAGame;
