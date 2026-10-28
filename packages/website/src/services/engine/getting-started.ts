import type { EngineGuide } from "./types";

export const GettingStartedGuides: EngineGuide[] = [
  {
    slug: "overview",
    title: "Nayan Engine",
    description:
      "Create objects, draw them, and react to player input. Learn the shared engine API through a complete game and small practical examples.",
    sections: [
      {
        id: "how-the-engine-fits-together",
        title: "How the engine fits together",
        paragraphs: [
          "Think of World as the container for your game objects. spawn adds an object, set changes it, and despawn removes it. Keep the Entity handle returned by spawn so you can change that object later. GameView draws the World and sends player input to your callbacks.",
          "Connect GameView.onUpdate to world.update(dt) once per frame. This makes motion, physics, animations and game-time clocks advance. React handles screen controls and loading; the engine handles the game scene. Both platforms import the same API from @nayan-ui/engine.",
        ],
        table: {
          headers: ["API / option", "Behavior"],
          rows: [
            [
              "World",
              "Fixed-capacity entities, transforms, Rapier physics, animations, particles, timers, scoring and queries.",
            ],
            [
              "GameView",
              "A React component with a platform surface, frame callback, camera, lighting, quality, gestures and an optional engine-rendered overlay.",
            ],
            [
              "Assets",
              "Models, textures, fonts and procedural geometry are registered once and shared across worlds.",
            ],
            [
              "audio / haptics",
              "Sound banks, voices, global preferences, native collision feedback and platform feedback capabilities.",
            ],
          ],
        },
      },
      {
        id: "choose-a-starting-point",
        title: "Choose a starting point",
        paragraphs: [
          "New to the engine? Read Installation, then Build your first game. It gives you every file for a working game on either platform. Already building a game? Open Common Recipes and copy the helper for the task you need. AI agents can start with the AI Agent Guide and /engine.json.",
          "The engine package and @nayan-ui/games are separate libraries. Browser support in the engine does not automatically make the games package, its host navigation, its settings screens or its Metro asset imports browser-compatible.",
        ],
      },
      {
        id: "find-an-example",
        title: "Find an example for your task",
        paragraphs: [
          "Start with a working example, then read the detailed guide when you need more options. Every shared example uses the same game API on React and React Native.",
        ],
        table: {
          headers: ["Task", "Example", "Guide"],
          rows: [
            [
              "Build a complete game",
              "Tap targets, score, countdown, pause and replay",
              "/engine/first-game",
            ],
            [
              "Move a player or add a pickup",
              "Short setup and update functions",
              "/engine/recipes",
            ],
            [
              "Give an AI agent the right context",
              "File structure, exact APIs and acceptance checks",
              "/engine/agent-guide",
            ],
            ["Mount only a minimal scene", "Bouncing-ball React host", "/engine/react"],
            ["Mount a native screen", "Bouncing-ball React Native host", "/engine/react-native"],
            [
              "Look up an option",
              "All public exports and type signatures",
              "/engine/api-reference",
            ],
          ],
        },
      },
      {
        id: "coordinates-values-and-handles",
        title: "Coordinates, values and handles",
        paragraphs: [
          "World coordinates use X right and Y up; ground-based games move on X/Z. Screen callbacks use points on mobile and CSS pixels on web, measured from the top-left with Y down. Camera field of view and angular motion use radians. Rotation is a quaternion [x, y, z, w], with [0, 0, 0, 1] as identity.",
          "Colors are numeric RGB or RGBA tuples. Ordinary channels use 0..1. Entity alpha below one draws transparency; channels above one produce emissive-looking color, with values at two self-lit. Vertex colors, texture colors and entity colors multiply. Models and entities are different: a Model is a reusable mesh, while an Entity belongs to one World.",
        ],
        note: "Keep worlds and loaded asset promises outside React render work. Create entities per run, reuse registered meshes, and dispose each World when its owning screen unmounts.",
      },
      {
        id: "what-is-shared-and-what-changes",
        title: "What is shared and what changes",
        paragraphs: [],
        table: {
          headers: ["API / option", "Behavior"],
          rows: [
            [
              "Imports and gameplay",
              "World, GameView, geometry, physics, animation, picking, timers and scoring share their API.",
            ],
            [
              "Initialization",
              "Await warmUpEngine() before browser worlds/assets and before built-in procedural geometry on either platform. Native warm-up still performs its initial work synchronously.",
            ],
            [
              "Styles",
              "React uses CSSProperties; React Native uses ViewStyle. Give the web container an explicit height or flex layout.",
            ],
            [
              "Assets",
              "Web: URL strings. Native: Metro require(...) numbers or URI strings; configure extra asset extensions.",
            ],
            [
              "Visibility",
              "GameView pauses drawing/updates in hidden browser tabs and inactive/background native apps. Your other subscriptions still need cleanup.",
            ],
            [
              "Feedback",
              "Web audio needs a user gesture and AudioWorklet support; browser vibration cannot reproduce native intensity/sharpness exactly.",
            ],
          ],
        },
      },
    ],
  },
  {
    slug: "installation",
    title: "Installation and platform setup",
    description:
      "Install the engine, select the correct platform entry, prepare native development builds, and serve browser WASM assets correctly.",
    sections: [
      {
        id: "install-the-package",
        title: "Install the package",
        paragraphs: [
          "Use a package release containing the browser build described here. If an older installed version lacks the browser export or WASM file, upgrade to a release containing this implementation or build it from source. Web support added in source is not evidence that a particular npm version has been published.",
        ],
        examples: [
          {
            title: "React project",
            code: `bun add @nayan-ui/engine react react-dom`,
            platform: "react",
            language: "bash",
          },
          {
            title: "React Native / Expo project",
            code: `bun add @nayan-ui/engine
# Expo hosts that load bundled numeric assets:
bun add expo-asset
# Build the installed native code into your development app:
bunx expo run:ios
# Or:
bunx expo run:android`,
            platform: "native",
            language: "bash",
          },
        ],
      },
      {
        id: "exports-and-typescript",
        title: "Exports and TypeScript",
        paragraphs: [
          "Browser bundlers select the browser export. React Native/Metro selects the react-native condition; react-native-strict-api is also supported. The /web subpath explicitly selects the browser build. Browser consumers do not need to install React Native. Keep React and the host renderer on matching versions.",
        ],
        examples: [
          {
            title: "Browser or shared import",
            code: `import { World, GameView, warmUpEngine } from "@nayan-ui/engine";
// Explicit browser-only entry, useful in SSR applications:
import { World as BrowserWorld } from "@nayan-ui/engine/web";`,
            platform: "react",
            language: "tsx",
          },
          {
            title: "Native TypeScript resolver",
            code: `{
  "compilerOptions": {
    "moduleResolution": "bundler",
    "customConditions": ["react-native"],
    "jsx": "react-jsx",
    "strict": true
  }
}`,
            platform: "native",
            language: "json",
          },
        ],
      },
      {
        id: "native-requirements",
        title: "Native requirements",
        paragraphs: [
          "Expo Go does not contain the native Nayan module. Use an Expo development build or a bare React Native application. Reinstall CocoaPods and rebuild the host after native dependency changes. Installing JavaScript alone cannot add the Rust/C++ module to an existing binary.",
          "Metro follows TypeScript workspace links during development. Changes to Rust, C++, platform views or the TurboModule contract require the corresponding core build/codegen and a host app rebuild. A normal consumer uses the package prebuilt platform libraries; Rust is needed when building the core from source.",
        ],
        examples: [
          {
            title: "Metro custom assets",
            code: `const { getDefaultConfig } = require("expo/metro-config");
const config = getDefaultConfig(__dirname);
config.resolver.assetExts = [...new Set([
  ...config.resolver.assetExts, "glb", "gltf", "ttf", "otf", "wav"
])];
module.exports = config;`,
            platform: "native",
            language: "javascript",
          },
        ],
      },
      {
        id: "browser-hosting",
        title: "Browser hosting",
        paragraphs: [
          "Await warmUpEngine() before using synchronous engine APIs. Serve over HTTPS or localhost for WebGPU and AudioWorklet. WebGL2 is the renderer fallback; availability still depends on the browser/device. The current WASM runtime runs on the main thread and does not require cross-origin isolation headers.",
          "Keep index.js, engine_core_bg.wasm and audio-worklet.js together when serving the browser output directly. Vite resolves the static WASM/worklet URLs in its production build. Other bundlers must preserve or emit those URLs; inspect the built Network requests rather than assuming an asset-copy plugin is configured. Serve WASM as application/wasm. A strict CSP must permit your scripts, worklet and WebAssembly execution.",
        ],
        note: "Cross-origin models, textures, fonts and sounds need the remote server to grant CORS. A 200 response containing your HTML fallback is not a valid WASM, image or model response.",
      },
      {
        id: "build-this-monorepo-from-source",
        title: "Build this monorepo from source",
        paragraphs: [
          "Run these commands in the Playtura repository containing packages/engine. They are repository scripts, not commands for an npm consumer or the Nayan UI documentation repository.",
        ],
        examples: [
          {
            title: "Source build commands",
            code: `rustup target add wasm32-unknown-unknown
cargo install wasm-bindgen-cli --locked --version 0.2.129
# macOS: meshoptimizer needs a full LLVM toolchain
brew install llvm lld
bun run engine:build:web
bun run engine:test:web
bun run engine:example web
# Native core changes:
bun run engine:core:build:ios
bun run engine:core:build:android
# After changing the TurboModule contract:
bun run engine:codegen`,
            platform: "shell",
            language: "bash",
          },
        ],
      },
    ],
  },
  {
    slug: "react",
    title: "React browser quickstart",
    description:
      "A complete scene, an initialization hook with cleanup, and a platform host. Tap the bouncing ball to apply an impulse; pause and resume without replacing the world.",
    sections: [
      {
        id: "create-the-shared-scene",
        title: "Create the shared scene",
        paragraphs: [
          "Save this as scene.ts. The factory deliberately does not run at module import or inside the React render function. It creates a world after initialization; every mounted visit gets its own entities. An existing scene is retained through pause/resume.",
        ],
        examples: [
          {
            title: "scene.ts",
            code: `import { World, type Camera } from "@nayan-ui/engine";

// Call after await warmUpEngine(). One scene instance belongs to one mounted visit.
export function createScene() {
  const world = new World(128);
  const ball = world.spawn({
    mesh: "sphere", position: [0, 3, 0], color: [0.2, 0.65, 1],
    physics: { type: "dynamic", bounce: 0.65 },
  });
  world.spawn({
    mesh: "cube", position: [0, -0.5, 0], scale: [16, 1, 16],
    color: [0.25, 0.3, 0.35], physics: "fixed",
  });
  const camera: Camera = { eye: [8, 7, 10], target: [0, 1, 0], fov: 0.9 };
  return {
    world, camera,
    update(dt: number) { world.update(dt); },
    tap(x: number, y: number) {
      if (world.pick(x, y)?.entity === ball) world.impulse(ball, [0, 5, 0]);
    },
    dispose() { world.dispose(); },
  };
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "initialize-and-clean-up-safely",
        title: "Initialize and clean up safely",
        paragraphs: [
          "Save this shared hook as useScene.ts. Initialization is asynchronous on browsers. The cancellation flag prevents a late warm-up from creating a world after unmount; each effect setup owns its own scene, so React development Strict Mode can perform setup/cleanup/setup safely. Do not create a World inside useMemo and then dispose that same instance in an effect that Strict Mode replays.",
        ],
        examples: [
          {
            title: "useScene.ts",
            code: `import { useEffect, useState } from "react";
import { warmUpEngine } from "@nayan-ui/engine";
import { createScene } from "./scene";

type Scene = ReturnType<typeof createScene>;
export function useScene() {
  const [scene, setScene] = useState<Scene | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    let owned: Scene | undefined;
    void (async () => {
      await warmUpEngine();
      if (cancelled) return;
      owned = createScene();
      setScene(owned);
    })().catch((reason: unknown) => {
      if (!cancelled) setError(reason instanceof Error ? reason.message : String(reason));
    });
    return () => { cancelled = true; owned?.dispose(); };
  }, []);
  return { scene, error };
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "mount-the-game",
        title: "Mount the game",
        paragraphs: [
          "Save the host component beside scene.ts and useScene.ts. GameView calls update before rendering; do not add another requestAnimationFrame loop that also steps this world. Container height/flex constraints must leave a nonzero drawing area. React state is used for UI changes rather than for every entity position.",
        ],
        examples: [
          {
            title: "Game.tsx",
            code: `"use client";
import { useState } from "react";
import { GameView } from "@nayan-ui/engine";
import { useScene } from "./useScene";

export default function Game() {
  const { scene, error } = useScene();
  const [paused, setPaused] = useState(false);
  if (error) return <p role="alert">{error}</p>;
  if (!scene) return <p>Loading engine…</p>;
  return <main style={{ height: "100dvh", display: "flex", flexDirection: "column" }}>
    <button onClick={() => setPaused(value => !value)}>{paused ? "Resume" : "Pause"}</button>
    <GameView source={scene.world} camera={scene.camera} paused={paused}
      onUpdate={scene.update} onTap={scene.tap} style={{ flex: 1, minHeight: 0 }}
      onError={error => console.error(error)} />
  </main>;
}`,
            platform: "react",
            language: "tsx",
          },
        ],
      },
      {
        id: "platform-details",
        title: "Platform details",
        paragraphs: [
          'The "use client" directive is needed when this component is used in a Next.js App Router application. It is harmless in Vite. Warm up inside the effect, not during server rendering. The browser entry can be imported by the server, but worlds and surfaces belong on the client.',
          'A Vite application can mount this component with createRoot(document.getElementById("root")!).render(<Game />). Keep React and React DOM versions aligned. The web host uses CSS properties and pointer input; it does not need React Native Web.',
        ],
        note: "A scene replacement should unmount the old GameView and dispose its World. Never pass a disposed source back to GameView. Catch initialization errors so missing native code or WASM loading failures are visible.",
      },
    ],
  },
  {
    slug: "react-native",
    title: "React Native quickstart",
    description:
      "A complete scene, an initialization hook with cleanup, and a platform host. Tap the bouncing ball to apply an impulse; pause and resume without replacing the world.",
    sections: [
      {
        id: "create-the-shared-scene",
        title: "Create the shared scene",
        paragraphs: [
          "Save this as scene.ts. The factory deliberately does not run at module import or inside the React render function. It creates a world after initialization; every mounted visit gets its own entities. An existing scene is retained through pause/resume.",
        ],
        examples: [
          {
            title: "scene.ts",
            code: `import { World, type Camera } from "@nayan-ui/engine";

// Call after await warmUpEngine(). One scene instance belongs to one mounted visit.
export function createScene() {
  const world = new World(128);
  const ball = world.spawn({
    mesh: "sphere", position: [0, 3, 0], color: [0.2, 0.65, 1],
    physics: { type: "dynamic", bounce: 0.65 },
  });
  world.spawn({
    mesh: "cube", position: [0, -0.5, 0], scale: [16, 1, 16],
    color: [0.25, 0.3, 0.35], physics: "fixed",
  });
  const camera: Camera = { eye: [8, 7, 10], target: [0, 1, 0], fov: 0.9 };
  return {
    world, camera,
    update(dt: number) { world.update(dt); },
    tap(x: number, y: number) {
      if (world.pick(x, y)?.entity === ball) world.impulse(ball, [0, 5, 0]);
    },
    dispose() { world.dispose(); },
  };
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "initialize-and-clean-up-safely",
        title: "Initialize and clean up safely",
        paragraphs: [
          "Save this shared hook as useScene.ts. Initialization is asynchronous on browsers. The cancellation flag prevents a late warm-up from creating a world after unmount; each effect setup owns its own scene, so React development Strict Mode can perform setup/cleanup/setup safely. Do not create a World inside useMemo and then dispose that same instance in an effect that Strict Mode replays.",
        ],
        examples: [
          {
            title: "useScene.ts",
            code: `import { useEffect, useState } from "react";
import { warmUpEngine } from "@nayan-ui/engine";
import { createScene } from "./scene";

type Scene = ReturnType<typeof createScene>;
export function useScene() {
  const [scene, setScene] = useState<Scene | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    let owned: Scene | undefined;
    void (async () => {
      await warmUpEngine();
      if (cancelled) return;
      owned = createScene();
      setScene(owned);
    })().catch((reason: unknown) => {
      if (!cancelled) setError(reason instanceof Error ? reason.message : String(reason));
    });
    return () => { cancelled = true; owned?.dispose(); };
  }, []);
  return { scene, error };
}`,
            platform: "shared",
            language: "tsx",
          },
        ],
      },
      {
        id: "mount-the-game",
        title: "Mount the game",
        paragraphs: [
          "Save the host component beside scene.ts and useScene.ts. GameView calls update before rendering; do not add another requestAnimationFrame loop that also steps this world. Container height/flex constraints must leave a nonzero drawing area. React state is used for UI changes rather than for every entity position.",
        ],
        examples: [
          {
            title: "GameScreen.tsx",
            code: `import { useState } from "react";
import { Button, Text, View } from "react-native";
import { GameView } from "@nayan-ui/engine";
import { useScene } from "./useScene";

export default function GameScreen() {
  const { scene, error } = useScene();
  const [paused, setPaused] = useState(false);
  if (error) return <Text accessibilityRole="alert">{error}</Text>;
  if (!scene) return <Text>Loading engine…</Text>;
  return <View style={{ flex: 1 }}>
    <Button title={paused ? "Resume" : "Pause"} onPress={() => setPaused(value => !value)} />
    <GameView source={scene.world} camera={scene.camera} paused={paused}
      onUpdate={scene.update} onTap={scene.tap} style={{ flex: 1 }}
      onError={error => console.error(error)} />
  </View>;
}`,
            platform: "native",
            language: "tsx",
          },
        ],
      },
      {
        id: "platform-details",
        title: "Platform details",
        paragraphs: [
          "Mount this screen inside a container with flex: 1 and use a development build containing the native module. Expo Go cannot run it. Native GameView style is a ViewStyle, not DOM CSS.",
          "GameView handles AppState suspension. Navigation libraries may keep an unfocused screen mounted; pass paused={true} when it loses focus. Application-owned held input, network subscriptions and game-specific audio loops still require explicit cleanup.",
        ],
        note: "A scene replacement should unmount the old GameView and dispose its World. Never pass a disposed source back to GameView. Catch initialization errors so missing native code or WASM loading failures are visible.",
      },
    ],
  },
];
