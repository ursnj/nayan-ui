import type { EngineGuide } from "./types";

export const PracticalGuides: EngineGuide[] = [
  {
    slug: "first-game",
    title: "Build your first game",
    description: "Build a complete tap game with scoring, a countdown, pause and replay.",
    sections: [
      {
        id: "what-you-will-build",
        title: "What you will build",
        paragraphs: [
          "Start here after installing the engine. This game uses only built-in shapes, so there are no model, font or sound files to download. Start begins the clock. Tap all five cubes to win. The clock reaching zero loses the round. Stop cancels the round. Reset prepares a fresh board.",
          "Create three files in one directory: tapGame.ts, useTapGame.ts and one platform screen. Copy the first two files unchanged on either platform, then choose the React or React Native screen below. Put the files in a feature folder such as src/game. In Vite, import TapGamePage from src/App.tsx. In Expo Router, keep these helpers outside the app route folder and render TapGameScreen from your route. These files are a separate example; they do not require the earlier bouncing-ball quickstart.",
        ],
      },
      {
        id: "1-create-the-game-rules-and-scene",
        title: "1. Create the game rules and scene",
        paragraphs: [
          "Save this complete file as tapGame.ts. World stores objects. camera decides where we look. targets remembers which objects can be collected. publish sends small UI updates only when the score, clock or status changes. scoreboard.reset(0, ROUND_SECONDS) shows the full countdown on the ready screen, and resume() starts it. world.isDisposed replaces a hand-written disposed flag.",
          "The game object’s start, stop and reset methods are functions we define here. The engine handles drawing, picking, object storage and the clock. Keeping game rules separate from the screen lets both platforms use exactly the same behavior.",
        ],
        examples: [
          {
            title: "tapGame.ts",
            code: `import { World, type Camera, type Entity } from "@nayan-ui/engine";

export type GameStatus = "ready" | "playing" | "win" | "lose" | "cancel";
export interface GameViewState {
  status: GameStatus;
  score: number;
  seconds: number;
  remaining: number;
}
const ROUND_SECONDS = 15;
const TARGET_POSITIONS = [[-2, 1.5], [0, 1.5], [2, 1.5], [-1, -1], [1, -1]] as const;
export const INITIAL_VIEW: GameViewState = {
  status: "ready", score: 0, seconds: ROUND_SECONDS, remaining: TARGET_POSITIONS.length,
};

// Call after await warmUpEngine(). This module has no browser/native UI imports.
export function createTapGame(onChange: (view: GameViewState) => void) {
  const world = new World(32);
  const camera: Camera = {
    eye: [0, 0, 12], target: [0, 0, 0], fov: 1, ortho: 5,
  };
  const targets = new Set<Entity>();
  let status: GameStatus = "ready";

  function publish() {
    onChange({ status, score: world.scoreboard.score,
      seconds: world.scoreboard.shownSeconds, remaining: targets.size });
  }
  function finish(result: "win" | "lose" | "cancel") {
    if (world.isDisposed || status !== "playing") return;
    status = result; // This guard lets a run finish only once.
    world.scoreboard.stop();
    world.cancelTimers();
    publish();
  }
  function reset() {
    if (world.isDisposed) return;
    world.cancelTimers();
    for (const target of targets) world.despawn(target);
    targets.clear();
    world.scoreboard.reset(0, ROUND_SECONDS); // Ready screen: a stopped, full countdown.
    status = "ready";
    for (const [x, y] of TARGET_POSITIONS) {
      targets.add(world.spawn({ mesh: "cube", position: [x, y, 0],
        scale: 0.9, color: [0.2, 0.85, 0.45], spin: [0, 0.5, 0] }));
    }
    world.update(0); // Prepare new transforms without advancing the clock.
    publish();
  }
  world.scoreboard.handlers = {
    onSecond: publish,
    onTimeUp: () => finish("lose"),
  };
  reset();

  return {
    world, camera, reset,
    start() {
      if (world.isDisposed || status === "playing") return;
      if (status !== "ready") reset();
      status = "playing";
      world.scoreboard.resume(); // Starts the countdown reset() prepared.
      publish();
    },
    stop() { finish("cancel"); },
    update(dt: number) {
      if (!world.isDisposed) world.update(status === "playing" ? dt : 0);
    },
    tap(x: number, y: number) {
      if (world.isDisposed || status !== "playing") return;
      const hit = world.pick(x, y);
      if (!hit || !targets.delete(hit.entity)) return;
      world.despawn(hit.entity);
      world.scoreboard.add(100);
      if (targets.size === 0) finish("win");
      else publish();
    },
    dispose() {
      finish("cancel");
      world.dispose(); // Safe to call twice; world.isDisposed is then true.
    },
  };
}
export type TapGame = ReturnType<typeof createTapGame>;`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "2-initialize-once-and-clean-up",
        title: "2. Initialize once and clean up",
        paragraphs: [
          "Save this as useTapGame.ts beside tapGame.ts. The hook waits for the engine before creating the scene. If the screen closes during loading, it does not create a world afterward. Cleanup disposes the world; this also works when React development Strict Mode repeats effect setup.",
        ],
        examples: [
          {
            title: "useTapGame.ts",
            code: `import { useEffect, useState } from "react";
import { warmUpEngine } from "@nayan-ui/engine";
import { createTapGame, INITIAL_VIEW, type GameViewState, type TapGame } from "./tapGame";

export function useTapGame() {
  const [game, setGame] = useState<TapGame | null>(null);
  const [view, setView] = useState<GameViewState>(INITIAL_VIEW);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    let owned: TapGame | undefined;
    void (async () => {
      await warmUpEngine();
      if (cancelled) return;
      owned = createTapGame(next => { if (!cancelled) setView(next); });
      setGame(owned);
    })().catch((reason: unknown) => {
      if (!cancelled) setError(reason instanceof Error ? reason.message : String(reason));
    });
    return () => { cancelled = true; owned?.dispose(); };
  }, []);
  return { game, view, error };
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "3-run-it-in-react",
        title: "3. Run it in React",
        paragraphs: [
          'Save this as TapGamePage.tsx and render it from your Vite app or a Next.js page. The "use client" line is required for a Next.js client entry. Give the container a height so the canvas has room to draw.',
          "The screen holds the Pause toggle. When paused, it stops both the frame callback and tap input. GameView’s onUpdate calls game.update, which steps World exactly once. Do not add a second animation loop.",
        ],
        examples: [
          {
            title: "TapGamePage.tsx",
            code: `"use client";
import { useState } from "react";
import { GameView } from "@nayan-ui/engine";
import { useTapGame } from "./useTapGame";

export default function TapGamePage() {
  const { game, view, error } = useTapGame();
  const [paused, setPaused] = useState(false);
  if (error) return <p role="alert">{error}</p>;
  if (!game) return <p>Loading engine…</p>;
  const playing = view.status === "playing";
  return <main style={{ height: "100dvh", display: "flex", flexDirection: "column" }}>
    <div style={{ padding: 12 }}>
      <p>{view.status} · Score {view.score} · Time {view.seconds} · Left {view.remaining}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button disabled={playing} onClick={() => { setPaused(false); game.start(); }}>Start / Play again</button>
        <button disabled={!playing} onClick={() => { setPaused(false); game.stop(); }}>Stop</button>
        <button disabled={!playing} onClick={() => setPaused(value => !value)}>{paused ? "Resume" : "Pause"}</button>
        <button onClick={() => { setPaused(false); game.reset(); }}>Reset</button>
      </div>
    </div>
    <GameView source={game.world} camera={game.camera} paused={paused}
      onUpdate={game.update} onTap={paused ? undefined : game.tap}
      style={{ flex: 1, minHeight: 0 }} onError={reason => console.error(reason)} />
  </main>;
}`,
            platform: "react",
            language: "tsx",
          },
        ],
      },
      {
        id: "3-run-it-in-react-native",
        title: "3. Run it in React Native",
        paragraphs: [
          "Use this file instead of the React screen. Mount it in a parent with flex: 1. Build the native engine into your Expo development app or bare React Native app first; Expo Go does not include it.",
          "The rules, object handles, clock and tap handler are the same as the browser version. This screen changes only the surrounding UI components and styles.",
        ],
        examples: [
          {
            title: "TapGameScreen.tsx",
            code: `import { useState } from "react";
import { Button, Text, View } from "react-native";
import { GameView } from "@nayan-ui/engine";
import { useTapGame } from "./useTapGame";

export default function TapGameScreen() {
  const { game, view, error } = useTapGame();
  const [paused, setPaused] = useState(false);
  if (error) return <Text accessibilityRole="alert">{error}</Text>;
  if (!game) return <Text>Loading engine…</Text>;
  const playing = view.status === "playing";
  return <View style={{ flex: 1 }}>
    <View style={{ padding: 12 }}>
      <Text>{view.status} · Score {view.score} · Time {view.seconds} · Left {view.remaining}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <Button title="Start / Play again" disabled={playing} onPress={() => { setPaused(false); game.start(); }} />
        <Button title="Stop" disabled={!playing} onPress={() => { setPaused(false); game.stop(); }} />
        <Button title={paused ? "Resume" : "Pause"} disabled={!playing} onPress={() => setPaused(value => !value)} />
        <Button title="Reset" onPress={() => { setPaused(false); game.reset(); }} />
      </View>
    </View>
    <GameView source={game.world} camera={game.camera} paused={paused}
      onUpdate={game.update} onTap={paused ? undefined : game.tap}
      style={{ flex: 1 }} onError={reason => console.error(reason)} />
  </View>;
}`,
            platform: "native",
            language: "tsx",
          },
        ],
      },
      {
        id: "try-it-and-change-one-thing",
        title: "Try it and change one thing",
        paragraphs: [
          "Press Start, collect two cubes, then Pause. The clock and remaining count should stay fixed. Resume and collect the rest: the score should be 500 and status win. Press Start / Play again to get five new cubes. Let time expire to see lose. Stop should show cancel; Reset should return to ready with score zero.",
          "To make it harder, lower ROUND_SECONDS or add positions to TARGET_POSITIONS. To make a 3D scene, replace the orthographic camera with a perspective camera. Add sound after this version works; keep loading outside the frame callback.",
        ],
        note: "An Entity is only a handle for one object in this World. Keep that handle for set/despawn calls. Reuse meshes and loaded assets on replay, but create new entity handles for the new round.",
      },
    ],
  },
  {
    slug: "recipes",
    title: "Common game recipes",
    description:
      "Copy small examples for movement, collisions, input, scoring, animation and assets.",
    sections: [
      {
        id: "how-to-use-these-examples",
        title: "How to use these examples",
        paragraphs: [
          "Use these recipes with either platform quickstart or Build your first game. Wait for warmUpEngine first. Call setup functions once when creating the scene. Connect returned update functions to the one GameView.onUpdate callback for that world.",
          "Each recipe is independent. If you combine two update examples, move their input and event logic into one callback and keep only one world.update(dt). A component example needs a sized parent: CSS height/flex on web, flex: 1 on native.",
        ],
      },
      {
        id: "move-a-box-without-react-state",
        title: "Move a box without React state",
        paragraphs: [
          "Use this for a non-physics object such as scenery, a pointer or a moving obstacle. Position is measured in world units. Multiplying speed by dt makes movement independent of screen refresh rate. Per-frame moves go through world.transforms: step the world, queue the move, then flush once. Pass the returned update function to onUpdate.",
        ],
        examples: [
          {
            title: "Move at two units per second",
            code: `import type { World } from "@nayan-ui/engine";
export function addMovingBox(world: World) {
  const box = world.spawn({ mesh: "cube", position: [-4, 1, 0], color: [0.2, 0.7, 1] });
  let x = -4;
  return (dt: number) => {
    world.update(dt);
    x += 2 * dt;
    if (x > 4) x = -4;
    world.transforms.position(box, x, 1, 0); // No allocation.
    world.transforms.flush(); // Once, after update.
  };
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "let-a-ball-fall-and-bounce",
        title: "Let a ball fall and bounce",
        paragraphs: [
          "Give the floor a fixed body and the ball a dynamic body. The engine then applies gravity and handles the collision. Connect world.update(dt) to onUpdate; you do not need to calculate the falling position yourself.",
        ],
        examples: [
          {
            title: "Add a floor and ball",
            code: `import type { World } from "@nayan-ui/engine";
export function addBouncingBall(world: World) {
  world.spawn({ mesh: "cube", position: [0, -0.5, 0], scale: [20, 1, 20], physics: "fixed" });
  return world.spawn({ mesh: "sphere", position: [0, 5, 0], color: [1, 0.5, 0.1],
    physics: { type: "dynamic", bounce: 0.7 } });
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "steer-a-player-with-a-joystick",
        title: "Steer a player with a joystick",
        paragraphs: [
          "Use this for a ground-based player with a dynamic body. groundVelocity changes horizontal X/Z movement while keeping vertical motion, so the player still falls. The joystick object is mutable: read it each frame instead of setting React state for every finger movement.",
        ],
        examples: [
          {
            title: "Player and shared input component",
            code: `import { GameView, Joystick, useJoystick, type World, type Entity } from "@nayan-ui/engine";
export function addPlayer(world: World) {
  return world.spawn({ mesh: "capsule", position: [0, 2, 0], scale: [0.8, 1.8, 0.8],
    physics: { type: "dynamic", shape: "capsule", height: 1.8, radius: 0.4,
      upright: true, layer: 2, mask: 1 | 4 } });
}
export function PlayerControls({ world, player }: { world: World; player: Entity }) {
  const stick = useJoystick();
  return <>
    <GameView source={world} onUpdate={dt => {
      world.set(player, { groundVelocity: [stick.x * 5, -stick.y * 5] });
      world.update(dt);
    }} />
    <Joystick state={stick} />
  </>;
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
        note: "Place PlayerControls in a flex column or place Joystick in a host overlay. Add a fixed floor on layer 1. Dispose the World in its owning screen, rather than inside this controls component.",
      },
      {
        id: "jump-only-when-standing-on-the-floor",
        title: "Jump only when standing on the floor",
        paragraphs: [
          "Use this with the previous 1.8-unit-tall player. The short downward ray checks floor layer 1, excluding the player on layer 2. Checking upward velocity also stops repeated jump presses from adding more impulses before the player leaves the floor. Call tryJump from your host button or key handler.",
        ],
        examples: [
          {
            title: "A grounded jump",
            code: `import type { World, Entity } from "@nayan-ui/engine";
export function tryJump(world: World, player: Entity): boolean {
  const position = world.position(player);
  const velocity = world.velocity(player);
  if (!position || !velocity || velocity[1] > 0.1) return false;
  const floor = world.raycast(position, [0, -1, 0], 1.05, 1);
  if (!floor) return false;
  world.impulse(player, [0, 5, 0]);
  return true;
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "collect-a-coin-on-contact",
        title: "Collect a coin on contact",
        paragraphs: [
          "Use a sensor when a pickup should report contact without pushing the player. Call forEachCollision after update. Check that the event started and that the two handles are the player and coin. The coin is removed once, and the score increases by 100.",
        ],
        examples: [
          {
            title: "A sensor pickup",
            code: `import type { World, Entity } from "@nayan-ui/engine";
export function addCoin(world: World, player: Entity) {
  const coin = world.spawn({ mesh: "sphere", position: [3, 1, 0], scale: 0.5, color: [1, 0.8, 0.1],
    physics: { type: "fixed", sensor: true, layer: 4, mask: 2 } });
  let collected = false;
  return (dt: number) => {
    world.update(dt);
    world.forEachCollision((a, b, info) => {
      const pair = (a === player && b === coin) || (a === coin && b === player);
      if (!info.started || !pair || collected) return;
      collected = true;
      world.despawn(coin);
      world.scoreboard.add(100);
    });
  };
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "tap-an-object-and-change-its-color",
        title: "Tap an object and change its color",
        paragraphs: [
          "Use screen picking for click/tap interactions; a physics body is not required. GameView supplies local coordinates. The hit contains the Entity handle to pass back to world.set.",
        ],
        examples: [
          {
            title: "Recolor the tapped object",
            code: `import { GameView, type World } from "@nayan-ui/engine";
export function TapToPaint({ world }: { world: World }) {
  return <GameView source={world} onUpdate={dt => world.update(dt)}
    onTap={(x, y) => {
      const hit = world.pick(x, y);
      if (hit) world.set(hit.entity, { color: [1, 0.3, 0.4] });
    }} />;
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "make-an-enemy-chase-the-player",
        title: "Make an enemy chase the player",
        paragraphs: [
          "follow moves an actor toward a target on the ground. Set it once; World updates it afterward. Clearing follow stops the chase behavior, while the entity remains in the world.",
        ],
        examples: [
          {
            title: "Start and stop a chase",
            code: `import type { World, Entity } from "@nayan-ui/engine";
export function addEnemy(world: World, player: Entity) {
  const enemy = world.spawn({ mesh: "sphere", position: [5, 1, 5], color: [1, 0.2, 0.2],
    follow: { target: player, speed: 2 } });
  return { enemy, stop() { world.set(enemy, { follow: null, velocity: [0, 0, 0] }); } };
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "animate-a-hit-and-remove-an-object",
        title: "Pop a collected object and remove it",
        paragraphs: [
          "effects.pop plays the standard cleared-piece animation (swell, flash white, settle, shrink away) and resolves when it is gone; sparkle adds a burst at the same spot. Despawn after the promise. No disposal guard is needed: despawn is a safe no-op if the screen closed meanwhile. Fire the sparkle before the await, while the world is certainly alive.",
        ],
        examples: [
          {
            title: "Pop away safely",
            code: `import { effects, type Color, type Entity, type World } from "@nayan-ui/engine";
const pos: [number, number, number] = [0, 0, 0];
export async function collect(world: World, entity: Entity, color: Color) {
  if (world.worldPosition(entity, pos)) {
    effects.sparkle(world, { position: pos, colors: color, size: 0.08, speed: 3, count: 12, lifetime: 0.5 });
  }
  await effects.pop(world, entity, { scale: 1, color });
  world.despawn(entity);
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "show-the-score-in-react-ui",
        title: "Show the score in React UI",
        paragraphs: [
          "Let scoreboard events update the UI only when values change. Use this shared hook from either a DOM paragraph or a native Text component. The scene owns this scoreboard handler; merge any other scoreboard callbacks you need into the same assignment.",
        ],
        examples: [
          {
            title: "Subscribe to score changes",
            code: `import { useEffect, useState } from "react";
import type { World } from "@nayan-ui/engine";
export function useScore(world: World) {
  const [score, setScore] = useState(world.scoreboard.score);
  useEffect(() => {
    setScore(world.scoreboard.score);
    const previous = world.scoreboard.handlers;
    const handlers = { ...previous, onScore(value: number) { previous.onScore?.(value); setScore(value); } };
    world.scoreboard.handlers = handlers;
    return () => { if (world.scoreboard.handlers === handlers) world.scoreboard.handlers = previous; };
  }, [world]);
  return score;
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "spawn-something-after-a-game-time-delay",
        title: "Spawn something after a game-time delay",
        paragraphs: [
          "Use after instead of setTimeout when the delay should pause with the game. This callback fires after three seconds of World updates. Keep the id to cancel just this timer with cancelTimer, and call cancelTimers when resetting a round so an old round cannot spawn objects in the new one.",
        ],
        examples: [
          {
            title: "Delay a spawn",
            code: `import type { World } from "@nayan-ui/engine";
export function scheduleBonus(world: World) {
  const id = world.after(3, () => world.spawn({ mesh: "torus", position: [0, 2, 0], color: [1, 0.8, 0.1] }));
  return () => world.cancelTimer(id); // Returns false if it already fired.
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "build-one-model-and-reuse-it-for-many-objects",
        title: "Build one model and reuse it for many objects",
        paragraphs: [
          "Create models after warm-up and spawn entities using those models. Repeating the same creation call during scene setup reuses engine-managed preparation and registration. You do not need a module-level promise or cache map. Keep geometry construction outside the frame callback.",
        ],
        examples: [
          {
            title: "Create a reusable star with automatic caching",
            code: `import { warmUpEngine, Path, extrude, createShape, type World } from "@nayan-ui/engine";
export async function loadStar() {
  await warmUpEngine();
  return createShape(
    extrude(new Path().addStar(0, 0, 0.5, 0.22, 5), { depth: 0.15 }), { shine: 0.4 }
  );
}
export async function addStars(world: World) {
  const star = await loadStar();
  if (world.isDisposed) return; // spawn throws on a disposed world.
  for (let i = 0; i < 5; i++) world.spawn({ mesh: star, position: [i - 2, 1, 0], color: [1, 0.8, 0.2] });
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "play-a-sound-only-when-the-player-acts",
        title: "Play a sound only when the player acts",
        paragraphs: [
          "Load the bank during preparation, using a URL in React or require(...) in React Native as shown in Models and Audio. Pass the loaded bank into your game. Keep sound/haptic preferences in the application and check them when playing feedback.",
        ],
        examples: [
          {
            title: "Feedback from a gameplay event",
            code: `import { haptics, type SoundBank } from "@nayan-ui/engine";
export function rewardPickup(bank: SoundBank<"pickup">, enableSounds: boolean, enableHaptics: boolean) {
  if (enableSounds) bank.play("pickup", { volume: 0.7 });
  if (enableHaptics) haptics.selection();
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "celebrate-a-win-with-confetti",
        title: "Celebrate a win with confetti",
        paragraphs: [
          "Ready-made effects are one call each and clean themselves up. Fire them from the event that ends the round, before you report the result. Size the World's capacity for the extra particles (about count plus a few).",
        ],
        examples: [
          {
            title: "Confetti over the board",
            code: `import { effects, type World } from "@nayan-ui/engine";
export function celebrateWin(world: World) {
  effects.confetti(world, { position: [0, 3, 0], colors: [[1, 0.3, 0.3], [1, 0.85, 0.2], [0.3, 0.7, 1]],
    size: 0.12, speed: 6, count: 40, lifetime: 1.4, gravity: -6 });
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "turn-to-face-the-movement-direction",
        title: "Turn to face the movement direction",
        paragraphs: [
          "Use quat.y for a heading and quat.slerp to turn smoothly. Pass reused arrays as out so steering allocates nothing, and queue the rotation on world.transforms. Pass the returned function to onUpdate; it steps the world itself.",
        ],
        examples: [
          {
            title: "Smooth heading from joystick input",
            code: `import { quat, type Entity, type JoystickState, type MutableQuat, type World } from "@nayan-ui/engine";
export function makeFacing(world: World, player: Entity, stick: JoystickState) {
  const facing: MutableQuat = [0, 0, 0, 1];
  const goal: MutableQuat = [0, 0, 0, 1];
  return (dt: number) => {
    world.set(player, { groundVelocity: [stick.x * 5, -stick.y * 5] });
    world.update(dt);
    if (stick.x !== 0 || stick.y !== 0) quat.y(Math.atan2(stick.x, -stick.y), goal);
    quat.slerp(facing, goal, Math.min(1, dt * 12), facing);
    world.transforms.rotation(player, facing[0], facing[1], facing[2], facing[3]);
    world.transforms.flush();
  };
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
        note: "quat.y(Math.atan2(x, z)) turns a model whose front faces +z toward the direction (x, z). If the player has a dynamic body, apply the rotation to a visual child mesh (parent: player) so physics keeps control of the body.",
      },
    ],
  },
  {
    slug: "agent-guide",
    title: "Engine guide for AI agents",
    description:
      "A precise checklist for coding agents: file structure, the one API to use for each task, things never to do, a copyable game template and verification steps.",
    sections: [
      {
        id: "read-these-pages-first",
        title: "Read these pages first",
        paragraphs: [
          "Use Build your first game as the working baseline and the game template below as the shape of every new game. Use Common game recipes for individual features. Look up exact option names in the public API reference before using an unfamiliar API; never guess names from another engine. A compact JSON summary is available at /engine.json.",
        ],
        table: {
          headers: ["I want to…", "Use this", "Read next"],
          rows: [
            ["Read the machine summary", "APIs, rules and workflow as JSON", "/engine.json"],
            [
              "Build a working round",
              "Complete shared scene, hook and two platform screens",
              "/engine/first-game",
            ],
            [
              "Add a specific feature",
              "Short setup functions and update handlers",
              "/engine/recipes",
            ],
            [
              "Follow the lifecycle rules",
              "Create, update, flush, dispose, isDisposed",
              "/engine/world-entities",
            ],
            [
              "Add effects",
              "effects.confetti / sparkle / shatter / dust / pop …",
              "/engine/particles",
            ],
            [
              "Paint or score drawings",
              "DrawingDocument, DrawingCanvas, texture(), coverage()",
              "/engine/drawing",
            ],
            ["Check an API signature", "Source-derived exports and types", "/engine/api-reference"],
            [
              "Load files",
              "Browser URLs and native require(...) examples",
              "/engine/models-textures",
            ],
            [
              "Diagnose a blank screen",
              "Initialization, layout, camera and update checks",
              "/engine/troubleshooting",
            ],
          ],
        },
      },
      {
        id: "use-a-small-file-structure",
        title: "Use this file structure",
        paragraphs: [
          "Keep gameplay in a plain TypeScript factory with no React or platform imports, so the same file runs in the browser and on React Native. The factory returns world, camera and the round functions (start, stop, reset, update, input handlers, dispose). A React hook owns initialization and cleanup. The screen owns layout, buttons and GameView only.",
        ],
        table: {
          headers: ["File", "Contains", "Never contains"],
          rows: [
            [
              "gameConstants.ts",
              "Tuning numbers, colors, asset sources and an async loadAssets()",
              "World instances or entities",
            ],
            [
              "game.ts",
              "createGame(): World, camera, rules, start/stop/reset/update/tap/dispose",
              "React, DOM or react-native imports",
            ],
            [
              "useGame.ts",
              "await warmUpEngine() then createGame() in an effect; dispose in cleanup",
              "Game rules or per-frame state",
            ],
            [
              "GamePage.tsx / GameScreen.tsx",
              "GameView, HUD text and buttons for one host",
              "world.update calls outside onUpdate",
            ],
          ],
        },
        examples: [
          {
            title: "File layout",
            description:
              "Put the files in one feature folder. In Expo Router keep them outside the app route folder and render the screen from a route.",
            code: `src/game/
  gameConstants.ts   # tuning, colors, asset sources, loadAssets()
  game.ts            # createGame(): shared rules, no UI imports
  useGame.ts         # warm-up, create, dispose
  GamePage.tsx       # React browser screen
  # OR GameScreen.tsx for React Native`,
            platform: "shared",
            language: "text",
          },
        ],
      },
      {
        id: "one-api-per-task",
        title: "One API per task",
        paragraphs: [
          "Use exactly these APIs. Each task has one obvious way; alternatives exist only for advanced cases.",
        ],
        table: {
          headers: ["Task", "Use", "Guide"],
          rows: [
            [
              "Create the scene",
              "await warmUpEngine(); new World(capacity) inside a React effect",
              "/engine/world-entities",
            ],
            [
              "Spawn / change / remove",
              "world.spawn(options) → Entity; world.set(entity, options); world.despawn(entity)",
              "/engine/world-entities",
            ],
            [
              "Step the game",
              "world.update(dt) once per frame, only in GameView onUpdate",
              "/engine/game-view",
            ],
            [
              "Move entities every frame",
              "world.transforms.position / rotation / transform, then world.transforms.flush() once after update",
              "/engine/cache-performance",
            ],
            [
              "Rotate",
              "quat.y(angle), quat.x, quat.z, quat.fromEuler, quat.multiply, quat.slerp (pass out in per-frame code)",
              "/engine/world-entities",
            ],
            [
              "Read state per frame",
              "world.position(entity, out), world.raycast(..., out), world.toScreen(p, out)",
              "/engine/cache-performance",
            ],
            [
              "Physics character",
              "physics option; set groundVelocity; world.impulse for jumps",
              "/engine/physics-collisions",
            ],
            [
              "Collisions",
              "world.forEachCollision(fn) right after world.update(dt)",
              "/engine/physics-collisions",
            ],
            [
              "Tap / drag",
              "GameView onTap → world.pick(x, y); onDrag → world.screenToWorld(x, y, plane)",
              "/engine/input-picking",
            ],
            ["Tween", "await world.animate(entity, target, options)", "/engine/animation"],
            [
              "Effects",
              "effects.confetti / sparkle / shatter / splash / sparks / explosion / dust / flash",
              "/engine/particles",
            ],
            [
              "Remove a cleared piece",
              "await effects.pop(world, piece, { scale, color }); world.despawn(piece)",
              "/engine/particles",
            ],
            [
              "Score, lives, clock",
              "world.scoreboard: reset(lives, seconds) for the ready screen, resume() to start, add(points)",
              "/engine/scoreboard-timers",
            ],
            [
              "Delays",
              "world.after(seconds, fn) → id; world.cancelTimer(id); world.cancelTimers() on reset",
              "/engine/scoreboard-timers",
            ],
            [
              "Sound and haptic settings",
              "audio.enabled = settings.enableSounds; haptics.enabled = settings.enableHaptics",
              "/engine/audio-haptics",
            ],
            [
              "Painting and drawing games",
              "DrawingDocument: texture(), input(..., 'document'), strokes(), sample(), coverage()",
              "/engine/drawing",
            ],
            [
              "Tear down",
              "world.dispose() in effect cleanup; check world.isDisposed before spawning after an await",
              "/engine/world-entities",
            ],
          ],
        },
        examples: [
          {
            title: "game.ts",
            description:
              "A complete game template that uses every rule above: ready screen, start, per-frame transforms, tap picking, pop effect, confetti, one result report, reset and dispose. Copy it and replace the rules.",
            code: `import { effects, quat, World, type Camera, type Entity, type MutableQuat } from "@nayan-ui/engine";

export type Status = "ready" | "playing" | "win" | "lose" | "cancel";
export interface HudState { status: Status; score: number; seconds: number; lives: number }
export interface GameResult { status: "win" | "lose" | "cancel"; score: number }

const ROUND_SECONDS = 30;
const LIVES = 3;
const BLUE = [0.3, 0.7, 1] as const;

// Create only after await warmUpEngine(); one game per mounted screen.
export function createGame(onHud: (hud: HudState) => void, onEnd: (result: GameResult) => void) {
  const world = new World(256); // Entities + text letters + particles at the busiest moment.
  const camera: Camera = { eye: [0, 8, 10], target: [0, 0, 0], fov: 0.9 };
  const pieces = new Set<Entity>();
  const turn: MutableQuat = [0, 0, 0, 1]; // Scratch, reused every frame.
  let status: Status = "ready";
  let time = 0;

  const hud = () => onHud({ status, score: world.scoreboard.score,
    seconds: world.scoreboard.shownSeconds, lives: world.scoreboard.lives });

  function finish(result: "win" | "lose" | "cancel") {
    if (world.isDisposed || status !== "playing") return; // Report each run once.
    status = result;
    world.scoreboard.stop();
    world.cancelTimers();
    if (result === "win") {
      effects.confetti(world, { position: [0, 3, 0], colors: [[1, 0.3, 0.3], [1, 0.85, 0.2]],
        size: 0.12, speed: 6, count: 40, lifetime: 1.2, gravity: -6 });
    }
    hud();
    onEnd({ status: result, score: world.scoreboard.score });
  }

  function reset() {
    if (world.isDisposed) return;
    world.cancelTimers();
    for (const piece of pieces) world.despawn(piece);
    pieces.clear();
    world.scoreboard.reset(LIVES, ROUND_SECONDS); // Ready screen: stopped, full countdown.
    status = "ready";
    for (let i = 0; i < 5; i++) {
      pieces.add(world.spawn({ mesh: "roundedBox", position: [i * 1.5 - 3, 0.5, 0], color: BLUE }));
    }
    world.update(0); // Show the new layout without advancing time.
    hud();
  }

  world.scoreboard.handlers = {
    onScore: hud, onSecond: hud, onLives: hud,
    onTimeUp: () => finish("lose"), onLivesOut: () => finish("lose"),
  };
  world.spawn({ mesh: "plane", scale: [20, 1, 20], color: [0.25, 0.3, 0.35], pickable: false });
  reset();

  return {
    world, camera, reset,
    start() {
      if (world.isDisposed || status === "playing") return;
      if (status !== "ready") reset();
      status = "playing";
      world.scoreboard.resume();
      hud();
    },
    stop() { finish("cancel"); },
    update(dt: number) {
      if (world.isDisposed) return;
      world.update(dt); // 1. Step exactly once.
      time += dt;
      let i = 0;
      for (const piece of pieces) { // 2. Queue per-frame moves without allocating.
        quat.y(time + i++, turn);
        world.transforms.rotation(piece, turn[0], turn[1], turn[2], turn[3]);
      }
      world.transforms.flush(); // 3. Flush once, after update.
    },
    tap(x: number, y: number) {
      if (world.isDisposed || status !== "playing") return;
      const hit = world.pick(x, y);
      if (!hit || !pieces.delete(hit.entity)) return;
      const piece = hit.entity;
      world.scoreboard.add(100);
      void effects.pop(world, piece, { scale: 1, color: BLUE }).then(() => world.despawn(piece));
      if (pieces.size === 0) finish("win");
    },
    dispose() {
      finish("cancel"); // An unmounted run is reported as cancelled.
      world.dispose();
    },
  };
}
export type Game = ReturnType<typeof createGame>;`,
            platform: "shared",
            language: "tsx",
          },
          {
            title: "useGame.ts",
            description:
              "The matching hook. Render GameView with source={game.world}, camera={game.camera}, onUpdate={game.update} and onTap={game.tap}, as in the first-game screens.",
            code: `import { useEffect, useRef, useState } from "react";
import { warmUpEngine } from "@nayan-ui/engine";
import { createGame, type Game, type GameResult, type HudState } from "./game";

export function useGame(onEnd: (result: GameResult) => void) {
  const [game, setGame] = useState<Game | null>(null);
  const [hud, setHud] = useState<HudState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const onEndRef = useRef(onEnd);
  useEffect(() => { onEndRef.current = onEnd; }, [onEnd]);
  useEffect(() => {
    let cancelled = false;
    let owned: Game | undefined;
    warmUpEngine().then(() => {
      if (cancelled) return;
      owned = createGame(next => { if (!cancelled) setHud(next); }, result => onEndRef.current(result));
      setGame(owned);
    }).catch((reason: unknown) => {
      if (!cancelled) setError(reason instanceof Error ? reason.message : String(reason));
    });
    return () => {
      cancelled = true;
      owned?.dispose();
    };
  }, []);
  return { game, hud, error };
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "never-do-this",
        title: "Never do this",
        paragraphs: [
          "Each item below is a real bug source. Check the finished code against the whole list.",
        ],
        table: {
          headers: ["Never", "Instead"],
          rows: [
            [
              "Create a World during render, in useMemo or at module scope",
              "Create it in an effect after await warmUpEngine(); dispose it in that effect's cleanup",
            ],
            [
              "Call world.update more than once per frame, or from requestAnimationFrame / setInterval",
              "One world.update(dt) inside GameView onUpdate",
            ],
            [
              "Queue on world.transforms and forget flush()",
              "world.transforms.flush() once at the end of onUpdate, after update",
            ],
            [
              "Store positions or velocities in React state every frame",
              "Keep them in the game factory; push only HUD changes (score, seconds, status) to React",
            ],
            [
              "Use setTimeout / setInterval for gameplay delays",
              "world.after(seconds, fn); cancelTimer / cancelTimers on reset",
            ],
            ["Keep your own disposed flag", "world.isDisposed"],
            [
              "Spawn or fire effects after dispose (they throw)",
              "Check world.isDisposed after an await before spawning; cleanup calls need no guard",
            ],
            [
              "Allocate arrays or objects every frame",
              "Reuse out arguments: position(e, out), raycast(..., out), quat.y(a, out)",
            ],
            ["Write quaternions by hand", "quat.y / quat.x / quat.z / quat.fromEuler"],
            [
              "Build particle layers by hand when an effect exists",
              "effects.*; world.burst only for a custom single layer",
            ],
            [
              "Create meshes (createShape, loadModel, createSolid) per spawn or in onUpdate",
              "Prepare meshes once during setup; mesh ids are never freed (MAX_MESHES = 4096)",
            ],
            [
              "Invent numeric entity IDs or API names",
              "Keep the Entity returned by spawn; check /engine/api-reference",
            ],
            [
              "Report a result more than once",
              "Guard finish() with the current status, as in the template",
            ],
            [
              "Test React Native in Expo Go",
              "Use a development build (bunx expo run:ios / run:android)",
            ],
          ],
        },
        examples: [
          {
            title: "Wrong and right frame loop",
            description:
              "The wrong version allocates, double-steps and never flushes. The right version is the only frame loop a game needs.",
            code: `import { quat, type Entity, type MutableQuat, type World } from "@nayan-ui/engine";

// Wrong: allocates every frame, steps twice and leaves the batch unflushed.
export function wrongFrame(world: World, piece: Entity, angle: number, dt: number) {
  world.update(dt);
  world.set(piece, { rotation: quat.y(angle) }); // New arrays every frame.
  world.transforms.position(piece, 0, 1, 0); // Never flushed: never drawn.
  world.update(dt); // Second step: the game runs at double speed.
}

// Right: one step, reused scratch, one flush.
const turn: MutableQuat = [0, 0, 0, 1];
export function rightFrame(world: World, piece: Entity, angle: number, dt: number) {
  world.update(dt);
  quat.y(angle, turn);
  world.transforms.transform(piece, 0, 1, 0, turn[0], turn[1], turn[2], turn[3]);
  world.transforms.flush();
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "copy-this-contract-into-an-agent-task",
        title: "Copy this contract into an agent task",
        paragraphs: [
          "Replace the bracketed goal and platform. This prompt tells the agent where the shared rules belong and what must be true before considering the game complete.",
        ],
        examples: [
          {
            title: "Implementation prompt",
            description:
              "Paste into the agent's task. It restates the lifecycle rules, the API choices and the acceptance checks.",
            code: `Build [game description] using @nayan-ui/engine for [React / React Native / both].
Read https://www.nayanui.com/engine.json, /engine/agent-guide, /engine/first-game and /engine/api-reference first.

Structure: gameConstants.ts, game.ts (createGame factory, no UI imports), useGame.ts (hook), one screen per host.
Lifecycle:
- await warmUpEngine(), then new World(capacity) inside a React effect; dispose it in the cleanup.
- Cancel late async setup after unmount. Use world.isDisposed, not a custom flag.
- Exactly one world.update(dt) per frame, from GameView onUpdate.
- Per-frame moves: world.transforms.* then world.transforms.flush() once, after update.
- Reuse out arguments and quat out arrays in per-frame code; allocate nothing per frame.
APIs: quat for rotations; effects.* for particles; effects.pop + despawn for cleared pieces;
world.scoreboard (reset(lives, seconds) = ready screen, resume() = start); world.after/cancelTimer for delays;
audio.enabled / haptics.enabled for settings; DrawingDocument for painting.
Rounds: define start, stop, reset and a once-only result report in game.ts. Reset cancels timers,
despawns round actors, clears input and resets the scoreboard. Pause keeps the same world.
Assets: prepare outside onUpdate; never create meshes per spawn; no manual asset caches.
Use URL assets on web and Metro require() on native; CSS styles on web, ViewStyle on native.

Verify: start, input, score, win, lose, stop (cancel), pause/resume, replay and unmount;
typecheck passes; the game surface has a real size; initialization errors are visible.
Do not claim native behavior works unless a native development build was exercised.`,
            platform: "shared",
            language: "text",
          },
        ],
      },
      {
        id: "state-what-each-example-assumes",
        title: "State what each example assumes",
        paragraphs: [
          "For a setup helper, say when it runs and who disposes its world. For an update helper, say whether it already calls world.update and flushes world.transforms. For a collision example, state the actor layers, collider shape and contact handling. For an asset example, show the source format for the selected host.",
          "Use the real Entity returned by spawn when calling set, despawn or animate. A Model is a reusable mesh; it is not a scene object. Reuse loaded models across runs, and create new entities for each run. Match the methods and argument order in the API reference rather than guessing names from another engine.",
        ],
      },
      {
        id: "verify-behavior-as-well-as-types",
        title: "Verify behavior as well as types",
        paragraphs: [
          "Typecheck the shared game code against both hosts when both platforms are requested (for example bunx tsc --noEmit -p . in each app, or the project's own typecheck script). Run the browser version on an HTTP(S) server and confirm WASM and assets load. Use a native development build for React Native. A passing typecheck alone does not prove that picking, camera placement, timing or native linkage works.",
          "For the tutorial, verify a 500-point win after five taps, loss when time reaches zero, no changes while paused, cancellation on Stop, a fresh board on replay and no work after unmount. For another game, write down equally concrete expected results before extending it.",
        ],
        examples: [
          {
            title: "Verification commands",
            description:
              "Run from the app that uses the engine. Replace the scripts with the project's own if it defines them.",
            code: `# Types (each host app)
bunx tsc --noEmit -p .

# React browser: serve over localhost/HTTPS and open the game
bun run dev

# React Native: a development build (Expo Go does not include the engine)
bunx expo run:ios
bunx expo run:android`,
            platform: "shell",
            language: "bash",
          },
        ],
      },
    ],
  },
];
