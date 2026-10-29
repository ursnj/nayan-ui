import type { EngineExample } from "./types";

/** Additional task examples keyed by existing guide and section IDs. */
export const sectionExamples: Record<string, Record<string, EngineExample[]>> = {
  overview: {
    "how-the-engine-fits-together": [
      {
        title: "Initialize a world and connect its frame callback",
        description:
          "Call createDemo once from your initialization hook. Give the returned world and update function to GameView; dispose the returned scene when the hook cleans up.",
        code: `import { warmUpEngine, World } from "@nayan-ui/engine";
export async function createDemo() {
  await warmUpEngine();
  const world = new World(32);
  world.spawn({ mesh: "cube", color: [0.2, 0.7, 1] });
  return { world, update: (dt: number) => world.update(dt), dispose: () => world.dispose() };
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "choose-a-starting-point": [
      {
        title: "Separate the scene from the host",
        description:
          "This component receives an already initialized world. It works inside either host’s sized container. The owning initialization hook remains responsible for disposal.",
        code: `import { GameView, type World } from "@nayan-ui/engine";
export function SharedScene({ world }: { world: World }) {
  return <GameView source={world}
    camera={{ eye: [0, 3, 8], target: [0, 0, 0], fov: 1 }}
    onUpdate={dt => world.update(dt)} />;
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "find-an-example": [
      {
        title: "Add a feature without changing the host",
        description:
          "Call addReward during scene setup. Later, invoke the returned collect function from a tap or collision handler; it removes the reward only once.",
        code: `import type { World } from "@nayan-ui/engine";
export function addReward(world: World) {
  const reward = world.spawn({ mesh: "torus", position: [2, 1, 0] });
  let collected = false;
  return () => {
    if (collected) return;
    collected = true;
    world.despawn(reward);
    world.scoreboard.add(50);
  };
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "coordinates-values-and-handles": [
      {
        title: "Rotate by 90 degrees and use an RGB color",
        description:
          "Quaternions store four values, while the angle here is in radians. Run this during setup or from a game event; the actor turns around the vertical Y axis.",
        code: `import type { World, Entity, Quat, Color } from "@nayan-ui/engine";
export function turnRight(world: World, actor: Entity) {
  const angle = Math.PI / 2;
  const rotation: Quat = [0, Math.sin(angle / 2), 0, Math.cos(angle / 2)];
  const color: Color = [0.2, 0.8, 0.4];
  world.set(actor, { rotation, color });
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "what-is-shared-and-what-changes": [
      {
        title: "Choose the host style, keep the scene API",
        description:
          "Use this wrapper in a browser flex column. The native version below supplies a native ViewStyle to the same GameView API.",
        code: `import { GameView, type World } from "@nayan-ui/engine";
export function WebSurface({ world }: { world: World }) {
  return <div style={{ height: 400, display: "flex" }}>
    <GameView source={world} style={{ flex: 1, minWidth: 0 }} onUpdate={dt => world.update(dt)} />
  </div>;
}`,
        platform: "react",
        language: "tsx",
      },
      {
        title: "Mount the same scene in a native container",
        description:
          "Use this instead of WebSurface in a React Native app containing the native engine. Its parent must have a height or flex allocation.",
        code: `import { View } from "react-native";
import { GameView, type World } from "@nayan-ui/engine";
export function NativeSurface({ world }: { world: World }) {
  return <View style={{ height: 400 }}>
    <GameView source={world} style={{ flex: 1 }} onUpdate={dt => world.update(dt)} />
  </View>;
}`,
        platform: "native",
        language: "tsx",
      },
    ],
  },
  installation: {
    "install-the-package": [
      {
        title: "Check the native link before opening a game",
        description:
          "Use this check in a native startup/preparation function. A linked core can warm up; an Expo Go binary needs to be replaced by a development build.",
        code: `import { isEngineAvailable, warmUpEngine } from "@nayan-ui/engine";
export async function prepareNativeGame() {
  if (!isEngineAvailable) throw new Error("Install a development build containing the Nayan engine");
  await warmUpEngine();
}`,
        platform: "native",
        language: "tsx",
      },
    ],
    "exports-and-typescript": [
      {
        title: "Initialize the explicit browser entry",
        description:
          "Use the /web entry when the file is specifically for a browser host. Call this function on the client after mounting, and dispose the returned world through the owning effect.",
        code: `import { warmUpEngine, World } from "@nayan-ui/engine/web";
export async function createBrowserWorld() {
  await warmUpEngine();
  return new World(64);
}`,
        platform: "react",
        language: "tsx",
      },
    ],
    "native-requirements": [
      {
        title: "Load a GLB after Metro resolves the asset",
        description:
          "Call this from native preparation after adding glb to Metro assetExts. The loader shares resources across visits automatically. Call during setup rather than onUpdate. The referenced asset must exist in your project.",
        code: `import { warmUpEngine, loadModel } from "@nayan-ui/engine";
export async function prepareAvatar() {
  await warmUpEngine();
  return loadModel(require("./assets/avatar.glb"), { center: false });
}`,
        platform: "native",
        language: "tsx",
      },
    ],
    "browser-hosting": [
      {
        title: "Show a useful WASM initialization error",
        description:
          "Use this hook in a client component. It reports loading failure without constructing a world on the server or setting state after unmount. Create the scene only once ready is true.",
        code: `import { useEffect, useState } from "react";
import { warmUpEngine } from "@nayan-ui/engine";
export function useEngineReady() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    void warmUpEngine().then(() => { if (alive) setReady(true); })
      .catch((reason: unknown) => { if (alive) setError(String(reason)); });
    return () => { alive = false; };
  }, []);
  return { ready, error };
}`,
        platform: "react",
        language: "tsx",
      },
    ],
    "build-this-monorepo-from-source": [
      {
        title: "Verify the browser package after building",
        description:
          "Run from the Playtura repository root after a source change. These are repository commands; application consumers do not need to rebuild Rust to use prebuilt packages.",
        code: `bun run engine:build:web
bun run engine:test:web
bun run engine:example web:build`,
        platform: "shell",
        language: "bash",
      },
    ],
  },
  react: {
    "create-the-shared-scene": [
      {
        title: "Add one more object to the prepared scene",
        description:
          "Call this after createScene returns, before mounting GameView. It uses the existing world and camera instead of creating a second simulation.",
        code: `import { createScene } from "./scene";
export function addSceneDecoration(scene: ReturnType<typeof createScene>) {
  return scene.world.spawn({ mesh: "torus", position: [2, 1, 0],
    color: [1, 0.75, 0.2], spin: [0, 1, 0] });
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "initialize-and-clean-up-safely": [
      {
        title: "Guard an async continuation after scene cleanup",
        description:
          "Use this pattern when a screen loads an extra asset after its scene is created. It runs a caller-supplied preparation task and adds the mesh only while this scene is still owned.",
        code: `import type { World, Model } from "@nayan-ui/engine";
export function loadDecoration(world: World, load: () => Promise<Model>) {
  let cancelled = false;
  void load().then(model => {
    if (!cancelled) world.spawn({ mesh: model, position: [2, 0, 0] });
  }).catch(error => { if (!cancelled) console.error(error); });
  return () => { cancelled = true; }; // Call before disposing world.
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "mount-the-game": [
      {
        title: "Pause for settings without replacing the world",
        description:
          "Use this GameView in place of the quickstart’s GameView when a host settings panel is open. The existing scene stays mounted, and tap input is disabled with updates.",
        code: `import { GameView } from "@nayan-ui/engine";
import { createScene } from "./scene";
export function SettingsAwareScene({ scene, settingsOpen }: {
  scene: ReturnType<typeof createScene>; settingsOpen: boolean;
}) {
  return <GameView source={scene.world} camera={scene.camera} paused={settingsOpen}
    onUpdate={scene.update} onTap={settingsOpen ? undefined : scene.tap} />;
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "platform-details": [
      {
        title: "Load the game only on the client in Next.js",
        description:
          "In a Next.js App Router application, place this in a client entry and adjust ./Game to your game component. The optional dynamic wrapper also avoids rendering the game subtree on the server.",
        code: `"use client";
import dynamic from "next/dynamic";
const Game = dynamic(() => import("./Game"), { ssr: false });
export default function ClientGamePage() { return <Game />; }`,
        platform: "react",
        language: "tsx",
      },
    ],
  },
  "react-native": {
    "create-the-shared-scene": [
      {
        title: "Add one more object to the prepared scene",
        description:
          "Call this after createScene returns, before mounting GameView. It uses the existing world and camera instead of creating a second simulation.",
        code: `import { createScene } from "./scene";
export function addSceneDecoration(scene: ReturnType<typeof createScene>) {
  return scene.world.spawn({ mesh: "torus", position: [2, 1, 0],
    color: [1, 0.75, 0.2], spin: [0, 1, 0] });
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "initialize-and-clean-up-safely": [
      {
        title: "Guard an async continuation after scene cleanup",
        description:
          "Use this pattern when a screen loads an extra asset after its scene is created. It runs a caller-supplied preparation task and adds the mesh only while this scene is still owned.",
        code: `import type { World, Model } from "@nayan-ui/engine";
export function loadDecoration(world: World, load: () => Promise<Model>) {
  let cancelled = false;
  void load().then(model => {
    if (!cancelled) world.spawn({ mesh: model, position: [2, 0, 0] });
  }).catch(error => { if (!cancelled) console.error(error); });
  return () => { cancelled = true; }; // Call before disposing world.
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "mount-the-game": [
      {
        title: "Pause for settings without replacing the world",
        description:
          "Use this GameView in place of the quickstart’s GameView when a host settings panel is open. The existing scene stays mounted, and tap input is disabled with updates.",
        code: `import { GameView } from "@nayan-ui/engine";
import { createScene } from "./scene";
export function SettingsAwareScene({ scene, settingsOpen }: {
  scene: ReturnType<typeof createScene>; settingsOpen: boolean;
}) {
  return <GameView source={scene.world} camera={scene.camera} paused={settingsOpen}
    onUpdate={scene.update} onTap={settingsOpen ? undefined : scene.tap} />;
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "platform-details": [
      {
        title: "Pause while a mounted native screen loses focus",
        description:
          "Pass your router’s focus value into this component. Navigation focus is supplied by the host; the shared scene does not depend on Expo Router or another navigation package.",
        code: `import { GameView } from "@nayan-ui/engine";
import { createScene } from "./scene";
export function FocusAwareScene({ scene, focused }: { scene: ReturnType<typeof createScene>; focused: boolean }) {
  return <GameView source={scene.world} camera={scene.camera} paused={!focused}
    onUpdate={scene.update} onTap={focused ? scene.tap : undefined} />;
}`,
        platform: "native",
        language: "tsx",
      },
    ],
  },
  "first-game": {
    "what-you-will-build": [
      {
        title: "Keep the three example files together",
        description:
          "Choose one screen for your host. In Expo Router, put the helpers in src/game and import the screen from a route instead of making the helpers routes themselves.",
        code: `src/game/
  tapGame.ts           # shared game rules
  useTapGame.ts        # shared initialization and cleanup
  TapGamePage.tsx      # React browser screen
  # OR TapGameScreen.tsx for React Native`,
        platform: "shared",
        language: "text",
      },
    ],
    "1-create-the-game-rules-and-scene": [
      {
        title: "Use the scene without rebuilding its objects on pause",
        description:
          "Call these methods from host controls. The update function is the only simulation driver; a paused host simply stops calling it. reset prepares a new round in the same World.",
        code: `import type { TapGame } from "./tapGame";
export function roundControls(game: TapGame) {
  return {
    start: () => game.start(),
    cancel: () => game.stop(),
    newBoard: () => game.reset(),
    frame: (dt: number) => game.update(dt),
  };
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "2-initialize-once-and-clean-up": [
      {
        title: "Format UI state instead of reading engine buffers in React",
        description:
          "Call this with the view returned by useTapGame. The hook supplies small state changes; React does not have to inspect every entity each frame.",
        code: `import type { GameViewState } from "./tapGame";
export function roundMessage(view: GameViewState) {
  if (view.status === "ready") return "Press Start, then tap the green cubes";
  if (view.status === "win") return \`You won with \${view.score} points\`;
  if (view.status === "lose") return "Time is up. Try again";
  if (view.status === "cancel") return "Round stopped";
  return \`\${view.remaining} cubes left · \${view.seconds} seconds\`;
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "3-run-it-in-react": [
      {
        title: "Add a browser result message",
        description:
          "Render this beside the controls using the hook’s existing view value. It does not create another game or start another update loop.",
        code: `import type { GameViewState } from "./tapGame";
export function BrowserResult({ view }: { view: GameViewState }) {
  if (view.status === "win") return <p role="status">Won: {view.score} points!</p>;
  if (view.status === "lose") return <p role="status">Time is up.</p>;
  return null;
}`,
        platform: "react",
        language: "tsx",
      },
    ],
    "3-run-it-in-react-native": [
      {
        title: "Add the same result in native UI",
        description:
          "Use the same hook state and engine rules. Only the UI element changes from a browser paragraph to native Text.",
        code: `import { Text } from "react-native";
import type { GameViewState } from "./tapGame";
export function NativeResult({ view }: { view: GameViewState }) {
  if (view.status === "win") return <Text>Won: {view.score} points!</Text>;
  if (view.status === "lose") return <Text>Time is up.</Text>;
  return null;
}`,
        platform: "native",
        language: "tsx",
      },
    ],
    "try-it-and-change-one-thing": [
      {
        title: "Check the reset state from a game test",
        description:
          "Use this with an initialized tutorial game in a test harness. reset must restore all five targets without allocating a new World. This assertion checks reset, not browser picking or native rendering.",
        code: `import type { TapGame } from "./tapGame";
export function assertFreshBoard(game: TapGame) {
  game.reset();
  if (game.world.count !== 5) throw new Error("Expected five targets after reset");
  if (game.world.scoreboard.score !== 0) throw new Error("Score must reset to zero");
  if (game.world.timerCount !== 0) throw new Error("Old timers must be cleared");
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
  },
  recipes: {
    "how-to-use-these-examples": [
      {
        title: "Connect an update helper exactly once",
        description:
          "Pass a returned update helper as step. If that helper already calls world.update, this wrapper must not call it again.",
        code: `import { GameView, type World } from "@nayan-ui/engine";
export function RecipeView({ world, step }: { world: World; step: (dt: number) => void }) {
  return <GameView source={world} onUpdate={step} />;
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "move-a-box-without-react-state": [
      {
        title: "Move toward a destination and stop there",
        description:
          "Create this helper for an independent non-physics actor. Call it before the one world.update(dt) in your game loop. It clamps the step so a long frame cannot overshoot the target.",
        code: `import type { World, Entity } from "@nayan-ui/engine";
export function moveToX(world: World, actor: Entity, targetX: number, dt: number) {
  const p = world.position(actor);
  if (!p) return;
  const distance = targetX - p[0];
  const step = Math.sign(distance) * Math.min(Math.abs(distance), 3 * dt);
  world.set(actor, { position: [p[0] + step, p[1], p[2]] });
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "let-a-ball-fall-and-bounce": [
      {
        title: "Return a fallen actor to its spawn point",
        description:
          "Call this after world.update. Reset position and velocity together so the actor does not keep its previous downward momentum.",
        code: `import type { World, Entity } from "@nayan-ui/engine";
export function respawnBelowFloor(world: World, actor: Entity) {
  const p = world.position(actor);
  if (p && p[1] < -10) world.set(actor, { position: [0, 4, 0], velocity: [0, 0, 0] });
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "steer-a-player-with-a-joystick": [
      {
        title: "Clear a held stick when gameplay pauses",
        description:
          "Call this when your own scene enters a paused state. Zeroing the input stops the next update from reusing an old direction; the host should also pause GameView.",
        code: `import type { World, Entity, JoystickState } from "@nayan-ui/engine";
export function clearMovement(world: World, player: Entity, stick: JoystickState) {
  stick.x = 0; stick.y = 0;
  world.set(player, { groundVelocity: [0, 0] });
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "jump-only-when-standing-on-the-floor": [
      {
        title: "Use a floor sensor to track grounded contact",
        description:
          "Use layer 1 for the floor and this independent sensor as a probe. Move it to the player’s feet before update, then call readContacts after update. Multi-contact tracking prevents one ending contact from clearing another active floor contact.",
        code: `import type { World, Entity } from "@nayan-ui/engine";
export function makeGroundProbe(world: World) {
  const probe = world.spawn({ mesh: "none", physics: { type: "kinematic", shape: "ball", radius: 0.1, sensor: true, layer: 8, mask: 1 } });
  const contacts = new Set<Entity>();
  return { probe, readContacts() {
    world.forEachCollision((a, b, info) => {
      if (a !== probe && b !== probe) return;
      const other = a === probe ? b : a;
      if (info.started) contacts.add(other); else contacts.delete(other);
    });
    return contacts.size > 0;
  } };
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "collect-a-coin-on-contact": [
      {
        title: "Collect any number of tracked pickups",
        description:
          "Call the returned readContacts after the world update. The set is the authority for uncollected pickups, so repeated contacts cannot award points twice.",
        code: `import type { World, Entity } from "@nayan-ui/engine";
export function trackPickups(world: World, player: Entity, coins: Set<Entity>) {
  return () => world.forEachCollision((a, b, info) => {
    if (!info.started || (a !== player && b !== player)) return;
    const coin = a === player ? b : a;
    if (!coins.delete(coin)) return;
    world.despawn(coin);
    world.scoreboard.add(100);
  });
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "tap-an-object-and-change-its-color": [
      {
        title: "Restore the old selection when another object is tapped",
        description:
          "Create this handler once per scene. Give it to GameView.onTap. It keeps one selected handle instead of recoloring every object in a loop.",
        code: `import type { World, Entity } from "@nayan-ui/engine";
export function makeSelection(world: World) {
  let selected: Entity | null = null;
  return (x: number, y: number) => {
    if (selected !== null) world.set(selected, { color: [1, 1, 1] });
    selected = world.pick(x, y)?.entity ?? null;
    if (selected !== null) world.set(selected, { color: [1, 0.8, 0.1] });
  };
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "make-an-enemy-chase-the-player": [
      {
        title: "Stop chasing inside an attack range",
        description:
          "Call this before update for non-physics enemies. This is a simple distance rule, not pathfinding; your level still needs collision/navigation rules for walls.",
        code: `import type { World, Entity } from "@nayan-ui/engine";
export function chaseUntilClose(world: World, enemy: Entity, player: Entity) {
  const a = world.position(enemy), b = world.position(player);
  if (!a || !b) return;
  const close = Math.hypot(a[0] - b[0], a[2] - b[2]) < 1.5;
  world.set(enemy, close ? { follow: null, velocity: [0, 0, 0] } : { follow: { target: player, speed: 2 } });
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "animate-a-hit-and-remove-an-object": [
      {
        title: "Play a hit flash without despawning the actor",
        description:
          "Create the handler once per actor. Rapid hits are ignored until this short animation finishes. Keep the normal frame loop running while the animation promise is pending.",
        code: `import type { World, Entity } from "@nayan-ui/engine";
export function makeHitFlash(world: World, actor: Entity) {
  let flashing = false;
  return () => {
    if (flashing) return;
    flashing = true;
    void world.animate(actor, [{ color: [1, 0.2, 0.2] }, { color: [1, 1, 1] }], { duration: 0.25 })
      .finally(() => { flashing = false; });
  };
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "show-the-score-in-react-ui": [
      {
        title: "Subscribe to a countdown for UI text",
        description:
          "Use this hook inside the existing host. It chains the scene’s current handler and restores it on cleanup, so clock updates do not replace the game’s other scoreboard events.",
        code: `import { useEffect, useState } from "react";
import type { World } from "@nayan-ui/engine";
export function useSeconds(world: World) {
  const [seconds, setSeconds] = useState(world.scoreboard.shownSeconds);
  useEffect(() => {
    setSeconds(world.scoreboard.shownSeconds);
    const previous = world.scoreboard.handlers;
    const handlers = { ...previous, onSecond(n: number) { previous.onSecond?.(n); setSeconds(n); } };
    world.scoreboard.handlers = handlers;
    return () => { if (world.scoreboard.handlers === handlers) world.scoreboard.handlers = previous; };
  }, [world]);
  return seconds;
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "spawn-something-after-a-game-time-delay": [
      {
        title: "Repeat a spawn until a wave ends",
        description:
          "Create this during a round, and call stop before resetting/disposal. Each timer schedules the next only after it fires. The count guard avoids throwing when this world has no free entity slots.",
        code: `import type { World } from "@nayan-ui/engine";
export function spawnWave(world: World) {
  let stopped = false;
  const next = () => {
    if (stopped) return;
    if (world.count < world.capacity) world.spawn({ mesh: "sphere", position: [0, 3, 0] });
    world.after(1, next);
  };
  world.after(1, next);
  return () => { stopped = true; }; // Pending callback becomes a no-op.
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "build-one-model-and-reuse-it-for-many-objects": [
      {
        title: "Reuse a mesh when restarting a row of actors",
        description:
          "Pass a model you prepared once. Keep only entity handles in the round’s mutable set; resetting replaces those actors without allocating another mesh.",
        code: `import type { World, Entity, Model } from "@nayan-ui/engine";
export function makeRow(world: World, mesh: Model) {
  const actors = new Set<Entity>();
  return () => {
    for (const actor of actors) world.despawn(actor);
    actors.clear();
    for (let i = 0; i < 4; i++) actors.add(world.spawn({ mesh, position: [i * 2, 0, 0] }));
  };
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "play-a-sound-only-when-the-player-acts": [
      {
        title: "Replace an ambience voice instead of layering loops",
        description:
          "Create one controller for the scene after the bank is ready. Call setEnabled when preferences/focus change, and stop it on unmount. Each change stops the previous voice first.",
        code: `import { audio, type SoundBank, type Voice } from "@nayan-ui/engine";
export function ambience(bank: SoundBank<"wind">) {
  let voice: Voice | null = null;
  return { setEnabled(enabled: boolean) {
    audio.stop(voice);
    voice = enabled ? bank.play("wind", { loop: true, volume: 0.2 }) : null;
  }, stop() { audio.stop(voice); voice = null; } };
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
  },
  "agent-guide": {
    "read-these-pages-first": [
      {
        title: "Read the structured guide before selecting a recipe",
        description:
          "Agents can fetch this from a running documentation host. Replace the origin for a local preview; use the returned reference URL to check unfamiliar signatures.",
        code: `const response = await fetch("https://www.nayanui.com/engine.json");
if (!response.ok) throw new Error(\`Documentation request failed: \${response.status}\`);
const guide = await response.json();
console.log(guide.startHere, guide.recipes, guide.reference);
export {};`,
        platform: "react",
        language: "tsx",
      },
    ],
    "use-a-small-file-structure": [
      {
        title: "Describe the scene contract with a TypeScript interface",
        description:
          "Keep application round controls in the scene implementation. A host can use this contract without depending on browser DOM or React Native UI types.",
        code: `import type { World, Camera } from "@nayan-ui/engine";
export interface GameScene {
  world: World;
  camera: Camera;
  start(): void;
  reset(): void;
  update(dt: number): void;
  tap(x: number, y: number): void;
  dispose(): void;
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "copy-this-contract-into-an-agent-task": [
      {
        title: "Ask for one feature with concrete acceptance checks",
        description:
          'Use a focused prompt after the baseline game already runs. The checks tell the agent what successful behavior means instead of asking for an unspecified "working" feature.',
        code: `Add a coin pickup to the existing shared scene.
Use a sensor collider and the real Entity returned by world.spawn.
Process started collision events after the existing world.update(dt).
Award 100 points once, remove the coin, and preserve the existing player controller.
On reset, recreate the coin and clear the collected flag.
Verify one pickup, repeated contact, reset, pause and screen cleanup.
Keep the React and React Native host APIs unchanged.`,
        platform: "shared",
        language: "text",
      },
    ],
    "state-what-each-example-assumes": [
      {
        title: "Put collision assumptions in the setup code",
        description:
          "State collider sizes and layer bits where the actor is created. This makes later grounding and pickup examples easier to adapt correctly.",
        code: `import type { World } from "@nayan-ui/engine";
export function setupPlayer(world: World) {
  world.spawn({ mesh: "cube", position: [0, -0.5, 0], scale: [20, 1, 20],
    physics: { type: "fixed", layer: 1 } });
  return world.spawn({ mesh: "capsule", position: [0, 1, 0], scale: [0.8, 1.8, 0.8],
    physics: { type: "dynamic", shape: "capsule", radius: 0.4, height: 1.8,
      layer: 2, mask: 1 | 4, upright: true } });
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "verify-behavior-as-well-as-types": [
      {
        title: "Write expected outcomes before extending the game",
        description:
          "These checks complement compilation. Use real local coordinates from the game view when automating taps, and exercise native behavior in an installed development build.",
        code: `Start → status playing, score 0, five targets.
Tap one target twice → score 100, four targets.
Pause and tap another target → score/time/target count unchanged.
Resume and clear the board → one win result, score 500.
Reset → ready, score 0, five new targets, no old timers.
Start and wait 15 seconds → one loss result.
Stop during a round → one cancel result.
Close the screen during loading → no World created after cleanup.`,
        platform: "shared",
        language: "text",
      },
    ],
  },
  "world-entities": {
    "create-set-and-remove": [
      {
        title: "Handle a stale actor without throwing away its slot bookkeeping",
        description:
          "Use despawn’s boolean result when an action might be triggered twice. Track owned handles in your scene instead of searching render matrices for objects.",
        code: `import type { World, Entity } from "@nayan-ui/engine";
export function removeOwned(world: World, owned: Set<Entity>, actor: Entity) {
  if (!owned.delete(actor)) return false;
  return world.despawn(actor);
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "entityoptions-reference": [
      {
        title: "Combine independent motion and lifetime options",
        description:
          "Run once during scene setup or a spawn event. This non-physics object moves, spins, bobs visually and expires through the normal world updates.",
        code: `import type { World } from "@nayan-ui/engine";
export function addFloatingReward(world: World) {
  return world.spawn({ mesh: "torus", position: [0, 1, 0], color: [1, 0.8, 0.2],
    velocity: [0.5, 0, 0], spin: [0, 1, 0], lifetime: 5,
    bob: { amplitude: [0, 0.15, 0], speed: 3 }, pickable: true });
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "parenting-and-independent-actors": [
      {
        title: "Detach a visual child and keep its drawn position",
        description:
          "Call after a frame has been drawn. Save worldPosition before clearing parent; otherwise the previous local coordinates would be interpreted as world coordinates.",
        code: `import type { World, Entity } from "@nayan-ui/engine";
export function detachVisual(world: World, child: Entity) {
  const position = world.worldPosition(child);
  if (!position) return false;
  return world.set(child, { parent: null, position });
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "movement-bounds-and-queries": [
      {
        title: "Clamp non-physics movement to an arena",
        description:
          "Set bounds once when the level is created. This applies to core-driven non-physics movement; rigid-body actors still need actual walls.",
        code: `import type { World } from "@nayan-ui/engine";
export function addArenaMover(world: World) {
  world.bounds = [-5, -5, 5, 5];
  const actor = world.spawn({ position: [0, 0, 0], velocity: [2, 0, 1] });
  return { actor, clearBounds: () => { world.bounds = null; } };
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "update-pause-reset-and-dispose": [
      {
        title: "Reset round-owned actors while retaining the scene",
        description:
          "Store this controller once per scene. It owns only its actor set and clears game timers before preparing another round. Call world.dispose separately when the whole screen closes.",
        code: `import type { World, Entity } from "@nayan-ui/engine";
export function makeRound(world: World) {
  const actors = new Set<Entity>();
  return { reset() {
    world.cancelTimers();
    for (const actor of actors) world.despawn(actor);
    actors.clear();
    world.scoreboard.reset(3);
    actors.add(world.spawn({ mesh: "sphere", position: [0, 2, 0] }));
    world.update(0);
  } };
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
  },
  "game-view": {
    "gameview-props": [
      {
        title: "Build a board view with explicit camera and pause behavior",
        description:
          "Use this instead of a default GameView for an XY board. The host supplies the sized container and playing state; the same world stays mounted while paused.",
        code: `import { GameView, type World } from "@nayan-ui/engine";
export function BoardView({ world, paused }: { world: World; paused: boolean }) {
  return <GameView source={world} paused={paused} quality="high"
    camera={{ eye: [0, 0, 12], target: [0, 0, 0], fov: 1, ortho: 5 }}
    background={[0.03, 0.04, 0.07]} onUpdate={dt => world.update(dt)} />;
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "quality-levels-and-statistics": [
      {
        title: "Let the host choose an explicit quality level",
        description:
          "Use a settings control to change level. React updates the quality prop; the world and its entities are retained. Compare onStats before deciding whether a lower setting is useful on the target device.",
        code: `import { GameView, type World, type QualitySetting } from "@nayan-ui/engine";
export function QualityPreview({ world, level }: { world: World; level: QualitySetting }) {
  return <GameView source={world} quality={level} onUpdate={dt => world.update(dt)}
    onStats={stats => console.log(\`\${stats.backend}: \${Math.round(stats.fps)} FPS (\${stats.quality})\`)} />;
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "draw-engine-ui-over-a-scene": [
      {
        title: "Lay out an overlay button from the measured view size",
        description:
          "Call layout with CSS pixel dimensions on web or native onLayout dimensions. It moves one reusable HUD entity; its color is exact in the unlit overlay. Pass the returned contains function to your overlay touch handler.",
        code: `import type { World } from "@nayan-ui/engine";
export function addHudButton(hud: World) {
  const button = hud.spawn({ mesh: "roundedBox", scale: [120, 44, 8], color: [0.2, 0.6, 1] });
  let cx = 0, cy = 0;
  return { layout(width: number, height: number) {
    cx = width / 2; cy = height - 50;
    hud.set(button, { position: [cx, -cy, 0] });
  }, contains(x: number, y: number) { return Math.abs(x - cx) <= 60 && Math.abs(y - cy) <= 22; } };
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
  },
  "camera-lighting": {
    "camera-configuration": [
      {
        title: "Keep a whole board visible after resize",
        description:
          "Call this with the GameView container’s measured width/height. ortho is half the visible world height; dividing the board width by aspect protects narrow portrait screens from clipping its sides.",
        code: `import type { Camera } from "@nayan-ui/engine";
export function fitBoard(camera: Camera, width: number, height: number, boardWidth: number, boardHeight: number) {
  const aspect = Math.max(1, width) / Math.max(1, height);
  camera.ortho = Math.max(boardHeight / 2, boardWidth / (2 * aspect)) * 1.1;
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "follow-and-shake": [
      {
        title: "Switch from a chase camera to a fixed overview",
        description:
          "Call when a round ends or a replay starts. Clear follow before writing eye/target so the next frame does not replace your overview position.",
        code: `import type { Camera } from "@nayan-ui/engine";
export function showOverview(camera: Camera) {
  camera.follow = null;
  camera.eye = [12, 14, 18];
  camera.target = [0, 0, 0];
  camera.shake = 0;
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "directional-light-and-fog": [
      {
        title: "Change the environment without rebuilding the world",
        description:
          "Reuse this mutable light object across frames. Call setNight from a day/night setting; GameView reads its fields on the next draw.",
        code: `import type { Light } from "@nayan-ui/engine";
export function createDayNightLight() {
  const light: Light = { direction: [0.4, 0.8, 0.2], ambient: 0.4, shadows: true };
  return { light, setNight(night: boolean) {
    light.ambient = night ? 0.2 : 0.4;
    light.color = night ? [0.3, 0.4, 0.7] : [1, 0.95, 0.85];
  } };
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
  },
  "physics-collisions": {
    "choose-a-body-and-collider": [
      {
        title: "Add physical walls to an arena",
        description:
          "Create these fixed colliders once with the level. They confine rigid bodies; world.bounds alone only constrains non-physics motion.",
        code: `import type { World } from "@nayan-ui/engine";
export function addWalls(world: World) {
  for (const x of [-5.5, 5.5]) world.spawn({ mesh: "cube", position: [x, 1, 0], scale: [1, 3, 12], physics: "fixed" });
  for (const z of [-5.5, 5.5]) world.spawn({ mesh: "cube", position: [0, 1, z], scale: [12, 3, 1], physics: "fixed" });
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "physicsoptions-reference": [
      {
        title: "Make an XY physics game",
        description:
          "planar keeps a dynamic body in its XY plane. Combine it with a camera looking along -Z; this example uses downward Y gravity and a thin fixed floor.",
        code: `import type { World } from "@nayan-ui/engine";
export function addPlanarBall(world: World) {
  world.gravity = [0, -9.81, 0];
  world.spawn({ mesh: "cube", position: [0, -2, 0], scale: [10, 0.5, 1], physics: "fixed" });
  return world.spawn({ mesh: "sphere", position: [0, 2, 0],
    physics: { type: "dynamic", planar: true, bounce: 0.6, gravityScale: 1, ccd: true } });
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "steer-jump-and-consume-collisions": [
      {
        title: "Read impact speed once when contact begins",
        description:
          "Call after update. A reused CollisionInfo must be copied if you keep it, so this helper returns ordinary event data instead of retaining the shared info object.",
        code: `import type { World, Entity } from "@nayan-ui/engine";
export function impactsFor(world: World, actor: Entity) {
  const hits: { other: Entity; speed: number }[] = [];
  world.forEachCollision((a, b, info) => {
    if (!info.started || info.sensor || (a !== actor && b !== actor)) return;
    hits.push({ other: a === actor ? b : a, speed: info.speed });
  });
  return hits;
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "raycasts-and-contact-feedback": [
      {
        title: "Probe forward before an action",
        description:
          "Give solid walls layer 1 and the player another layer. A normalized forward ray finds the nearest blocking collider within reach; pickups behind that wall should not be collected.",
        code: `import type { World, Entity } from "@nayan-ui/engine";
export function wallAhead(world: World, player: Entity, directionX: number, directionZ: number) {
  const p = world.position(player);
  const length = Math.hypot(directionX, directionZ);
  if (!p || length < 0.001) return null;
  return world.raycast(p, [directionX / length, 0, directionZ / length], 2, 1);
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
  },
  animation: {
    "targets-and-completion": [
      {
        title: "Cancel a pulse when selection ends",
        description:
          "Create the pulse controller once for the selected actor. stopAnimation resolves the loop’s promise and holds the current values, so this helper also restores the desired neutral scale.",
        code: `import type { World, Entity } from "@nayan-ui/engine";
export function pulseSelection(world: World, actor: Entity) {
  void world.animate(actor, { scale: 1.15 }, { duration: 0.4, yoyo: true, repeat: "forever" });
  return () => { world.stopAnimation(actor); world.set(actor, { scale: 1 }); };
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "animateoptions-reference": [
      {
        title: "Delay and stagger a group reveal",
        description:
          "Set the initial small scale during setup, then run this when Start is pressed. Each actor begins slightly after the previous one, and the promise completes when the whole group finishes or is interrupted.",
        code: `import type { World, Entity } from "@nayan-ui/engine";
export function revealGroup(world: World, actors: readonly Entity[]) {
  for (const actor of actors) world.set(actor, { scale: 0.01 });
  return world.animate(actors, { scale: 1 }, { duration: 0.3, delay: 0.1, stagger: 0.04, easing: "back" });
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "paths-group-stagger-and-springs": [
      {
        title: "Retarget a spring as the pointer moves",
        description:
          "Create once for a draggable non-physics marker. Calling the returned handler replaces only the position channel; a running scale/color animation can continue independently.",
        code: `import type { World, Entity } from "@nayan-ui/engine";
export function springMarker(world: World, marker: Entity) {
  return (x: number, z: number) => {
    void world.animate(marker, { position: [x, 0.2, z] },
      { spring: { stiffness: 180, damping: 24, mass: 1 } });
  };
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
  },
  "skeletal-animation": {
    "load-a-rig-and-inspect-clips": [
      {
        title: "Choose a clip that the asset actually contains",
        description:
          "Use this after loadModel resolves. An asset can have a skeleton without a walk clip, so report a missing animation instead of silently assuming a name.",
        code: `import type { LoadedModel } from "@nayan-ui/engine";
export function findWalkClip(model: LoadedModel) {
  const clip = model.animations.find(item => /walk/i.test(item.name));
  if (!clip) throw new Error(\`No walk clip. Available: \${model.animations.map(item => item.name).join(", ")}\`);
  return clip.name;
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "playback-hold-crossfade-and-stop": [
      {
        title: "Switch clips only when movement mode changes",
        description:
          "Supply valid idle/walk names from the model metadata. Call the returned function from gameplay; repeated frames in the same mode do not request another transition.",
        code: `import type { World, Entity } from "@nayan-ui/engine";
export function clipController(world: World, actor: Entity, idle: string, walk: string) {
  let previous: string | undefined;
  return (moving: boolean) => {
    const name = moving ? walk : idle;
    if (name === previous) return;
    if (world.playClip(actor, name, { loop: true, fade: 0.15, speed: 1 })) previous = name;
  };
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "sample-selected-surface-points": [
      {
        title: "Transform a sampled foot point for an upright actor",
        description:
          "This helper assumes no parent, uniform positive scale and rotation only around Y. Use asset-specific boot indices and pass the upcoming frame dt; compare the returned world Y with your terrain height.",
        code: `import type { World, Entity } from "@nayan-ui/engine";
export function footSampler(world: World, actor: Entity, vertex: number) {
  const indices = new Uint32Array([vertex]), point = new Float32Array(3);
  return (dt: number, position: readonly [number, number, number], yaw: number, scale: number) => {
    if (!world.skinPoints(actor, indices, point, dt)) return null;
    const x = point[0]! * scale, y = point[1]! * scale, z = point[2]! * scale;
    return [position[0] + Math.cos(yaw) * x + Math.sin(yaw) * z,
      position[1] + y, position[2] - Math.sin(yaw) * x + Math.cos(yaw) * z];
  };
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
  },
  "input-picking": {
    "gesture-callbacks": [
      {
        title: "Zoom an orthographic board with a pinch",
        description:
          "Use this callback in the existing GameView. Capture the initial size on pinch start, rather than multiplying by the cumulative scale every frame.",
        code: `import type { Camera, PinchEvent } from "@nayan-ui/engine";
export function pinchZoom(camera: Camera) {
  let start = camera.ortho ?? 5;
  return (event: PinchEvent) => {
    if (event.phase === "start") start = camera.ortho ?? 5;
    if (event.phase !== "end") camera.ortho = Math.max(2, Math.min(12, start / Math.max(0.1, event.scale)));
  };
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "joystick-state-without-frame-by-frame-react-renders": [
      {
        title: "Add a dead zone before steering",
        description:
          "Call this with the stable stick object from your frame callback. Small displacements return zero; the rest is normalized so diagonal input does not exceed the intended speed.",
        code: `import type { JoystickState } from "@nayan-ui/engine";
export function stickDirection(stick: JoystickState): [number, number] {
  const length = Math.hypot(stick.x, stick.y);
  if (length < 0.15) return [0, 0];
  const strength = Math.min(1, (length - 0.15) / 0.85);
  return [stick.x / length * strength, -stick.y / length * strength];
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "pick-project-and-intersect": [
      {
        title: "Project a native or DOM marker after a frame",
        description:
          "Call this from a host’s own measurement/update logic after a successful draw. The result is in local view points/CSS pixels; hide the UI marker when projection returns null.",
        code: `import type { World, Entity } from "@nayan-ui/engine";
export function actorLabelPosition(world: World, actor: Entity) {
  const p = world.worldPosition(actor);
  return p ? world.toScreen([p[0], p[1] + 1.5, p[2]]) : null;
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
  },
  particles: {
    "burst-lifecycle": [
      {
        title: "Budget a burst when the world is nearly full",
        description:
          "Call from a hit event. burst returns the actual count spawned, so effects can degrade gracefully instead of assuming every requested particle fits.",
        code: `import type { World, Vec3 } from "@nayan-ui/engine";
export function smallBurst(world: World, position: Vec3) {
  const available = Math.max(0, world.capacity - world.count);
  if (available === 0) return 0;
  return world.burst({ position, count: Math.min(12, available), mesh: "sphere", size: 0.08,
    lifetime: 0.4, speed: 3, color: [1, 0.8, 0.2] });
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "burstoptions-reference": [
      {
        title: "Aim a cone of sparks in one direction",
        description:
          "Use a narrower spread for a jet or hit direction. Values are in world units and radians; the particles still advance through the same world update.",
        code: `import type { World, Vec3 } from "@nayan-ui/engine";
export function directionalSparks(world: World, position: Vec3) {
  return world.burst({ position, direction: [1, 0.3, 0], spread: 0.3, count: 20,
    mesh: "flame", size: 0.08, speed: 8, gravity: -4, lifetime: 0.5,
    color: [2, 1, 0.1], endColor: [0.6, 0.1, 0, 0], endSize: 0.1 });
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "puff-and-flame-materials": [
      {
        title: "Compare smoke and an additive glow",
        description:
          "Spawn these beside each other to see their blending. They are view-facing sprites, not light sources; use the particle burst API when you need many short-lived instances.",
        code: `import type { World } from "@nayan-ui/engine";
export function compareSprites(world: World) {
  world.spawn({ mesh: "puff", position: [-1, 1, 0], scale: 2, color: [0.5, 0.5, 0.5, 0.4] });
  world.spawn({ mesh: "flame", position: [1, 1, 0], scale: 2, color: [2, 0.6, 0.1, 0.5] });
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
  },
  "models-textures": {
    "asset-sources-on-each-platform": [
      {
        title: "Inject asset sources into shared preparation code",
        description:
          "The scene can depend on this function instead of importing a platform asset path. A browser host passes URLs; a native host passes Metro require(...) values. Run it after warm-up.",
        code: `import { loadModel, loadTexture } from "@nayan-ui/engine";
export async function prepareProp(modelSource: number | string, textureSource: number | string) {
  const [model, texture] = await Promise.all([loadModel(modelSource), loadTexture(textureSource)]);
  return { model, texture };
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "models-and-format-limits": [
      {
        title: "Place a loaded model using its reported dimensions",
        description:
          "Use the model’s post-fit bounding-box size for a simple centered static prop. This does not replace animated-foot grounding for a skeletal character.",
        code: `import type { World, Model } from "@nayan-ui/engine";
export function placeCenteredProp(world: World, model: Model, groundY: number) {
  return world.spawn({ mesh: model, position: [0, groundY + model.size[1] / 2, 0], physics: "fixed" });
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "textures-tint-and-atlas-regions": [
      {
        title: "Select a tile from a uniform texture atlas",
        description:
          "Use with an atlas whose rows run from v=0 at the image top. Keep columns/rows and tile index valid; only the region changes, not the registered texture.",
        code: `import type { World, Entity } from "@nayan-ui/engine";
export function setAtlasTile(world: World, actor: Entity, index: number, columns: number, rows: number) {
  if (!Number.isInteger(columns) || !Number.isInteger(rows) || columns < 1 || rows < 1 ||
      !Number.isInteger(index) || index < 0 || index >= columns * rows) throw new Error("Invalid atlas tile");
  const x = index % columns, y = Math.floor(index / columns);
  world.set(actor, { textureRegion: [x / columns, y / rows, (x + 1) / columns, (y + 1) / rows] });
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
  },
  "text-fonts": {
    "load-font-outlines": [
      {
        title: "Prepare only the characters your counter needs",
        description:
          "Pass a URL or native bundled font source from the host. A numeric HUD can start with digits instead of tessellating every ordinary label character.",
        code: `import { loadFont } from "@nayan-ui/engine";
export function loadCounterFont(source: number | string) {
  return loadFont(source, { depth: 0, chars: "0123456789:+- ", weight: 600 });
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "spawn-update-and-align-text": [
      {
        title: "Fit a label to a maximum world-space width",
        description:
          "Measure at scale one, then scale the text entity to fit. This stays a single line; wrapping is a separate application layout decision.",
        code: `import { measureText, type World, type Font } from "@nayan-ui/engine";
export function fitLabel(world: World, font: Font, text: string, maxWidth: number) {
  const width = measureText(font, text, { letterSpacing: 0.02 });
  return world.spawn({ text, font, align: "center", letterSpacing: 0.02,
    scale: Math.min(1, maxWidth / Math.max(0.001, width)), position: [0, 2, 0] });
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "font-and-text-types": [
      {
        title: "Share text layout settings between measurement and drawing",
        description:
          "Use the same TextLayout values in both calls so the measured width matches the drawn spacing. tabular keeps the changing digit widths stable.",
        code: `import { measureText, type World, type Font, type TextLayout } from "@nayan-ui/engine";
export function numericLabel(world: World, font: Font) {
  const layout: TextLayout = { tabular: true, letterSpacing: 0.03 };
  const width = measureText(font, "0000", layout);
  const actor = world.spawn({ text: "0000", font, ...layout, align: "left" });
  return { actor, width };
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
  },
  "procedural-geometry": {
    "geometry-and-registration": [
      {
        title: "Register an explicit triangle",
        description:
          "Build during asset preparation after warm-up. This shows the complete 11-float vertex format; normal +Z and counterclockwise winding make the front face the camera along +Z.",
        code: `import { createShape, type Geometry } from "@nayan-ui/engine";
export function triangleModel() {
  const geometry: Geometry = {
    vertices: new Float32Array([
      -1, -1, 0, 0, 0, 1, 1, 0, 0, 0, 1,
       1, -1, 0, 0, 0, 1, 0, 1, 0, 1, 1,
       0,  1, 0, 0, 0, 1, 0, 0, 1, 0.5, 0,
    ]), indices: new Uint32Array([0, 1, 2]),
  };
  return createShape(geometry, { center: false });
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "path-commands-and-extrusion": [
      {
        title: "Turn an SVG outline into a reusable token",
        description:
          "Use SVG path data, not an entire SVG document. Build once after warm-up; fit normalizes the source drawing’s arbitrary coordinate scale.",
        code: `import { Path, extrude, createShape } from "@nayan-ui/engine";
export function arrowToken() {
  const path = Path.fromSVG("M0 4 L6 4 L6 1 L10 6 L6 11 L6 8 L0 8 Z");
  return createShape(extrude(path, { depth: 1 }), { fit: 1.5, shine: 0.2 });
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "lathe-profiles-and-painted-cut-faces": [
      {
        title: "Create a full revolved vase",
        description:
          "The points are radius/height pairs. This is a solid visual vase-shaped object, not a hollow shell; use Solid.shell when you need a wall thickness.",
        code: `import { lathe, createShape } from "@nayan-ui/engine";
export function vaseModel() {
  return createShape(lathe([[0, 0], [0.6, 0], [0.8, 0.5], [0.35, 1.2], [0.4, 1.6]], {
    segments: 32, color: ({ v }) => [0.2, 0.4 + v * 0.3, 0.8],
  }), { shine: 0.5 });
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "tubes-parts-and-surface-passes": [
      {
        title: "Make a tapered curved horn",
        description:
          "The radius callback changes along path progress. Return zero at the final point for a tip; a closed loop would instead join the path ends.",
        code: `import { tube, createShape } from "@nayan-ui/engine";
export function hornModel() {
  return createShape(tube([[0, 0, 0], [0.2, 0.6, 0], [0.5, 1, 0.1], [0.8, 1.1, 0.2]], {
    radius: t => 0.25 * (1 - t), sides: 12, smoothness: 8, color: [0.8, 0.75, 0.6],
  }));
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
  },
  "surfaces-lofts": {
    "parametric-surfaces": [
      {
        title: "Close a cylinder seam while retaining UVs",
        description:
          "wrapU welds the surface seam for normals while keeping UV values at zero and one. This makes only the side wall; add separate caps if your object needs them.",
        code: `import { parametricSurface, createShape } from "@nayan-ui/engine";
export function cylinderSide() {
  return createShape(parametricSurface((u, v) => {
    const angle = u * Math.PI * 2;
    return [Math.cos(angle), v * 2 - 1, -Math.sin(angle)];
  }, { uSegments: 32, vSegments: 8, wrapU: true }));
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "loft-cross-sections-and-convenience-forms": [
      {
        title: "Keep a loft’s authored origin for placement",
        description:
          "center:false preserves the bottom at Y=0 in these sections. Spawn it directly at the ground height instead of compensating for a centered bounding box.",
        code: `import { loft, createShape } from "@nayan-ui/engine";
export function cabinModel() {
  return createShape(loft([
    { z: -1, bottom: 0, top: 1, width: 0.8, topWidth: 0.6 },
    { z: 1, bottom: 0, top: 1, width: 0.8, topWidth: 0.6 },
  ], { around: 20, smoothness: 1 }), { center: false });
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "smooth-curves-and-deformation": [
      {
        title: "Use a smooth curve as a gameplay speed response",
        description:
          "Create the curve once, then sample it from input handling. The returned speed is clamped outside the authored range; it does not modify geometry or the world itself.",
        code: `import { smoothCurve } from "@nayan-ui/engine";
const speedForPull = smoothCurve([[0, 0], [0.2, 0], [0.5, 2], [1, 6]]);
export function movementSpeed(pull: number) { return speedForPull(pull); }`,
        platform: "shared",
        language: "tsx",
      },
    ],
  },
  "solid-modelling": {
    "solid-constructors-and-operations": [
      {
        title: "Blend two primitives into one organic form",
        description:
          "Recipes are immutable, so retain the returned blend/transform. Build this model once during preparation rather than on every spawn.",
        code: `import { Solid, createSolid } from "@nayan-ui/engine";
export function mushroomModel() {
  const stem = Solid.capsule([0, -0.6, 0], [0, 0.3, 0], 0.2).paint([0.8, 0.7, 0.5]);
  const cap = Solid.ellipsoid([0.8, 0.3, 0.8]).translate([0, 0.5, 0]).paint([0.8, 0.2, 0.1]);
  return createSolid(stem.blend(cap, 0.15), { resolution: 40 });
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "tessellation-and-registration": [
      {
        title: "Compare the cost of two resolutions before choosing one",
        description:
          "Run during development/preparation, not onUpdate. geometryStats reports geometry size so you can compare detail against startup and memory cost without registering both meshes.",
        code: `import { Solid, solidGeometry, geometryStats } from "@nayan-ui/engine";
export function compareResolution() {
  const recipe = Solid.sphere(1).displace({ amplitude: 0.08, seed: 7 });
  return [24, 48].map(resolution => ({ resolution,
    stats: geometryStats(solidGeometry(recipe, { resolution })) }));
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "optimize-and-select-lod-explicitly": [
      {
        title: "Keep the source unchanged while simplifying a prop",
        description:
          "Use this for static geometry whose vertex indices are not used for skin-point queries or other external data. A small error limit may keep more triangles than the requested ratio.",
        code: `import { optimizeGeometry, geometryStats, type Geometry } from "@nayan-ui/engine";
export function simplifyProp(source: Geometry) {
  const reduced = optimizeGeometry(source, { ratio: 0.5, error: 0.005, lockBorders: true });
  console.log({ before: geometryStats(source).triangles, after: geometryStats(reduced).triangles });
  return reduced;
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
  },
  "scoreboard-timers": {
    "scoreboard-state-and-handlers": [
      {
        title: "Connect lives and a single game-over guard",
        description:
          "Create one handler owner for the round. Both a timeout and loss of lives may occur in the same update, so finish accepts only the first result.",
        code: `import type { World } from "@nayan-ui/engine";
export function wireRoundEnd(world: World, onLose: () => void) {
  let ended = false;
  const finish = () => { if (!ended) { ended = true; world.scoreboard.stop(); onLose(); } };
  world.scoreboard.handlers = { onTimeUp: finish, onLivesOut: finish };
  world.scoreboard.reset(3);
  world.scoreboard.startCountdown(30);
  return () => world.scoreboard.addLives(-1);
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "scoreboard-operations": [
      {
        title: "Award time saved when the player finishes",
        description:
          "Call once when a countdown-based round is won. Stopping the clock first prevents more time from being consumed while the results UI opens.",
        code: `import type { World } from "@nayan-ui/engine";
export function finishWithTimeBonus(world: World) {
  world.scoreboard.stop();
  world.scoreboard.awardTimeBonus(10);
  return { score: world.scoreboard.score, secondsSaved: world.scoreboard.shownSeconds };
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "timers-follow-simulation-time": [
      {
        title: "Invalidate callbacks from an earlier round",
        description:
          "Use a generation token when this controller should cancel only its own logical work. World.cancelTimers clears every timer; a token lets unrelated game-time timers continue.",
        code: `import type { World } from "@nayan-ui/engine";
export function roundDelayedAction(world: World) {
  let generation = 0;
  return { schedule(action: () => void) {
    const expected = generation;
    world.after(2, () => { if (generation === expected) action(); });
  }, reset() { generation++; } };
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
  },
  "audio-haptics": {
    "load-a-named-sound-bank": [
      {
        title: "Keep sound preparation shared between visits",
        description:
          "Supply host-specific URL/Metro sources once. The bank is ready before it reaches gameplay, and failure of a particular sound is handled by the bank’s documented loading behavior.",
        code: `import { audio, type SoundSource } from "@nayan-ui/engine";
export function prepareSoundBank(sources: { hit: SoundSource; win: SoundSource }) {
  const bank = audio.load(sources);
  return bank.ready.then(() => bank);
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "voices-and-preferences": [
      {
        title: "Apply master sound settings from a host panel",
        description:
          "Call on settings changes rather than every frame. Muting is global, so a screen should coordinate ownership if multiple game screens can stay mounted.",
        code: `import { audio } from "@nayan-ui/engine";
export function applySoundSettings(enabled: boolean, volume: number) {
  audio.muted = !enabled;
  audio.volume = Math.max(0, Math.min(2, volume));
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "native-collision-feedback-shares-the-mixer": [
      {
        title: "Remove automatic impact feedback when leaving a mode",
        description:
          "Clear the entity option when that actor should stop producing core-driven collision feedback. This is separate from stopping a manually played looping voice.",
        code: `import type { World, Entity } from "@nayan-ui/engine";
export function clearImpacts(world: World, actor: Entity) {
  world.set(actor, { impact: null });
  if (world.listener === actor) world.listener = null;
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "haptic-patterns-and-support": [
      {
        title: "Give light selection feedback only when supported",
        description:
          "Use this from a menu/selection action. The engine API applies its own throttling; the host still owns the user preference.",
        code: `import { haptics } from "@nayan-ui/engine";
export function selectWithFeedback(enabled: boolean) {
  if (enabled && haptics.supported) haptics.selection();
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
  },
  "cache-performance": {
    "session-caches-and-persistent-geometry": [
      {
        title: "Reuse a solid automatically on replay",
        description:
          "Call during scene setup after warm-up. Rust reuses the prepared solid model without JS tessellation or geometry snapshots; saved records have no automatic expiry or eviction.",
        code: `import { Solid, createSolid, type World } from "@nayan-ui/engine";
export function addStool(world: World) {
  const seat = createSolid(Solid.box([1, 0.2, 1]).paint([0.5, 0.3, 0.1]));
  return world.spawn({ mesh: seat, position: [0, 0.9, 0] });
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "storage-contract-and-revisioning": [
      {
        title: "Clear engine storage only after a user action",
        description:
          "Call from a settings action on either host. Await success before showing confirmation. This preserves loaded worlds and handles and prevents older downloads from refilling cleared storage.",
        code: `import { clearAssetCache } from "@nayan-ui/engine";
export async function clearSavedGameAssets() {
  await clearAssetCache();
  return "Engine assets cleared; other application data is unchanged.";
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "transform-batches": [
      {
        title: "Discard an uncommitted batch when input is canceled",
        description:
          "Create the batch once. Queue cheap visual changes, flush on commit, or clear on cancellation so a later commit cannot apply the canceled drag.",
        code: `import type { World, Entity } from "@nayan-ui/engine";
export function queuedDrag(world: World) {
  const batch = world.createTransformBatch();
  return {
    move(actor: Entity, x: number, y: number) { batch.position(actor, x, y, 0); },
    commit: () => batch.flush(),
    cancel: () => batch.clear(),
  };
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "practical-budgets": [
      {
        title: "Reserve space before emitting an optional effect",
        description:
          "Use capacity checks for optional scene decoration/effects. Text glyphs and particles also consume capacity, so a budget should leave room for the gameplay-critical actors.",
        code: `import { meshIdLimit, type World } from "@nayan-ui/engine";
export function reportBudget(world: World) {
  return { live: world.count, capacity: world.capacity,
    availableEntities: world.capacity - world.count,
    registeredMeshScanLimit: meshIdLimit() };
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
  },
  "render-source": {
    "instance-buffer-contract": [
      {
        title: "Add one transparent instance to custom buffers",
        description:
          "This source uses two cube instances: opaque first, transparent second. Both matrices and colors must be packed in that same order. Built-in meshes must already be prepared by warmUpEngine.",
        code: `import type { RenderSource } from "@nayan-ui/engine";
export function twoCubes(): RenderSource {
  const matrices = new Float32Array(32);
  for (let i = 0; i < 2; i++) {
    matrices.set([1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, i * 2, 0, 0, 1], i * 16);
  }
  const ranges = new Uint32Array(4096 * 4);
  ranges.set([0, 1], 0); ranges.set([1, 1], 4096 * 2);
  return { matrices, colors: new Float32Array([1, 1, 1, 1, 0.2, 0.7, 1, 0.4]), ranges, count: 2, capacity: 2 };
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "use-custom-sources-deliberately": [
      {
        title: "Update one custom transform without allocating a new buffer",
        description:
          "Call this from onUpdate for the source returned by your custom simulation. It changes the translation part of an existing column-major matrix; it does not add World physics or picking.",
        code: `import type { RenderSource } from "@nayan-ui/engine";
export function moveFirstInstance(source: RenderSource, x: number, y: number, z: number) {
  if (source.count < 1) return;
  source.matrices[12] = x; source.matrices[13] = y; source.matrices[14] = z;
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
  },
  troubleshooting: {
    "initialization-and-rendering": [
      {
        title: "Separate a layout problem from a simulation problem",
        description:
          "Use this minimal view with a prepared world. A visible cube confirms initialization, camera placement and frame stepping; then add your gameplay back a piece at a time.",
        code: `import { GameView, type World } from "@nayan-ui/engine";
export function DebugView({ world }: { world: World }) {
  return <GameView source={world} camera={{ eye: [0, 2, 6], target: [0, 0, 0], fov: 1 }}
    onUpdate={dt => world.update(dt)} onError={error => console.error("Renderer:", error.message)}
    onStats={stats => console.log(stats.backend, stats.fps)} />;
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "assets-animation-and-feedback": [
      {
        title: "Report available animation names when a clip fails",
        description:
          "Call after spawning the loaded model. An unavailable name should produce a useful error with the real asset metadata, rather than a silent character that appears frozen.",
        code: `import type { World, Entity, LoadedModel } from "@nayan-ui/engine";
export function playChecked(world: World, actor: Entity, model: LoadedModel, name: string) {
  if (!world.playClip(actor, name)) throw new Error(
    \`Could not play \${name}. Model clips: \${model.animations.map(clip => clip.name).join(", ")}\`);
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "production-checklist": [
      {
        title: "Build and serve the documented React example",
        description:
          "Run these commands from the Playtura repository. Then verify pause/resume, picking and first-interaction audio against the built host, including a WebGL2-only browser test.",
        code: `bun run engine:build:web
bun run engine:test:web
bun run engine:example web:build
# Serve the generated host on localhost:
python3 -m http.server 8080 --directory packages/engine/example/web/dist`,
        platform: "shell",
        language: "bash",
      },
    ],
  },
  "api-reference": {
    "assets-source": [
      {
        title: "Accept assets through the shared public source type",
        description:
          "Pass a URL in React or Metro require(...) in React Native. The loader initializes the core and shares the resource without a caller-owned promise map.",
        code: `import { loadTexture, type AssetSource } from "@nayan-ui/engine";
export function loadBoardImage(source: AssetSource) {
  return loadTexture(source);
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "assets-AssetCache": [
      {
        title: "Remove saved assets without invalidating a running scene",
        description:
          "Use from an explicit user settings action, on React or React Native. The promise rejects when the platform cannot clear storage; keep the current scene alive and report the error.",
        code: `import { clearAssetCache } from "@nayan-ui/engine";
export async function clearEngineStorage() { await clearAssetCache(); }`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "reading-the-reference": [
      {
        title: "Use a public type to validate an options object",
        description:
          "Import the public types into your application rather than copying private bridge layouts. TypeScript will flag misspelled options before the game runs.",
        code: `import type { EntityOptions, AnimateOptions } from "@nayan-ui/engine";
export const actorOptions: EntityOptions = { mesh: "sphere", position: [0, 2, 0], physics: "dynamic" };
export const revealOptions: AnimateOptions = { duration: 0.25, easing: "back", stagger: 0.03 };`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "world-World": [
      {
        title: "Create and remove one entity",
        description:
          "Call after warm-up. This is a setup/helper fragment; use GameView.onUpdate to step/render the world and dispose it when the owning scene closes.",
        code: `import { World } from "@nayan-ui/engine";
export function exampleWorld() {
  const world = new World(16);
  const actor = world.spawn({ mesh: "cube" });
  world.set(actor, { position: [1, 0, 0] });
  return { world, remove: () => world.despawn(actor), dispose: () => world.dispose() };
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "world-Scoreboard": [
      {
        title: "Configure a round through world.scoreboard",
        description:
          "Access Scoreboard through its owner. The handlers dispatch during update, so UI notifications follow simulation time.",
        code: `import type { World, ScoreboardHandlers } from "@nayan-ui/engine";
export function scoreRound(world: World, handlers: ScoreboardHandlers) {
  world.scoreboard.handlers = handlers;
  world.scoreboard.reset(3);
  world.scoreboard.startCountdown(45);
  world.scoreboard.add(20);
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "world-types": [
      {
        title: "Keep entity and collider options explicit",
        description:
          "Store the returned Entity handle, not the configuration object, for later world operations. The configuration can be shared, but each spawn creates an independent actor.",
        code: `import type { World, EntityOptions, PhysicsOptions, Entity, ClipOptions, ScreenPlane } from "@nayan-ui/engine";
export const walkClip: ClipOptions = { loop: true, speed: 1, fade: 0.15 };
export const groundPlane: ScreenPlane = { point: [0, 0, 0], normal: [0, 1, 0] };
export function typedActor(world: World): Entity {
  const physics: PhysicsOptions = { type: "dynamic", shape: "ball", radius: 0.5, bounce: 0.4 };
  const options: EntityOptions = { mesh: "sphere", position: [0, 3, 0], physics };
  return world.spawn(options);
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "render-GameView": [
      {
        title: "Connect the minimum rendering contract",
        description:
          "Mount inside a measured/sized host. Keep the world stable between renders and call its update method from this single frame callback.",
        code: `import { GameView, type GameViewProps, type World } from "@nayan-ui/engine";
type SceneViewProps = Omit<GameViewProps, "source"> & { world: World };
export function MinimalView({ world, ...props }: SceneViewProps) {
  return <GameView {...props} source={world} onUpdate={props.onUpdate ?? (dt => world.update(dt))} />;
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "render-meshes": [
      {
        title: "Warm up before inspecting registered mesh usage",
        description:
          "meshIdLimit reports the renderer’s scan boundary, not the number of free entities or remaining mesh slots. Use it as a diagnostic during asset preparation.",
        code: `import { warmUpEngine, meshIdLimit } from "@nayan-ui/engine";
export async function prepareAndInspect() {
  await warmUpEngine();
  console.log("Mesh scan limit:", meshIdLimit());
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "world-TransformBatch": [
      {
        title: "Queue and flush one transform",
        description:
          "Acquire the batch through World. flush before position queries, animations or update so those operations see the new values.",
        code: `import type { World, Entity, TransformOptions } from "@nayan-ui/engine";
export function batchTransform(world: World, actor: Entity) {
  const batch = world.createTransformBatch();
  const options: TransformOptions = { position: [1, 2, 3], scale: 1.2 };
  batch.set(actor, options);
  return batch.flush();
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "render-quality": [
      {
        title: "Choose an allowed quality setting",
        description:
          "The host can offer an automatic setting and a battery-saving override. Pass the returned value as GameView.quality.",
        code: `import type { QualitySetting } from "@nayan-ui/engine";
export function preferredQuality(saveBattery: boolean): QualitySetting {
  return saveBattery ? "low" : "auto";
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "assets-model": [
      {
        title: "Read a model’s clip metadata before spawning",
        description:
          "Pass a browser URL or native numeric source from the host. Run after initialization and retain the returned model for repeated entity creation.",
        code: `import { loadModel } from "@nayan-ui/engine";
export async function inspectModel(source: number | string) {
  const model = await loadModel(source, { fit: 2, center: false });
  return { model, clips: model.animations.map(clip => ({ name: clip.name, seconds: clip.duration })) };
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "assets-ProceduralCache": [
      {
        title: "Cache a static geometry factory",
        description:
          "Use a revisioned factory after warm-up. The default platform storage is selected by the engine; supplying an adapter is optional. This advanced factory cache is unnecessary for ordinary createShape/createSolid/loader usage.",
        code: `import { ProceduralCache, createShape, block } from "@nayan-ui/engine";
const props = new ProceduralCache("props-v1");
export function cachedCrate() {
  return props.get("crate", () => createShape(block(1, 1, 1)));
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "assets-texture": [
      {
        title: "Spawn a textured model",
        description:
          "Load the texture once during preparation, then pass it into setup helpers. Entity color multiplies the texture; use white to preserve its authored colors.",
        code: `import type { World, Model, Texture } from "@nayan-ui/engine";
export function texturedProp(world: World, mesh: Model, texture: Texture) {
  return world.spawn({ mesh, texture, color: [1, 1, 1], position: [0, 1, 0] });
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "assets-modelling": [
      {
        title: "Create a rounded solid prop",
        description:
          "Build outside the frame loop after warm-up. Rust reuses equal solid recipes/options and saves prepared geometry through the platform store.",
        code: `import { Solid, createSolid } from "@nayan-ui/engine";
export function roundedCrate() {
  return createSolid(Solid.box([1, 1, 1], 0.1).paint([0.5, 0.3, 0.1]), { resolution: 24 });
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "assets-loft": [
      {
        title: "Compose two convenience geometries",
        description:
          "The helpers return Geometry, not entities. Merge them before registering when they should move as one visual object.",
        code: `import { block, ellipsoid, merge, createShape } from "@nayan-ui/engine";
export function simpleTreeProp() {
  return createShape(merge([
    { geometry: block(0.3, 1.5, 0.3), color: [0.35, 0.2, 0.1] },
    { geometry: ellipsoid([1, 1, 1]), position: [0, 1.5, 0], color: [0.2, 0.5, 0.1] },
  ]));
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "assets-surface": [
      {
        title: "Author a flat upward-facing patch",
        description:
          "The point order makes dP/du × dP/dv face +Y. Add height to the middle coordinate to turn this into visual terrain.",
        code: `import { parametricSurface } from "@nayan-ui/engine";
export function groundPatch() {
  return parametricSurface((u, v) => [(u - 0.5) * 10, 0, (0.5 - v) * 10],
    { uSegments: 8, vSegments: 8, color: [0.2, 0.4, 0.1] });
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "assets-shape": [
      {
        title: "Build a flat rounded UI shape",
        description:
          "Build once after warm-up and use it on entities in an overlay World. A zero-depth extrusion faces +Z and can be tinted per entity.",
        code: `import { Path, extrude, createShape } from "@nayan-ui/engine";
export function buttonMesh() {
  return createShape(extrude(new Path().addRRect(-1, -0.3, 2, 0.6, 0.15), { depth: 0 }));
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "assets-font": [
      {
        title: "Measure and draw with the same spacing",
        description:
          "Font is a loaded outline-font handle. Use the same layout values in measurement and entity creation to avoid mismatched label widths.",
        code: `import { measureText, type World, type Font } from "@nayan-ui/engine";
export function titleText(world: World, font: Font) {
  const text = "LEVEL 1";
  const width = measureText(font, text, { letterSpacing: 0.02 });
  const actor = world.spawn({ text, font, letterSpacing: 0.02, align: "center" });
  return { actor, width };
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "media-audio": [
      {
        title: "Stop only the voice owned by this scene",
        description:
          "Keep the Voice returned by play; stopping it does not stop every other instance of the same sound.",
        code: `import { audio, type Sound } from "@nayan-ui/engine";
export function startOwnedLoop(sound: Sound) {
  const voice = audio.play(sound, { loop: true, volume: 0.25 });
  return () => audio.stop(voice);
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "media-haptics": [
      {
        title: "Make a short custom feedback pattern",
        description:
          "Call from a discrete game event with the user preference. Browser support is optional and cannot reproduce every native intensity/sharpness value.",
        code: `import { haptics, type HapticTap } from "@nayan-ui/engine";
export function doubleTap(enabled: boolean) {
  if (!enabled) return;
  const taps: HapticTap[] = [{ time: 0, intensity: 0.4, sharpness: 0.5 },
    { time: 0.1, intensity: 0.7, sharpness: 0.7 }];
  haptics.play(taps);
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    "input-Joystick": [
      {
        title: "Keep joystick input in a stable object",
        description:
          "Use useJoystick in the host. The frame callback reads current values without a React state update for each pointer move.",
        code: `import { useJoystick, Joystick, type JoystickProps } from "@nayan-ui/engine";
export function InputPad(props: Omit<JoystickProps, "state">) {
  const state = useJoystick();
  return <Joystick {...props} state={state} size={props.size ?? 140} />;
}`,
        platform: "shared",
        language: "tsx",
      },
    ],
    types: [
      {
        title: "Define a shared camera and light",
        description:
          "Reuse these objects across frames. Keep your actor handles and render source in the scene factory, and mutate the camera/light from gameplay when needed.",
        code: `import type { Camera, Light, Vec3 } from "@nayan-ui/engine";
const target: Vec3 = [0, 1, 0];
export const camera: Camera = { eye: [8, 6, 10], target: [...target], fov: 1 };
export const light: Light = { direction: [0.4, 0.8, 0.3], ambient: 0.35, shadows: true };`,
        platform: "shared",
        language: "tsx",
      },
    ],
  },
};
