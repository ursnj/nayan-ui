import type { EngineGuide } from "./types";

const sceneTs = `import type { Camera, World } from "@nayan-ui/engine";

export const camera: Camera = { eye: [8, 7, 10], target: [0, 1, 0], fov: 0.9 };

export function setupScene(world: World) {
  world.spawn({ mesh: "cube", position: [0, -0.5, 0], scale: [16, 1, 16], color: "#404D59", physics: "fixed" });
  world.spawn({ mesh: "sphere", position: [0, 3, 0], color: "#33A6FF", physics: { type: "dynamic", bounce: 0.65 } });
}

/** Tapping the ball bounces it. */
export function tapScene(world: World, x: number, y: number) {
  const hit = world.pick(x, y);
  if (hit) world.impulse(hit.entity, [0, 5, 0]);
}`;

export const GettingStartedGuides: EngineGuide[] = [
  {
    slug: "overview",
    title: "Nayan Engine",
    description: "A 3D game engine for React and React Native on one Rust core.",
    sections: [
      {
        id: "what-it-is",
        title: "What the engine is",
        paragraphs: [
          "@nayan-ui/engine is one TypeScript API for games on iOS, Android and the web. Rendering (wgpu), physics (Rapier), animation, particles, audio and drawing run in Rust: natively on phones, as WebAssembly in the browser.",
          "useWorld creates a world and GameView draws and steps it, so this is a complete scene on every platform.",
        ],
        examples: [
          {
            title: "BouncingBall.tsx",
            platform: "shared",
            language: "tsx",
            code: `import { GameView, useWorld } from "@nayan-ui/engine";

export function BouncingBall() {
  const world = useWorld(100, (w) => {
    w.spawn({ mesh: "plane", scale: [20, 1, 20], color: "#4C9A4C", physics: "fixed" });
    w.spawn({ mesh: "sphere", position: [0, 5, 0], color: "#3399FF", physics: { type: "dynamic", bounce: 0.6 } });
  });
  return world && <GameView source={world} camera={{ eye: [0, 4, 8], target: [0, 0, 0], fov: 1 }} style={{ flex: 1 }} />;
}`,
          },
        ],
      },
      {
        id: "core-pieces",
        title: "The core pieces",
        paragraphs: [
          "Everything is imported from @nayan-ui/engine, and each piece has its own guide.",
        ],
        table: {
          headers: ["Piece", "What it does", "Guide"],
          rows: [
            [
              "World / useWorld",
              "Entities, physics, animation, timers and scoring",
              "/game-engine/world-entities",
            ],
            [
              "GameView",
              "Draws a world, steps it each frame, forwards touch input",
              "/game-engine/game-view",
            ],
            [
              "loadModel / loadTexture / loadFont",
              "glTF models, images and fonts, decoded off the JS thread",
              "/game-engine/models-textures",
            ],
            [
              "createShape, lathe, tube, loft…",
              "Meshes built in code, baked once and reused",
              "/game-engine/procedural-geometry",
            ],
            [
              "effects",
              "Confetti, sparkle, shatter, splash, sparks, explosion, dust, flash, pop",
              "/game-engine/particles",
            ],
            [
              "audio / haptics",
              "Sounds mixed in Rust; vibration feedback",
              "/game-engine/audio-haptics",
            ],
            [
              "DrawingDocument / DrawingCanvas",
              "2D painting, also usable as a game texture",
              "/game-engine/drawing",
            ],
          ],
        },
        examples: [
          {
            title: "crate.ts",
            description:
              "Call from useWorld's setup and pass the returned function to GameView's onTap.",
            platform: "shared",
            language: "tsx",
            code: `import { audio, effects, haptics, loadTexture, type AssetSource, type World } from "@nayan-ui/engine";

export function addCrate(world: World, image: AssetSource, crack: AssetSource) {
  const sfx = audio.load({ crack });
  const crate = world.spawn({ mesh: "cube", position: [0, 0.5, 0], color: "#C8763A" });
  void loadTexture(image).then((texture) => world.set(crate, { texture }));
  return (x: number, y: number) => {
    if (world.pick(x, y)?.entity !== crate) return;
    world.despawn(crate);
    effects.shatter(world, { position: [0, 0.5, 0], colors: "#C8763A", size: 0.15, speed: 4, count: 24, lifetime: 0.8, gravity: -9 });
    sfx.play("crack");
    haptics.impact(0.6);
  };
}`,
          },
        ],
      },
      {
        id: "coordinates-colors-handles",
        title: "Coordinates, colors and handles",
        paragraphs: [
          "Y is up and ground games move on X/Z; angles are radians and rotations are quaternions from quat.y(angle) and friends. Screen callbacks use points (CSS pixels on the web) from the view's top-left.",
          "Colors are CSS strings ('#33B3FF', 'rgba(0, 0, 0, 0.5)', or black, white, gray, red, green, blue, yellow, orange, purple, transparent) or 0..1 tuples, where channels above 1 glow. spawn returns an Entity handle: change it with set, remove it with despawn.",
        ],
        examples: [
          {
            title: "marker.ts",
            platform: "shared",
            language: "tsx",
            code: `import { quat, type World } from "@nayan-ui/engine";

export function placeMarker(world: World) {
  const marker = world.spawn({ mesh: "cone", position: [2, 0.5, -3], color: "#33B3FF" });
  world.set(marker, { rotation: quat.y(Math.PI / 2), color: [1.6, 0.4, 0.2] }); // a quarter turn, glowing orange
  return () => world.despawn(marker);
}`,
          },
        ],
      },
      {
        id: "how-frames-work",
        title: "How frames work",
        paragraphs: [
          "On iOS and Android the display's clock asks for each frame: onUpdate(dt) runs your rules, then a native render thread culls and draws, so JavaScript never waits on the GPU. On the web, requestAnimationFrame drives the same loop.",
          "GameView steps the world right after onUpdate, so don't run your own loop. Drawing stops in the background and in hidden tabs; spread long setup work over frames with afterNextFrame.",
        ],
        examples: [
          {
            title: "Orbit.tsx",
            platform: "shared",
            language: "tsx",
            code: `import { useRef } from "react";
import { GameView, useWorld, type Camera } from "@nayan-ui/engine";

export function Orbit() {
  const world = useWorld(16, (w) => {
    w.spawn({ mesh: "torus", color: "#FFBF33" });
  });
  const camera = useRef<Camera>({ eye: [0, 3, 8], target: [0, 0, 0], fov: 1 }).current;
  const time = useRef(0);
  const onUpdate = (dt: number) => {
    time.current += dt; // GameView steps the world after this returns
    camera.eye[0] = Math.sin(time.current) * 8;
    camera.eye[2] = Math.cos(time.current) * 8;
  };
  return world && <GameView source={world} camera={camera} onUpdate={onUpdate} style={{ flex: 1 }} />;
}`,
          },
        ],
      },
      {
        id: "react-and-react-native",
        title: "React and React Native",
        paragraphs: [
          "Game code is identical on both hosts. Only the container, its style and asset sources change.",
        ],
        table: {
          headers: ["", "React (web)", "React Native"],
          rows: [
            [
              "Renders with",
              "WebAssembly + WebGPU, WebGL2 fallback",
              "Metal (iOS), Vulkan or GLES (Android)",
            ],
            ["Frame clock", "requestAnimationFrame", "Display clock + native render thread"],
            ["style", "CSS properties; the container needs a height", "ViewStyle"],
            ["Assets", "URL strings", "require(...) or URI strings"],
            ["Audio", "Starts after the first user gesture", "Ready at once"],
            ["Haptics", "Browser vibration where supported", "Native intensity and sharpness"],
            [
              "Runs in",
              "A modern browser over HTTPS or localhost",
              "A development or store build, not Expo Go",
            ],
          ],
        },
        examples: [
          {
            title: "Board.tsx",
            platform: "react",
            language: "tsx",
            code: `import { GameView, loadTexture, useWorld } from "@nayan-ui/engine";

export function Board() {
  const world = useWorld(16, (w) => {
    const board = w.spawn({ mesh: "plane", scale: [8, 1, 8] });
    void loadTexture("/textures/board.png").then((texture) => w.set(board, { texture }));
  });
  return <div style={{ height: 480 }}>{world && <GameView source={world} style={{ height: "100%" }} />}</div>;
}`,
          },
          {
            title: "Board.tsx",
            platform: "native",
            language: "tsx",
            code: `import { View } from "react-native";
import { GameView, loadTexture, useWorld } from "@nayan-ui/engine";

export function Board() {
  const world = useWorld(16, (w) => {
    const board = w.spawn({ mesh: "plane", scale: [8, 1, 8] });
    void loadTexture(require("./board.png")).then((texture) => w.set(board, { texture }));
  });
  return <View style={{ flex: 1 }}>{world && <GameView source={world} style={{ flex: 1 }} />}</View>;
}`,
          },
        ],
      },
    ],
  },
  {
    slug: "installation",
    title: "Installation and platform setup",
    description: "Install the package and set up Expo, bare React Native or a browser host.",
    sections: [
      {
        id: "install-the-package",
        title: "Install the package",
        paragraphs: [
          "One package serves both hosts; react is a peer dependency, plus react-native for apps. expo-asset is optional and only needed to load require(...) files in Expo.",
        ],
        examples: [
          {
            title: "React (web)",
            platform: "react",
            language: "bash",
            code: `npm install @nayan-ui/engine react react-dom`,
          },
          {
            title: "React Native (Expo)",
            platform: "native",
            language: "bash",
            code: `npm install @nayan-ui/engine
npx expo install expo-asset expo-build-properties`,
          },
        ],
      },
      {
        id: "expo-metro",
        title: "Expo: bundle 3D models",
        paragraphs: [
          "Metro doesn't bundle glTF files by default. Add glb and gltf to its asset extensions in metro.config.js.",
        ],
        examples: [
          {
            title: "metro.config.js",
            platform: "native",
            language: "javascript",
            code: `const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push("glb", "gltf");
module.exports = config;`,
          },
        ],
      },
      {
        id: "expo-android",
        title: "Expo: Android settings",
        paragraphs: [
          "Android needs minSdkVersion 26 (Android 8.0), set through expo-build-properties. Haptics need the VIBRATE permission.",
        ],
        examples: [
          {
            title: "app.json",
            platform: "native",
            language: "json",
            code: `{
  "expo": {
    "android": { "permissions": ["android.permission.VIBRATE"] },
    "plugins": [["expo-build-properties", { "android": { "minSdkVersion": 26 } }]]
  }
}`,
          },
        ],
      },
      {
        id: "development-build",
        title: "Make a development build",
        paragraphs: [
          "The engine is native code, so it runs in a development or store build; Expo Go doesn't include it. Prebuilt libraries ship in the package, so no Rust toolchain is needed, but rebuild the app after installing or upgrading the engine.",
        ],
        examples: [
          {
            title: "Build and run",
            platform: "native",
            language: "bash",
            code: `npx expo run:ios
npx expo run:android
# or in the cloud:
eas build --profile development`,
          },
        ],
      },
      {
        id: "bare-react-native",
        title: "Bare React Native",
        paragraphs: [
          "Bare apps autolink the module. Install the pods, set minSdkVersion 26 in Gradle and add the VIBRATE permission.",
        ],
        examples: [
          {
            title: "Bare setup",
            platform: "native",
            language: "bash",
            code: `npm install @nayan-ui/engine
cd ios && pod install && cd ..
# android/build.gradle:            minSdkVersion = 26
# android/app/src/main/AndroidManifest.xml:
#   <uses-permission android:name="android.permission.VIBRATE" />`,
          },
        ],
      },
      {
        id: "availability-guard",
        title: "Guard builds without the engine",
        paragraphs: [
          "isEngineAvailable is false when the native module isn't in the build, as in Expo Go or a build made before installing. Check it before opening a game screen; useWorld also reports it through onError.",
        ],
        examples: [
          {
            title: "EngineGate.tsx",
            platform: "native",
            language: "tsx",
            code: `import type { ReactNode } from "react";
import { Text } from "react-native";
import { isEngineAvailable } from "@nayan-ui/engine";

export function EngineGate({ children }: { children: ReactNode }) {
  if (!isEngineAvailable) return <Text>This screen needs a development build.</Text>;
  return <>{children}</>;
}`,
          },
        ],
      },
      {
        id: "typescript-and-exports",
        title: "TypeScript and exports",
        paragraphs: [
          "Types ship with the package. Bundlers pick the build by export condition: browser for the web, react-native (or react-native-strict-api) for Metro, so web apps never install React Native.",
          "Import @nayan-ui/engine/web to force the browser build, for example in server-rendered code. TypeScript follows the same conditions with moduleResolution bundler.",
        ],
        examples: [
          {
            title: "tsconfig.json",
            description: "For a React Native app; web apps leave out customConditions.",
            platform: "native",
            language: "json",
            code: `{
  "compilerOptions": {
    "strict": true,
    "jsx": "react-jsx",
    "moduleResolution": "bundler",
    "customConditions": ["react-native"]
  }
}`,
          },
        ],
      },
      {
        id: "browser-hosting",
        title: "Browser hosting",
        paragraphs: [
          "Serve the page over HTTPS or localhost so WebGPU and AudioWorklet are available; WebGL2 is the fallback, and no cross-origin isolation headers are needed. useWorld loads the WebAssembly core; if you create worlds yourself, await warmUpEngine() first.",
          "Keep index.js, engine_core_bg.wasm and audio-worklet.js together (Vite emits them for you) and serve the wasm as application/wasm. Assets on another origin need CORS, and a strict CSP must allow WebAssembly.",
        ],
        examples: [
          {
            title: "Check the wasm response",
            description: "Use the wasm URL from the browser's Network tab.",
            platform: "shell",
            language: "bash",
            code: `curl -sI https://your-site.example/assets/engine_core_bg.wasm | grep -i content-type
# content-type: application/wasm   (not text/html from a fallback page)`,
          },
        ],
      },
      {
        id: "build-from-source",
        title: "Build from source",
        paragraphs: [
          "Only needed to change the engine itself. Run these in the Playtura repository that contains packages/engine.",
        ],
        examples: [
          {
            title: "Source build commands",
            platform: "shell",
            language: "bash",
            code: `rustup target add wasm32-unknown-unknown
cargo install wasm-bindgen-cli --locked --version 0.2.129
brew install llvm lld              # macOS: meshoptimizer needs a full LLVM
bun run engine:build:web
bun run engine:test:web
bun run engine:example web
bun run engine:core:build:ios      # after Rust changes
bun run engine:core:build:android
bun run engine:codegen             # after changing the TurboModule spec`,
          },
        ],
      },
    ],
  },
  {
    slug: "react",
    title: "React browser quickstart",
    description: "Mount a scene in a React web app.",
    sections: [
      {
        id: "write-the-scene",
        title: "Write the scene",
        paragraphs: [
          "Keep the scene in plain functions so React only mounts it. useWorld calls setupScene once with a fresh world after the engine loads, and builds a new one when its deps change.",
        ],
        examples: [{ title: "scene.ts", platform: "shared", language: "tsx", code: sceneTs }],
      },
      {
        id: "mount-it",
        title: "Mount it",
        paragraphs: [
          "useWorld returns null until the world is ready and passes start-up failures, such as the WebAssembly failing to load, to onError. GameView needs a container with a real height; paused stops updates and drawing but keeps the world.",
        ],
        examples: [
          {
            title: "Game.tsx",
            platform: "react",
            language: "tsx",
            code: `"use client";
import { useState } from "react";
import { GameView, useWorld } from "@nayan-ui/engine";
import { camera, setupScene, tapScene } from "./scene";

export default function Game() {
  const [error, setError] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const world = useWorld(64, setupScene, [], (reason) => setError(reason.message));
  if (error) return <p role="alert">{error}</p>;
  if (!world) return <p>Loading…</p>;
  return (
    <main style={{ height: "100dvh", display: "flex", flexDirection: "column" }}>
      <button onClick={() => setPaused((value) => !value)}>{paused ? "Resume" : "Pause"}</button>
      <GameView source={world} camera={camera} paused={paused} style={{ flex: 1, minHeight: 0 }}
        onTap={(x, y) => tapScene(world, x, y)} onError={(reason) => setError(reason.message)} />
    </main>
  );
}`,
          },
        ],
      },
      {
        id: "nextjs-and-vite",
        title: "Next.js and Vite",
        paragraphs: [
          'In the Next.js App Router, mark the screen "use client" and load it with dynamic(..., { ssr: false }) so worlds are only created in the browser. In Vite, mount it with createRoot(root).render(<Game />); React Native Web isn\'t needed.',
        ],
        examples: [
          {
            title: "page.tsx",
            platform: "react",
            language: "tsx",
            code: `"use client";
import dynamic from "next/dynamic";

const Game = dynamic(() => import("./Game"), { ssr: false });

export default function GamePage() {
  return <Game />;
}`,
          },
        ],
      },
    ],
  },
  {
    slug: "react-native",
    title: "React Native quickstart",
    description: "Mount a scene in a React Native development build.",
    sections: [
      {
        id: "write-the-scene",
        title: "Write the scene",
        paragraphs: [
          "Keep the scene in plain functions so React only mounts it. useWorld calls setupScene once with a fresh world after the engine loads, and builds a new one when its deps change.",
        ],
        examples: [{ title: "scene.ts", platform: "shared", language: "tsx", code: sceneTs }],
      },
      {
        id: "mount-it",
        title: "Mount it",
        paragraphs: [
          "useWorld returns null until the world is ready and passes start-up failures to onError, such as a missing native module in Expo Go. paused stops updates and drawing but keeps the world.",
        ],
        examples: [
          {
            title: "GameScreen.tsx",
            platform: "native",
            language: "tsx",
            code: `import { useState } from "react";
import { Button, Text, View } from "react-native";
import { GameView, useWorld } from "@nayan-ui/engine";
import { camera, setupScene, tapScene } from "./scene";

export default function GameScreen() {
  const [error, setError] = useState<string | null>(null);
  const [paused, setPaused] = useState(false);
  const world = useWorld(64, setupScene, [], (reason) => setError(reason.message));
  if (error) return <Text accessibilityRole="alert">{error}</Text>;
  if (!world) return <Text>Loading…</Text>;
  return (
    <View style={{ flex: 1 }}>
      <Button title={paused ? "Resume" : "Pause"} onPress={() => setPaused((value) => !value)} />
      <GameView source={world} camera={camera} paused={paused} style={{ flex: 1 }}
        onTap={(x, y) => tapScene(world, x, y)} onError={(reason) => setError(reason.message)} />
    </View>
  );
}`,
          },
        ],
      },
      {
        id: "pause-on-blur",
        title: "Pause when the screen loses focus",
        paragraphs: [
          "GameView already pauses while the app is in the background. Navigators keep unfocused screens mounted, so pass paused={!focused} from your navigator's focus hook.",
        ],
        examples: [
          {
            title: "FocusAwareGame.tsx",
            platform: "native",
            language: "tsx",
            code: `import { GameView, type World } from "@nayan-ui/engine";
import { camera, tapScene } from "./scene";

/** \`focused\` comes from your navigator, e.g. useIsFocused() from @react-navigation/native. */
export function FocusAwareGame({ world, focused }: { world: World; focused: boolean }) {
  return (
    <GameView source={world} camera={camera} paused={!focused} style={{ flex: 1 }}
      onTap={(x, y) => tapScene(world, x, y)} />
  );
}`,
          },
        ],
      },
    ],
  },
];
