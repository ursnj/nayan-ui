import type { EngineGuide } from "./types";

export const PracticalGuides: EngineGuide[] = [
  {
    slug: "first-game",
    title: "Build your first game",
    description:
      "Make a complete tap-to-collect game. Clear five green cubes in 15 seconds, earn points, pause, stop and play again. Use the same game code in React and React Native.",
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
          "Save this complete file as tapGame.ts. World stores objects. camera decides where we look. targets remembers which objects can be collected. publish sends small UI updates only when the score, clock or status changes.",
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
  let disposed = false;

  function publish() {
    onChange({ status, score: world.scoreboard.score,
      seconds: status === "ready" ? ROUND_SECONDS : world.scoreboard.shownSeconds,
      remaining: targets.size });
  }
  function finish(result: "win" | "lose" | "cancel") {
    if (disposed || status !== "playing") return;
    status = result; // This guard lets a run finish only once.
    world.scoreboard.stop();
    world.cancelTimers();
    publish();
  }
  function reset() {
    if (disposed) return;
    world.cancelTimers();
    world.scoreboard.stop();
    for (const target of targets) world.despawn(target);
    targets.clear();
    world.scoreboard.reset();
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
      if (disposed || status === "playing") return;
      if (status !== "ready") reset();
      status = "playing";
      world.scoreboard.startCountdown(ROUND_SECONDS);
      publish();
    },
    stop() { finish("cancel"); },
    update(dt: number) {
      if (!disposed) world.update(status === "playing" ? dt : 0);
    },
    tap(x: number, y: number) {
      if (disposed || status !== "playing") return;
      const hit = world.pick(x, y);
      if (!hit || !targets.delete(hit.entity)) return;
      world.despawn(hit.entity);
      world.scoreboard.add(100);
      if (targets.size === 0) finish("win");
      else publish();
    },
    dispose() {
      if (disposed) return;
      finish("cancel");
      disposed = true;
      world.dispose();
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
      "Small, copyable answers to “How do I…?” Each recipe explains where the code belongs, how to connect it, and what should happen.",
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
          "Use this for a non-physics object such as scenery, a pointer or a moving obstacle. Position is measured in world units. Multiplying speed by dt makes movement independent of screen refresh rate. Pass the returned update function to onUpdate.",
        ],
        examples: [
          {
            title: "Move at two units per second",
            code: `import type { World } from "@nayan-ui/engine";
export function addMovingBox(world: World) {
  const box = world.spawn({ mesh: "cube", position: [-4, 1, 0], color: [0.2, 0.7, 1] });
  let x = -4;
  return (dt: number) => {
    x += 2 * dt;
    if (x > 4) x = -4;
    world.set(box, { position: [x, 1, 0] });
    world.update(dt);
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
        title: "Animate a hit and remove an object",
        paragraphs: [
          "Use animate for a short effect rather than manually calculating each intermediate scale. Await completion while the normal frame loop continues. The callback can also finish because a world was disposed, so check the game’s disposal flag before touching it again.",
        ],
        examples: [
          {
            title: "Shrink away safely",
            code: `import type { World, Entity } from "@nayan-ui/engine";
export async function removeWithAnimation(world: World, entity: Entity, isDisposed: () => boolean) {
  await world.animate(entity, { scale: 0.01, color: [1, 1, 1, 0] }, { duration: 0.2 });
  if (isDisposed() || !world.has(entity)) return;
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
          "Use after instead of a wall-clock timeout when the delay should pause with the game. This callback fires after three seconds of World updates. Cancel the timers when resetting a round so an old round cannot spawn objects in the new one.",
        ],
        examples: [
          {
            title: "Delay a spawn",
            code: `import type { World } from "@nayan-ui/engine";
export function scheduleBonus(world: World) {
  world.after(3, () => world.spawn({ mesh: "torus", position: [0, 2, 0], color: [1, 0.8, 0.1] }));
  return () => world.cancelTimers();
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
          "Prepare geometry once after warm-up, then spawn entities using that model. Put the promise at module scope so a replay or remount reuses the mesh. Resetting entities should not rebuild their geometry.",
        ],
        examples: [
          {
            title: "Cache a reusable star",
            code: `import { warmUpEngine, Path, extrude, createShape, type World } from "@nayan-ui/engine";
let starPromise: Promise<ReturnType<typeof createShape>> | undefined;
export function loadStar() {
  return starPromise ??= warmUpEngine().then(() => createShape(
    extrude(new Path().addStar(0, 0, 0.5, 0.22, 5), { depth: 0.15 }), { shine: 0.4 }
  ));
}
export async function addStars(world: World, isDisposed: () => boolean) {
  const star = await loadStar();
  if (isDisposed()) return;
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
    ],
  },
  {
    slug: "agent-guide",
    title: "Engine guide for AI agents",
    description:
      "A compact implementation contract for coding agents: which files to create, which APIs to call, how to share a game across hosts, and how to verify it.",
    sections: [
      {
        id: "read-these-pages-first",
        title: "Read these pages first",
        paragraphs: [
          "Use Build your first game as the working baseline. Use Common game recipes for individual features. Look up exact option names in the public API reference before adding an unfamiliar feature. A compact JSON summary is available at /engine.json for agents that read structured documentation.",
        ],
        table: {
          headers: ["I want to…", "Use this", "Read next"],
          rows: [
            [
              "Read the machine summary",
              "Compact API patterns and platform differences",
              "/engine.json",
            ],
            [
              "Build a working round",
              "Complete shared scene, hook and two platform screens",
              "/engine/first-game",
            ],
            [
              "Add a specific feature",
              "Short setup functions and event/update handlers",
              "/engine/recipes",
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
        title: "Use a small file structure",
        paragraphs: [
          "Keep gameplay in a plain TypeScript scene factory. Return world, camera, update and the input methods the host needs. Define round-level start/reset/stop functions in that factory. React owns loading, error UI, screen controls and cleanup. Use an initialization hook to await warmUpEngine before creating the scene.",
        ],
        table: {
          headers: ["I want to…", "Use this", "Read next"],
          rows: [
            [
              "Create engine data",
              "new World(capacity), world.spawn(options)",
              "/engine/world-entities",
            ],
            ["Move an object", "world.set(entity,{position:[x,y,z]})", "/engine/recipes"],
            [
              "Move a falling character",
              "world.set(entity,{groundVelocity:[x,z]})",
              "/engine/physics-collisions",
            ],
            [
              "Step the game",
              "One world.update(dt) per frame, from GameView.onUpdate",
              "/engine/game-view",
            ],
            [
              "Handle a tap",
              "GameView.onTap → world.pick(x,y) → entity handle",
              "/engine/input-picking",
            ],
            ["Play an effect", "world.animate(entity,target,options)", "/engine/animation"],
            [
              "Manage a round",
              "Application-defined functions; scoreboard and timers are engine helpers",
              "/engine/scoreboard-timers",
            ],
          ],
        },
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
            code: `Build [game description] using @nayan-ui/engine for [React / React Native / both].
Read /engine/first-game, /engine/recipes and /engine/api-reference first.

Create a shared scene factory and a React initialization hook.
Await warmUpEngine() before constructing World or loading assets.
Create one World per mounted scene; dispose it on cleanup.
Cancel late asynchronous initialization after unmount.
Run one world.update(dt) from GameView.onUpdate.
Keep positions/velocities in the scene, not in per-frame React state.
Define start, stop, reset and result handling in the game layer.
Keep the same scene for pause/resume; clear held input when paused.
On reset: clear timers, old actors, input and round flags.
Cache geometry/model/font/sound loading outside the frame loop.
Use URL assets on web and Metro require() assets on native.
Use CSS styles for React and ViewStyle for React Native.
Preserve the same shared TypeScript game code on both platforms.

Verify: start, input, score, win, lose, pause/resume, reset and unmount.
Show an initialization error and give the game surface a real size.
Do not mark native behavior verified unless a native build was exercised.`,
            platform: "shared",
            language: "text",
          },
        ],
      },
      {
        id: "state-what-each-example-assumes",
        title: "State what each example assumes",
        paragraphs: [
          "For a setup helper, say when it runs and who disposes its world. For an update helper, say whether it already calls world.update. For a collision example, state the actor layers, collider shape and contact handling. For an asset example, show the source format for the selected host.",
          "Use the real Entity returned by spawn when calling set, despawn or animate. A Model is a reusable mesh; it is not a scene object. Reuse loaded models across runs, and create new entities for each run. Match the methods and argument order in the API reference rather than guessing names from another engine.",
        ],
      },
      {
        id: "verify-behavior-as-well-as-types",
        title: "Verify behavior as well as types",
        paragraphs: [
          "Compile the shared game code against both host APIs when both platforms are requested. Run the browser version on an HTTP server and verify that WASM and assets load. Use a native development build for React Native. A successful typecheck alone does not prove that picking, camera placement, timing or native linkage works.",
          "For the tutorial, verify a 500-point win after five taps, loss when time reaches zero, no changes while paused, cancellation on Stop, a fresh board on replay and no work after unmount. For another game, write down equally concrete expected results before extending it.",
        ],
      },
    ],
  },
];
