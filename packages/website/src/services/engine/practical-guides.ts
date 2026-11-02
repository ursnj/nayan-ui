import type { EngineGuide } from "./types";

export const PracticalGuides: EngineGuide[] = [
  {
    slug: "first-game",
    title: "Build your first game",
    description: "A complete tap game with a countdown, scoring, pause and replay.",
    sections: [
      {
        id: "what-you-will-build",
        title: "What you will build",
        paragraphs: [
          "Five spinning cubes and a 15-second clock: tap them all to win, run out of time to lose. Built-in shapes only, so there are no assets to download.",
          "Three files: shared rules, a hook that owns the world, and one screen for your host (React or React Native).",
        ],
        examples: [
          {
            title: "Files",
            code: `src/game/
  tapGame.ts         # rules: no React or platform imports
  useTapGame.ts      # owns the world (useWorld)
  TapGamePage.tsx    # React screen
  TapGameScreen.tsx  # or the React Native screen`,
            platform: "shared",
            language: "text",
          },
        ],
      },
      {
        id: "rules",
        title: "1. The rules",
        paragraphs: [
          "createTapGame fills a world and returns the round's actions. The scoreboard keeps score and runs the countdown in Rust: handlers hold the rule (time up loses), listen feeds the UI.",
          "There is no frame loop: GameView steps the world, which spins the cubes and advances the clock.",
        ],
        examples: [
          {
            title: "tapGame.ts",
            code: `import { effects, type Camera, type Entity, type World } from "@nayan-ui/engine";

export type Status = "ready" | "playing" | "win" | "lose" | "cancel";
export interface TapView { status: Status; score: number; seconds: number; left: number }

const ROUND_SECONDS = 15;
const SPOTS = [[-2, 1.5], [0, 1.5], [2, 1.5], [-1, -1], [1, -1]] as const;
const GREEN = "#33D973";
export const camera: Camera = { eye: [0, 0, 12], target: [0, 0, 0], fov: 1, ortho: 5 };

export function createTapGame(world: World, onView: (view: TapView) => void) {
  const targets = new Set<Entity>();
  let status: Status = "ready";
  const publish = () => onView({ status, score: world.scoreboard.score,
    seconds: world.scoreboard.shownSeconds, left: targets.size });

  function finish(result: "win" | "lose" | "cancel") {
    if (status !== "playing") return; // A round ends once.
    status = result;
    world.scoreboard.stop();
    publish();
  }
  function reset() {
    for (const target of targets) world.despawn(target);
    targets.clear();
    for (const [x, y] of SPOTS)
      targets.add(world.spawn({ mesh: "cube", position: [x, y, 0], scale: 0.9, color: GREEN, spin: [0, 0.5, 0] }));
    world.scoreboard.reset(0, ROUND_SECONDS); // Ready screen: full, stopped countdown.
    status = "ready";
    publish();
  }

  world.scoreboard.handlers = { onTimeUp: () => finish("lose") }; // The rule.
  world.scoreboard.listen({ onSecond: publish }); // The UI.
  reset();

  return {
    reset,
    stop: () => finish("cancel"),
    start() {
      if (status === "playing") return;
      if (status !== "ready") reset();
      status = "playing";
      world.scoreboard.resume();
      publish();
    },
    tap(x: number, y: number) {
      const hit = status === "playing" ? world.pick(x, y) : null;
      if (!hit || !targets.delete(hit.entity)) return;
      const piece = hit.entity;
      world.scoreboard.add(100);
      void effects.pop(world, piece, { scale: 0.9, color: GREEN }).then(() => world.despawn(piece));
      if (targets.size === 0) finish("win");
      else publish();
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
        id: "hook",
        title: "2. Own the world",
        paragraphs: [
          "useWorld warms the engine up, creates the world, runs setup and disposes it on unmount (Strict Mode safe). It returns null until ready and reports start-up failures to onError.",
        ],
        examples: [
          {
            title: "useTapGame.ts",
            code: `import { useState } from "react";
import { useWorld } from "@nayan-ui/engine";
import { createTapGame, type TapGame, type TapView } from "./tapGame";

export function useTapGame() {
  const [game, setGame] = useState<TapGame | null>(null);
  const [view, setView] = useState<TapView | null>(null);
  const [error, setError] = useState<string | null>(null);
  const world = useWorld(32, (w) => setGame(createTapGame(w, setView)), [], (e) => setError(e.message));
  return { world, game, view, error };
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "screen",
        title: "3. The screen",
        paragraphs: [
          "The screen holds the HUD, the buttons and GameView. paused suspends stepping and drawing, so the clock freezes; taps are ignored while paused.",
        ],
        examples: [
          {
            title: "TapGamePage.tsx",
            description: "React (Vite or a Next.js client page). The container needs a height.",
            code: `"use client";
import { useState } from "react";
import { GameView } from "@nayan-ui/engine";
import { camera } from "./tapGame";
import { useTapGame } from "./useTapGame";

export default function TapGamePage() {
  const { world, game, view, error } = useTapGame();
  const [paused, setPaused] = useState(false);
  if (error) return <p role="alert">{error}</p>;
  if (!world || !game || !view) return <p>Loading…</p>;
  const playing = view.status === "playing";
  const act = (action: () => void) => () => { setPaused(false); action(); };
  return (
    <main style={{ height: "100dvh", display: "flex", flexDirection: "column" }}>
      <p>{view.status} · Score {view.score} · Time {view.seconds} · Left {view.left}</p>
      <div style={{ display: "flex", gap: 8 }}>
        <button disabled={playing} onClick={act(game.start)}>Start</button>
        <button disabled={!playing} onClick={act(game.stop)}>Stop</button>
        <button disabled={!playing} onClick={() => setPaused((p) => !p)}>{paused ? "Resume" : "Pause"}</button>
        <button onClick={act(game.reset)}>Reset</button>
      </div>
      <GameView source={world} camera={camera} paused={paused}
        onTap={paused ? undefined : game.tap} style={{ flex: 1, minHeight: 0 }} />
    </main>
  );
}`,
            platform: "react",
            language: "tsx",
          },
          {
            title: "TapGameScreen.tsx",
            description: "React Native, in a development build (not Expo Go). Mount it in a flex: 1 parent.",
            code: `import { useState } from "react";
import { Button, Text, View } from "react-native";
import { GameView } from "@nayan-ui/engine";
import { camera } from "./tapGame";
import { useTapGame } from "./useTapGame";

export default function TapGameScreen() {
  const { world, game, view, error } = useTapGame();
  const [paused, setPaused] = useState(false);
  if (error) return <Text accessibilityRole="alert">{error}</Text>;
  if (!world || !game || !view) return <Text>Loading…</Text>;
  const playing = view.status === "playing";
  const act = (action: () => void) => () => { setPaused(false); action(); };
  return (
    <View style={{ flex: 1 }}>
      <Text>{view.status} · Score {view.score} · Time {view.seconds} · Left {view.left}</Text>
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Button title="Start" disabled={playing} onPress={act(game.start)} />
        <Button title="Stop" disabled={!playing} onPress={act(game.stop)} />
        <Button title={paused ? "Resume" : "Pause"} disabled={!playing} onPress={() => setPaused((p) => !p)} />
        <Button title="Reset" onPress={act(game.reset)} />
      </View>
      <GameView source={world} camera={camera} paused={paused}
        onTap={paused ? undefined : game.tap} style={{ flex: 1 }} />
    </View>
  );
}`,
            platform: "native",
            language: "tsx",
          },
        ],
      },
      {
        id: "try-it",
        title: "Try it",
        paragraphs: [
          "Run through the checklist; each line is one expected result. Then change one thing: fewer ROUND_SECONDS, more SPOTS, or confetti in finish('win') (see Recipes).",
        ],
        examples: [
          {
            title: "Checklist",
            code: `[ ] Ready: score 0, time 15, left 5, cubes spinning
[ ] Start, tap two cubes: each pops, score +100
[ ] Pause: time and taps frozen; Resume continues
[ ] Tap all five: status win, score 500
[ ] Start again: five fresh cubes, full clock
[ ] Wait out the clock: status lose
[ ] Stop mid-round: status cancel; Reset: back to ready`,
            platform: "shared",
            language: "text",
          },
        ],
      },
    ],
  },
  {
    slug: "recipes",
    title: "Common game recipes",
    description: "Short, copyable solutions for everyday game tasks.",
    sections: [
      {
        id: "move-without-react-state",
        title: "Move without React state",
        paragraphs: [
          "Queue per-frame moves on world.transforms from onUpdate; they apply in one native call when GameView steps the world. Each recipe returning a function is meant to be called from onUpdate.",
        ],
        examples: [
          {
            title: "Slide a box",
            code: `import type { World } from "@nayan-ui/engine";

export function addSlider(world: World) {
  const box = world.spawn({ mesh: "cube", position: [-4, 1, 0], color: "#33B3FF" });
  let x = -4;
  return (dt: number) => {
    x = x > 4 ? -4 : x + 2 * dt; // 2 units per second
    world.transforms.position(box, x, 1, 0);
  };
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "fall-and-bounce",
        title: "Fall and bounce",
        paragraphs: ["A fixed floor and a dynamic ball: physics handles gravity and the bounce."],
        examples: [
          {
            title: "Bouncing ball",
            code: `import { GameView, useWorld } from "@nayan-ui/engine";

export function Bounce() {
  const world = useWorld(16, (w) => {
    w.spawn({ mesh: "plane", scale: [20, 1, 20], color: "#4C9A4C", physics: "fixed" });
    w.spawn({ mesh: "sphere", position: [0, 5, 0], color: "#FF801A", physics: { type: "dynamic", bounce: 0.7 } });
  });
  return world && <GameView source={world} camera={{ eye: [0, 4, 8], target: [0, 0, 0], fov: 1 }} style={{ flex: 1 }} />;
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "joystick-steering",
        title: "Steer with a joystick",
        paragraphs: [
          "useJoystick returns a mutable state: read it in onUpdate, never mirror it into React state. groundVelocity sets X/Z speed and keeps gravity.",
        ],
        examples: [
          {
            title: "Joystick player",
            code: `import { GameView, Joystick, useJoystick, type Entity, type World } from "@nayan-ui/engine";

export function Steer({ world, player }: { world: World; player: Entity }) {
  const stick = useJoystick();
  return (
    <>
      <GameView source={world} style={{ flex: 1 }}
        onUpdate={() => world.set(player, { groundVelocity: [stick.x * 5, -stick.y * 5] })} />
      <Joystick state={stick} />
    </>
  );
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "grounded-jump",
        title: "Jump only when grounded",
        paragraphs: [
          "Cast a short ray down against the floor's layer and skip the jump while already rising.",
        ],
        examples: [
          {
            title: "Grounded jump",
            code: `import type { Entity, World } from "@nayan-ui/engine";

const at: [number, number, number] = [0, 0, 0];
const vel: [number, number, number] = [0, 0, 0];

// Player: a 1.8-unit capsule; floor on layer 1.
export function jump(world: World, player: Entity) {
  if (!world.position(player, at) || !world.velocity(player, vel) || vel[1] > 0.1) return false;
  if (!world.raycast(at, [0, -1, 0], 1.05, 1)) return false;
  world.impulse(player, [0, 5, 0]);
  return true;
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "sensor-pickup",
        title: "Pick up on contact",
        paragraphs: [
          "A sensor reports contact without pushing. forEachCollision in onUpdate reads the last step's contacts, each once.",
        ],
        examples: [
          {
            title: "Coin pickup",
            code: `import type { Entity, World } from "@nayan-ui/engine";

export function addCoin(world: World, player: Entity) {
  const coin = world.spawn({ mesh: "cylinder", position: [3, 1, 0], scale: [0.6, 0.1, 0.6],
    color: "#FFCC1A", spin: [0, 2, 0], physics: { type: "fixed", sensor: true } });
  return () =>
    world.forEachCollision((a, b, { started }) => {
      if (started && ((a === coin && b === player) || (a === player && b === coin))) {
        world.despawn(coin);
        world.scoreboard.add(100);
      }
    });
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "tap-to-recolor",
        title: "Tap to recolor",
        paragraphs: ["world.pick finds the entity under a tap; no physics body needed."],
        examples: [
          {
            title: "Tap to paint",
            code: `import { GameView, type World } from "@nayan-ui/engine";

export function TapToPaint({ world }: { world: World }) {
  return (
    <GameView source={world} style={{ flex: 1 }}
      onTap={(x, y) => {
        const hit = world.pick(x, y);
        if (hit) world.set(hit.entity, { color: "#FF4D66" });
      }} />
  );
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "chase",
        title: "Chase the player",
        paragraphs: ["Set follow once and the engine steers the chaser along the ground; follow: null stops it."],
        examples: [
          {
            title: "Chaser",
            code: `import type { Entity, World } from "@nayan-ui/engine";

export function addChaser(world: World, player: Entity) {
  const enemy = world.spawn({ mesh: "sphere", position: [5, 1, 5], color: "red", follow: { target: player, speed: 2 } });
  return () => world.set(enemy, { follow: null }); // stop chasing
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "pop-and-remove",
        title: "Pop and remove",
        paragraphs: [
          "effects.pop swells, flashes and shrinks a piece away; despawn when it resolves. No disposal guard is needed: despawn is a no-op on a disposed world.",
        ],
        examples: [
          {
            title: "Clear a piece",
            code: `import { effects, type Entity, type World } from "@nayan-ui/engine";

export async function clearPiece(world: World, piece: Entity) {
  await effects.pop(world, piece, { scale: 1, color: "#FF4D4D" });
  world.despawn(piece);
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "score-in-react-ui",
        title: "Show the score in React",
        paragraphs: [
          "scoreboard.listen adds a UI observer beside the game's handlers and returns its unlisten, so it fits a useEffect. It fires only when the value changes.",
        ],
        examples: [
          {
            title: "useScore",
            code: `import { useEffect, useState } from "react";
import type { World } from "@nayan-ui/engine";

export function useScore(world: World) {
  const [score, setScore] = useState(world.scoreboard.score);
  useEffect(() => world.scoreboard.listen({ onScore: setScore }), [world]);
  return score;
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "game-time-delay",
        title: "Delay in game time",
        paragraphs: [
          "world.after counts game time, so it pauses with the game. Call cancelTimers on reset so an old round can't act in the new one.",
        ],
        examples: [
          {
            title: "Delayed bonus",
            code: `import type { World } from "@nayan-ui/engine";

export function scheduleBonus(world: World) {
  const id = world.after(3, () => world.spawn({ mesh: "torus", position: [0, 2, 0], color: "#FFCC1A" }));
  return () => world.cancelTimer(id);
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "build-model-once",
        title: "Build a model once, spawn it many times",
        paragraphs: [
          "Mesh ids are never freed: build each model once per app (after warm-up, e.g. in useWorld's setup) and reuse it.",
        ],
        examples: [
          {
            title: "Reusable star",
            code: `import { createShape, extrude, Path, type Model, type World } from "@nayan-ui/engine";

let star: Model | undefined;
const starMesh = () => (star ??= createShape(extrude(new Path().addStar(0, 0, 0.5, 0.22, 5), { depth: 0.15 }), { shine: 0.4 }));

export function addStars(world: World) {
  for (let i = 0; i < 5; i++) world.spawn({ mesh: starMesh(), position: [i - 2, 1, 0], color: "#FFCC33" });
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "sound-on-action",
        title: "Sound and haptics on an action",
        paragraphs: [
          "Load the bank once, outside the frame loop (a URL on the web, require(...) on native). Mirror the player's settings onto audio.enabled and haptics.enabled, then play freely.",
        ],
        examples: [
          {
            title: "Pickup feedback",
            code: `import { audio, haptics } from "@nayan-ui/engine";

const sfx = audio.load({ pickup: "/sounds/pickup.wav" }); // native: require("./pickup.wav")

export function applySettings(sounds: boolean, vibration: boolean) {
  audio.enabled = sounds;
  haptics.enabled = vibration;
}
export function onPickup() {
  sfx.play("pickup", { volume: 0.7 });
  haptics.selection();
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "confetti-win",
        title: "Confetti on a win",
        paragraphs: [
          "One call that cleans itself up. Leave room in the world's capacity for the particles (about count).",
        ],
        examples: [
          {
            title: "Confetti",
            code: `import { effects, type World } from "@nayan-ui/engine";

export function celebrate(world: World) {
  effects.confetti(world, { position: [0, 3, 0], colors: ["#FF4D4D", "#FFD933", "#4DB3FF"],
    size: 0.12, speed: 6, count: 40, lifetime: 1.4, gravity: -6 });
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "face-movement",
        title: "Face the movement direction",
        paragraphs: [
          "quat.y builds the heading and quat.slerp eases toward it, both into reused arrays. For a dynamic body, rotate a visual child (parent: player) so physics keeps the body.",
        ],
        examples: [
          {
            title: "Turn toward the stick",
            code: `import { quat, type Entity, type JoystickState, type MutableQuat, type World } from "@nayan-ui/engine";

export function makeFacing(world: World, model: Entity, stick: JoystickState) {
  const facing: MutableQuat = [0, 0, 0, 1];
  const goal: MutableQuat = [0, 0, 0, 1];
  return (dt: number) => {
    if (stick.x || stick.y) quat.y(Math.atan2(stick.x, -stick.y), goal); // front faces +z
    quat.slerp(facing, goal, Math.min(1, dt * 12), facing);
    world.transforms.rotation(model, facing[0], facing[1], facing[2], facing[3]);
  };
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
    description: "Rules, file layout, API choices and a template for coding agents.",
    sections: [
      {
        id: "read-first",
        title: "Read first",
        paragraphs: [
          "Start from /engine.json and the first game; check every name in the API reference. Never guess names from another engine.",
        ],
        table: {
          headers: ["Need", "Page"],
          rows: [
            ["Machine summary", "/engine.json"],
            ["Working baseline", "/game-engine/first-game"],
            ["One feature", "/game-engine/recipes"],
            ["Lifecycle and entities", "/game-engine/world-entities"],
            ["Exact signatures", "/game-engine/api-reference"],
            ["Blank screen, build errors", "/game-engine/troubleshooting"],
          ],
        },
        examples: [
          {
            title: "Fetch the summary",
            code: `curl -s https://www.nayanui.com/engine.json`,
            platform: "shell",
            language: "bash",
          },
        ],
      },
      {
        id: "file-structure",
        title: "File structure",
        paragraphs: [
          "Rules live in plain TypeScript with no UI imports, so one file serves web and native. The hook owns the world; the screen owns layout and GameView.",
        ],
        table: {
          headers: ["File", "Contains", "Never"],
          rows: [
            ["gameConstants.ts", "Tuning, colors, asset sources, loadAssets()", "Worlds or entities"],
            ["game.ts", "createGame(world, …): rules and round actions", "React, DOM, react-native"],
            ["useGame.ts", "useWorld + createGame", "Rules or per-frame state"],
            ["GameScreen.tsx / GamePage.tsx", "HUD, buttons, GameView", "Its own frame loop"],
          ],
        },
        examples: [
          {
            title: "Layout",
            code: `src/game/
  gameConstants.ts
  game.ts
  useGame.ts
  GameScreen.tsx   # React Native (GamePage.tsx on the web)`,
            platform: "shared",
            language: "text",
          },
        ],
      },
      {
        id: "one-api-per-task",
        title: "One API per task",
        paragraphs: ["Each task has one way. Use it."],
        table: {
          headers: ["Task", "Use"],
          rows: [
            ["Own a world", "useWorld(capacity, setup)"],
            ["Game loop", "GameView onUpdate(dt); the world is stepped right after"],
            ["Spawn / change / remove", "world.spawn → Entity; world.set; world.despawn"],
            ["Per-frame moves", "world.transforms.position / rotation / scale / color / transform"],
            ["Rotations", "quat.y / x / z / fromEuler / multiply / slerp, with out"],
            ["Per-frame queries", "world.position(e, out), raycast(…, out), toScreen(p, out)"],
            ["Physics", "physics option, groundVelocity, world.impulse"],
            ["Collisions", "world.forEachCollision in onUpdate"],
            ["Tap / drag", "onTap + world.pick; onDrag + world.screenToWorld"],
            ["Tweens", "await world.animate(e, target, options)"],
            ["Effects", "effects.confetti / sparkle / shatter / splash / sparks / explosion / dust / flash"],
            ["Clear a piece", "await effects.pop(world, e, { scale }); world.despawn(e)"],
            ["Score, lives, clock", "scoreboard.reset(lives, seconds), resume(), add(); handlers = rules, listen = UI"],
            ["Delays", "world.after(s, fn); cancelTimer(id); cancelTimers() on reset"],
            ["Colors", "'#33B3FF' or 0..1 tuples; toColor for numbers"],
            ["Flat boards", "light={frontLight(direction, ambient)}"],
            ["Long setup", "afterNextFrame(fn) slices; ProceduralCache.peek(key)"],
            ["Characters", "loadModel(src).animations; world.playClip / stopClip"],
            ["Settings", "audio.enabled, haptics.enabled"],
            ["Painting", "DrawingDocument + DrawingCanvas"],
            ["No native module", "isEngineAvailable"],
          ],
        },
        examples: [
          {
            title: "The whole loop",
            code: `import { useRef } from "react";
import { GameView, useWorld, type Entity } from "@nayan-ui/engine";

export function Slider() {
  const box = useRef<Entity | null>(null);
  const time = useRef(0);
  const world = useWorld(16, (w) => {
    box.current = w.spawn({ mesh: "roundedBox", position: [0, 1, 0], color: "#33B3FF" });
  });
  if (!world) return null;
  return (
    <GameView source={world} camera={{ eye: [0, 3, 6], target: [0, 1, 0], fov: 1 }} style={{ flex: 1 }}
      onUpdate={(dt) => {
        time.current += dt;
        if (box.current) world.transforms.position(box.current, Math.sin(time.current) * 2, 1, 0);
      }}
      onTap={(x, y) => { if (world.pick(x, y)) world.scoreboard.add(1); }} />
  );
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "never-do",
        title: "Never do",
        paragraphs: ["Each row is a real bug. Check finished code against all of them."],
        table: {
          headers: ["Never", "Instead"],
          rows: [
            ["new World in render, useMemo or module scope", "useWorld(capacity, setup)"],
            ["onUpdate={(dt) => world.update(dt)}", "Nothing: GameView steps the world"],
            ["requestAnimationFrame / setInterval loops", "GameView onUpdate"],
            ["setTimeout for gameplay delays", "world.after"],
            ["Per-frame positions in React state", "world.transforms; push only HUD values"],
            ["Read a position right after queuing a move", "world.transforms.flush() first"],
            ["Allocate arrays per frame", "out arguments, quat(…, out)"],
            ["Hand-written quaternions", "quat"],
            ["Hand-built particle layers", "effects.*"],
            ["Replace scoreboard.handlers for UI", "scoreboard.listen"],
            ["A custom disposed flag", "world.isDisposed"],
            ["spawn / effects after dispose", "Check world.isDisposed after an await"],
            ["Meshes per spawn or per frame", "Build once, reuse (ids are never freed)"],
            ["Culling scenery in JS", "Nothing: Rust culls every frame"],
            ["A long job in one frame", "Slice it with afterNextFrame"],
            ["Reporting a result twice", "Guard finish() with the status"],
            ["Unsupported color names ('pink')", "Hex or rgba strings"],
            ["Testing native in Expo Go", "A development build"],
          ],
        },
        examples: [
          {
            title: "Wrong and right frame",
            code: `import { quat, type Entity, type MutableQuat, type World } from "@nayan-ui/engine";

// Wrong: allocates and steps the world a second time.
export function wrong(world: World, piece: Entity, angle: number, dt: number) {
  world.set(piece, { rotation: quat.y(angle) });
  world.update(dt);
}

// Right: reused scratch, one queued move; GameView steps once after.
const turn: MutableQuat = [0, 0, 0, 1];
export function right(world: World, piece: Entity, angle: number) {
  quat.y(angle, turn);
  world.transforms.rotation(piece, turn[0], turn[1], turn[2], turn[3]);
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "game-template",
        title: "Game template",
        paragraphs: [
          "Copy and replace the rules. It covers a ready screen, start, per-frame moves, taps, lives, pop, confetti, one result per run, replay and cancel on unmount.",
        ],
        examples: [
          {
            title: "game.ts",
            code: `import { effects, quat, type Camera, type Entity, type MutableQuat, type World } from "@nayan-ui/engine";

export type Status = "ready" | "playing" | "win" | "lose" | "cancel";
export interface Hud { status: Status; score: number; seconds: number; lives: number }
export interface Result { status: "win" | "lose" | "cancel"; score: number }

const SECONDS = 30;
const LIVES = 3;
const BLUE = "#4DB3FF";
export const camera: Camera = { eye: [0, 8, 10], target: [0, 0, 0], fov: 0.9 };

export function createGame(world: World, onHud: (hud: Hud) => void, onEnd: (result: Result) => void) {
  const board = world.scoreboard;
  const pieces = new Set<Entity>();
  const turn: MutableQuat = [0, 0, 0, 1]; // Per-frame scratch.
  let status: Status = "ready";
  let time = 0;
  const hud = () => onHud({ status, score: board.score, seconds: board.shownSeconds, lives: board.lives });

  function finish(result: Result["status"]) {
    if (status !== "playing") return; // One result per run.
    status = result;
    board.stop();
    world.cancelTimers();
    if (result === "win") effects.confetti(world, { position: [0, 3, 0], colors: ["#FF4D4D", "#FFD933"],
      size: 0.12, speed: 6, count: 40, lifetime: 1.2, gravity: -6 });
    hud();
    onEnd({ status: result, score: board.score });
  }
  function reset() {
    world.cancelTimers();
    for (const piece of pieces) world.despawn(piece);
    pieces.clear();
    for (let i = 0; i < 5; i++)
      pieces.add(world.spawn({ mesh: "roundedBox", position: [i * 1.5 - 3, 0.5, 0], color: BLUE }));
    board.reset(LIVES, SECONDS); // Ready screen: full, stopped countdown.
    status = "ready";
    hud();
  }

  world.spawn({ mesh: "plane", scale: [20, 1, 20], color: "#404D59", pickable: false });
  board.handlers = { onTimeUp: () => finish("lose"), onLivesOut: () => finish("lose") };
  board.listen({ onScore: hud, onSecond: hud, onLives: hud });
  reset();

  return {
    reset,
    stop: () => finish("cancel"),
    dispose: () => finish("cancel"), // Unmounting mid-run reports a cancel.
    start() {
      if (status === "playing") return;
      if (status !== "ready") reset();
      status = "playing";
      board.resume();
      hud();
    },
    update(dt: number) { // GameView's onUpdate: queue moves only; the world steps after.
      time += dt;
      let i = 0;
      for (const piece of pieces) {
        quat.y(time + i++, turn);
        world.transforms.rotation(piece, turn[0], turn[1], turn[2], turn[3]);
      }
    },
    tap(x: number, y: number) {
      if (status !== "playing") return;
      const hit = world.pick(x, y);
      if (!hit || !pieces.delete(hit.entity)) {
        board.addLives(-1); // A miss costs a life.
        return;
      }
      const piece = hit.entity;
      board.add(100);
      void effects.pop(world, piece, { scale: 1, color: BLUE }).then(() => world.despawn(piece));
      if (pieces.size === 0) finish("win");
    },
  };
}
export type Game = ReturnType<typeof createGame>;`,
            platform: "shared",
            language: "tsx",
          },
          {
            title: "useGame.ts",
            code: `import { useRef, useState } from "react";
import { useWorld } from "@nayan-ui/engine";
import { createGame, type Game, type Hud, type Result } from "./game";

export function useGame(onEnd: (result: Result) => void) {
  const [game, setGame] = useState<Game | null>(null);
  const [hud, setHud] = useState<Hud | null>(null);
  const [error, setError] = useState<string | null>(null);
  const end = useRef(onEnd);
  end.current = onEnd;
  const world = useWorld(256, (w) => { // Capacity: entities + text letters + particles.
    const g = createGame(w, setHud, (result) => end.current(result));
    setGame(g);
    return g.dispose; // Runs before the world is disposed.
  }, [], (e) => setError(e.message));
  return { world, game, hud, error };
}`,
            platform: "shared",
            language: "tsx",
          },
          {
            title: "GameScreen.tsx",
            description: "React Native; on the web swap Text/View/Button for p/div/button.",
            code: `import { Button, Text, View } from "react-native";
import { GameView } from "@nayan-ui/engine";
import { camera, type Result } from "./game";
import { useGame } from "./useGame";

export default function GameScreen({ onEnd }: { onEnd: (result: Result) => void }) {
  const { world, game, hud, error } = useGame(onEnd);
  if (error) return <Text>{error}</Text>;
  if (!world || !game || !hud) return <Text>Loading…</Text>;
  const playing = hud.status === "playing";
  return (
    <View style={{ flex: 1 }}>
      <Text>{hud.status} · {hud.score} · {hud.seconds}s · {hud.lives} lives</Text>
      <Button title={playing ? "Stop" : "Start"} onPress={playing ? game.stop : game.start} />
      <GameView source={world} camera={camera} onUpdate={game.update} onTap={game.tap} style={{ flex: 1 }} />
    </View>
  );
}`,
            platform: "native",
            language: "tsx",
          },
        ],
      },
      {
        id: "agent-prompt",
        title: "Agent prompt",
        paragraphs: ["Paste into a task and fill in the brackets."],
        examples: [
          {
            title: "Prompt",
            code: `Build [game] with @nayan-ui/engine for [React | React Native | both].
Read first: https://www.nayanui.com/engine.json, https://www.nayanui.com/game-engine/agent-guide,
https://www.nayanui.com/game-engine/first-game. Check every API name in /game-engine/api-reference.

Follow the agent-guide template: gameConstants.ts, game.ts (no UI imports), useGame.ts (useWorld), one screen per host.
- GameView steps the world after onUpdate; no other loops, no world.update unless stepping differently.
- Per-frame: world.transforms, out arguments, quat with out; no allocations, no React state.
- scoreboard: reset(lives, seconds) for ready, resume() to start; handlers = rules, listen = UI.
- world.after for delays; effects.* for particles; effects.pop then despawn for cleared pieces.
- CSS hex colors; frontLight for flat boards; audio.enabled / haptics.enabled from settings.
- Build meshes once; slice long setup with afterNextFrame.
- start / stop / reset in game.ts; one result per run; stop and unmount report cancel.

Done when: typecheck passes; start, score, win, lose, stop, pause, replay and unmount behave;
the game view has a real size; errors are visible. Claim native behavior only after a development build ran.`,
            platform: "shared",
            language: "text",
          },
        ],
      },
      {
        id: "verify",
        title: "Verify",
        paragraphs: [
          "Types prove little about picking, cameras or timing: run the game. Web needs localhost or HTTPS; native needs a development build.",
        ],
        examples: [
          {
            title: "Commands",
            code: `bunx tsc --noEmit -p .   # each host app
bun run dev               # web: open the game over localhost
bunx expo run:ios         # native development build
bunx expo run:android`,
            platform: "shell",
            language: "bash",
          },
        ],
      },
    ],
  },
];
