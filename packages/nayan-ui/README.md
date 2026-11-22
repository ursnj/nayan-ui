# nayan-ui

[![npm](https://img.shields.io/npm/v/nayan-ui?label=npm)](https://www.npmjs.com/package/nayan-ui) [![license](https://img.shields.io/npm/l/nayan-ui)](#license)

A shared engine for **React** and **React Native** with 3D games, Rust-rendered
components, 2D drawing, Markdown and application services in one npm package.
Import the public modules you use and select which Rust features your app
compiles. iOS, Android and WebAssembly share the Rust runtime and use platform
adapters for text editing, accessibility, permissions and OS services.

**[Documentation](https://www.nayanui.com/game-engine)** · **[First game tutorial](https://www.nayanui.com/game-engine/first-game)** · **[API reference](https://www.nayanui.com/game-engine/api-reference)** · **[Guide for AI agents](https://www.nayanui.com/game-engine/agent-guide)** · **[Prebuilt games](https://www.nayanui.com/games)**

## Contents

- **Start here** · [Platforms](#platforms) · [Install](#install) · [Quick start](#quick-start)
- **Choose features** · [Package entry points](#package-entry-points) · [Compiled Rust features](#selecting-compiled-rust-features) · [Initialization](#initialization)
- **Games and drawing** · [World basics](#core-concepts) · [Game guides](#guides) · [Performance](#performance) · [Drawing](#drawing)
- **Components** · [Component overview](#rust-components-experimental) · [Theming](#application-theming) · [Forms](#forms-and-keyboard) · [Lists](#virtualized-lists) · [Safe areas](#safe-areas) · [Drawer](#drawer) · [Dialogs and sheets](#sheets-dialogs-and-confirmations)
- **Styling and content** · [Tailwind utilities](#tailwind-style-customization-in-rust) · [Web stylesheet compiler](#compiling-website-classes-without-tailwind) · [Responsive layouts](#responsive-layout-contract) · [Fonts](#unicode-and-fonts) · [Icons](#icons) · [Markdown](#markdown-and-json-frontmatter) · [Accessibility](#accessibility-and-platform-integration)
- **Application services** · [Module reference](#shared-modules) · [Assets](#asset-loading) · [Files](#private-files) · [Storage](#application-storage) · [SQLite](#sqlite) · [Network](#connectivity) · [Permissions](#permissions) · [Location](#location) · [Audio](#audio-playback) · [Video](#video)
- **Packaging and help** · [Bundle and binary size](#bundle-and-binary-size) · [Development and verification](#development-and-verification) · [Troubleshooting](#troubleshooting) · [Prebuilt games](#prebuilt-games) · [Learn more](#learn-more)

## Features

- **Native speed on phones.** Rendering, physics, animation, culling and audio mixing run in Rust. On iOS and Android the game loop follows the display's clock, and frames are drawn on the engine's own render thread, so your JavaScript never waits on the GPU.
- **Small API.** `useWorld` + `GameView` is a complete scene. Spawn entities, move them, animate them: the engine steps, draws and cleans up.
- **Fast loading.** Images, glTF models, fonts and sounds decode on native background threads, and procedural meshes can be cached on disk between launches.
- **Same code on the web.** The core compiles to WebAssembly and draws with WebGPU, falling back to WebGL2.
- **Shared application UI.** Nayan Components provide Rust-owned widget behavior and layout, native text editors, accessibility bridges, responsive classes, images, patterns, sheets, lists and a root theme controller.
- **Application services.** Files, storage, SQLite, connectivity, permissions, location and media have dedicated public modules.
- **Independent JavaScript imports.** Components, games, drawing, icons, Markdown and the Node/Bun stylesheet compiler have separate entry points. [Bundle and binary size](#bundle-and-binary-size)

### Platforms

| Platform    | Renders with                   | Needs                                                     |
| ----------- | ------------------------------ | --------------------------------------------------------- |
| iOS         | Metal                          | A development or store build (Expo Go doesn't include it) |
| Android     | Vulkan or OpenGL ES            | `minSdkVersion` 26, a development or store build          |
| Web (React) | WebAssembly + WebGPU or WebGL2 | A modern browser over HTTPS or localhost                  |

## Install

```sh
bun add nayan-ui
```

Peer dependencies: `react`, plus `react-native` for native apps. Rust UI surfaces also
need `react-reconciler@^0.34.0` with a compatible React version (the current UI build uses
React 19.3). Install `lightningcss` as a development dependency when using the default CSS lowering in `/styles`.
The latter two peers are optional for consumers that do not use those features.
Bundled files load through the engine; no Expo asset or font peer is required.

### React Native (Expo)

1. If your app bundles glTF models, add their extensions in `metro.config.js`.

   ```js
   config.resolver.assetExts.push('glb', 'gltf');
   ```

2. Target Android 8.0 (API 26) or newer. Set `minSdkVersion` through
   `expo-build-properties` when the host needs an override.

   ```json
   {
     "expo": {
       "plugins": [["expo-build-properties", { "android": { "minSdkVersion": 26 } }]]
     }
   }
   ```

3. Make a development build with `bunx expo run:ios` or `bunx expo run:android`, or use EAS. The default setup uses the prebuilt libraries. Explicit feature profiles need Rust on the build host.

Bare React Native apps autolink the same way: run `pod install` in `ios/` and set `minSdkVersion` 26 in Gradle.

Use `isEngineAvailable` to guard a game screen when the host may be running in Expo Go.

```tsx
import { Text } from 'react-native';
import { isEngineAvailable } from 'nayan-ui/games';
import { BouncingBall } from './BouncingBall';

export function EngineScreen() {
  if (!isEngineAvailable) return <Text>This screen needs a development build.</Text>;
  return <BouncingBall />;
}
```

### React (web)

`useWorld` loads the WebAssembly core for you; imperative game APIs await
`warmUpEngine()` first. Serve the shipped WASM asset along with the browser entry,
using HTTPS or localhost. `NTheme` initializes the UI and sizes a standalone browser screen to the viewport. Plain browser layouts can use the engine's [class compiler](#compiling-website-classes-without-tailwind).

For React Server Components, keep interactive theme/page controls in a client component.
`NMarkdown` and `parseFrontMatter` use the same public Markdown import on the server;
do not add a `/server` import. Standalone/traced server deployments must retain
`lib/web/engine_core_bg.wasm` when rendering Markdown on the server. Requests to external
APIs and image hosts remain subject to browser CORS and platform permissions.

## Quick start

### App UI

Wrap the screen in `NTheme`. Its controls share one Rust document. Set `surface={{ active: false }}` to pause a hidden screen while retaining its document. Use `surface={false}` when the root theme wraps an existing platform navigator, then wrap each engine screen in `NTheme`.

```tsx
import { useState } from 'react';
import { NButton, NCard, NText, NTheme } from 'nayan-ui/components';

function WelcomeScreen() {
  const [count, setCount] = useState(0);
  return (
    <NCard className="m-4 gap-3 p-4">
      <NText className="text-xl font-semibold">Welcome</NText>
      <NText>Count {count}</NText>
      <NButton onPress={() => setCount((value) => value + 1)}>Increment</NButton>
    </NCard>
  );
}

export function App() {
  return (
    <NTheme defaultTheme="system" surface={{ style: { height: 360 } }}>
      <WelcomeScreen />
    </NTheme>
  );
}
```

Use the `components` build feature for a scoped runtime. The example uses
system fonts and the built-in Rust utility resolver. [Theming](#application-theming) · [Typography](#unicode-and-fonts)

### 3D game

This scene works on native and web. Use the `games` build feature for a scoped runtime.

```tsx
import { GameView, useWorld } from 'nayan-ui/games';

export function BouncingBall() {
  const world = useWorld(100, (w) => {
    w.spawn({ mesh: 'plane', scale: [20, 1, 20], color: '#4C9A4C', physics: 'fixed' });
    w.spawn({ mesh: 'sphere', position: [0, 5, 0], color: '#3399FF', physics: { type: 'dynamic', bounce: 0.6 } });
  });
  if (!world) return null;
  return <GameView source={world} camera={{ eye: [0, 4, 8], target: [0, 0, 0], fov: 1 }} style={{ width: '100%', height: 480 }} />;
}
```

`useWorld` warms the engine up, creates the world (100 entity slots), runs your setup and disposes it on unmount. `GameView` draws it and steps it every frame.

## Package entry points

Install `nayan-ui` once and import the features your React or React Native app
uses. Each entry has platform-specific JavaScript and TypeScript declarations.

| Import | API |
| --- | --- |
| `nayan-ui/core` | `prepareCore()` for initializing the shared Rust runtime. |
| `nayan-ui/games` | 3D rendering, meshes, glTF models, worlds, physics, input, and procedural geometry. |
| `nayan-ui/animations` | React view animations, Rust-backed entity tweens, and skeletal clips. |
| `nayan-ui/drawing` | Drawing documents, canvases, and drawing types. |
| `nayan-ui/components` | App components, themes, rendering surfaces, safe areas, drawer, keyboard, toasts, and `NIcon` for the seven built-in control icons, custom SVG paths, and Unicode symbols. |
| `nayan-ui/icons` | Named Lucide components, outlines, and `NIcon` for runtime name lookup. |
| `nayan-ui/markdown` | Dedicated Markdown module with rendering, frontmatter parsing, and types. |
| `nayan-ui/styles` | Node/Bun utility stylesheet tools. |

| Service area | Public subpaths |
| --- | --- |
| Assets and local data | `/assets`, `/files`, `/storage`, `/sqlite`, `/uuid` |
| Connectivity and platform access | `/network`, `/permissions`, `/location`, `/device` |
| Audio and feedback | `/audio`, `/microphone`, `/tts`, `/haptics` |
| Media and sharing | `/video`, `/camera`, `/image-picker`, `/capture`, `/sharing`, `/clipboard` |
| App lifecycle | `/keep-awake`, `/review` |

Each service path starts with `nayan-ui`. The root, `/web` and
`/modules` are compatibility entries. Find usage examples and platform
requirements in [Shared modules](#shared-modules).

### Rendering and module ownership

| Area | Engine responsibility |
| --- | --- |
| `GameView`, `DrawingCanvas`, `NTheme` | Rust and wgpu paint games, drawing documents and component trees. Canvas entrances animate within this render path. |
| Platform views and shared elements | `AnimationView` and shared-element transitions animate the platform view. React Native uses its native driver, and browsers use the Web Animations API. |
| Component fallback and overlays | Browser HTML/SVG and React Native views host semantic fallbacks, text editors, accessibility and embedded platform controls. |
| Video, camera and capture | Playback, preview and capture use operating system or browser media facilities. |
| Assets and application services | Asset loading, CPU preparation, storage, permissions and other services work independently of a render surface. |

`src/assets` owns source resolution, byte loading, cache persistence and shared decode scheduling. Games keep their geometry, procedural records and model-specific loaders in `src/games`. `clearAssetCache` is available from `/assets` and `/games` and clears the same shared cache.

```tsx
import { GameView, useWorld } from 'nayan-ui/games';
import { createStorage } from 'nayan-ui/storage';
import { uuid } from 'nayan-ui/uuid';
```

These imports omit the image-picker JavaScript on browsers and in Metro. Browser
storage and UUIDs also run without loading WASM. Native image picking must be enabled
in the app build, as described in [Image picker](#image-picker).

### Selecting compiled Rust features

The npm package includes the SDK, Rust build sources and full prebuilt binaries.
Feature imports guide JavaScript tree shaking. A compiled feature list tells
Cargo which implementation to link. Omit the list to use the shipped default
runtime. An explicit empty list selects the shared wgpu and surface runtime.

| App workload | Example feature list |
| --- | --- |
| Components and named icons | `["components"]` |
| Components with Markdown | `["components", "markdown"]` |
| Drawing canvas with an app UI | `["components", "drawing"]` |
| 3D game with sound and saved progress | `["games", "audio", "storage"]` |
| App with a photo picker, video and local database | `["components", "image-picker", "video", "sqlite"]` |

The lists are starting points. Add the features behind the APIs you use on that
platform. For example, native UUID generation needs `uuid`, whereas browser
UUIDs use Web Crypto. Cargo enables `components` for `markdown`, `audio` for
`microphone`, and `permissions` for `location`.

**Expo** apps set the list in their engine plugin configuration.

```json
{
  "expo": {
    "plugins": [
      ["nayan-ui", { "features": ["games", "audio", "storage", "uuid"] }]
    ]
  }
}
```

Run `bunx expo prebuild` and then `bunx expo run:ios` or `bunx expo run:android`.
Cargo runs from the native build using Rust and the platform SDK. Include `image-picker` in an
explicit feature list to enable the picker and its camera configuration.
Include `video` to enable native `VideoPlayer` playback and Android Media3.
Apps without an explicit feature list retain the existing native video support.
Explicit profiles also select the native adapters for `review`, `permissions`,
and `location`. The `location` feature includes permissions support. Android
includes the Google Play review SDK only when review is enabled.

**Bare React Native** apps set the same comma-separated list in
`ios/Podfile.properties.json` under `"nayanEngine.features"` and in
`android/gradle.properties` as `nayanEngine.features=games,audio,storage,uuid`.
Run `pod install` when changing the iOS list. Android reads the host Gradle file
from the standard React Native build layout. Hosts that relocate the app build
directory can pass its absolute path as `-DNAYAN_ENGINE_FEATURE_FILE=…` in the app's
CMake arguments.

**React web** apps use the prebuilt WASM by default. To compile a custom browser
runtime, run the core build script with a comma-separated feature profile.

```sh
NAYAN_ENGINE_FEATURES=games,audio \
  CARGO_TARGET_DIR="$PWD/.cache/nayan-engine/cargo" \
  NAYAN_ENGINE_WASM_OUT="$PWD/.cache/nayan-engine/web" \
  bash node_modules/nayan-ui/native/core/scripts/build-web.sh
```

The build host needs Rust with the `wasm32-unknown-unknown` target, LLVM, and the
wasm-bindgen CLI version pinned in the engine's Cargo lockfile. Alias
`nayan-ui/wasm-runtime` to the output `engine_core.js` in your bundler.
Keep the JavaScript binding and its WASM asset together. If you use SQLite, apply
the same alias in the worker build.

The supported feature names are `games`, `drawing`, `components`, `markdown`, `storage`, `uuid`,
`image-picker`, `audio`, `microphone`, `haptics`, `tts`, `keep-awake`,
`review`, `permissions`, `sqlite`, `video` and `location`.
`games` owns 3D rendering, glTF loading, meshes, glyphs and procedural worlds.
The native build links the shared bridge and small platform adapters. Browser
storage, UUIDs, image picking and video use browser facilities, and named icons
choose their JavaScript outline modules at import time.

The repository's `native/core/scripts/web-features.cjs` helper builds and caches
custom WASM profiles for bundler verification.

### Initialization

| Feature                                           | Browser                                                                                            | Native                                                                        |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| Game worlds and procedural/game assets            | `useWorld` prepares automatically; imperative use awaits `warmUpEngine()`                          | Installed native bridge; `useWorld` owns lifecycle                            |
| `DrawingDocument` | Await `warmUpEngine()` before constructing a document | Installed native bridge with `drawing` enabled |
| `NTheme`, drawer and safe-area providers | Public components prepare their required core internally                                           | Updated development/store build                                               |
| `uuid()`                                          | Ready when browser secure randomness is available                                          | Ready after native module registration; the same `prepareUuid()` call is safe |
| Audio, microphone and haptics                     | Sound asset loading prepares its bridge; prepare the engine before direct recording/feedback calls | Installed native bridge; request microphone permission before recording       |
| `NMarkdown`                                       | Its surface or server binding prepares parsing                                                     | Render inside the engine UI surface                                           |
| `parseFrontMatter` and storage              | No game warm-up; each service retains its own availability/access rules                            | No game world or render surface required                                      |
| `/styles`                                         | Run in Node/Bun during build/development, outside the browser bundle                               | Build tooling only                                                            |

Use `prepareCore()` from `/core` to initialize the shared runtime on its own.
Follow the initialization steps above for APIs that use the browser bridge.

Unmount public components to release their surfaces and subscriptions. Dispose manually
created worlds/documents, release temporary images/files/captures, and abort requests when
their owning operation is cancelled. Application endpoints, credentials and routing remain
with the host.

## Core concepts

1. **Own** a world with `useWorld(capacity, setup)`, or create it yourself after `await warmUpEngine()` and `dispose()` it on unmount.
2. **Play** in `GameView`'s `onUpdate(dt)`: read input, move things, spawn. The world is stepped for you right after (call `world.update(dt)` yourself only to step it earlier or with another `dt`).
3. **Keep handles**: `spawn` returns an `Entity`; change it with `set`, remove it with `despawn`.
4. **Batch per-frame moves** in `world.transforms`: they are applied in one native call when the world steps (`flush()` yourself before reading positions).
5. **Don't track disposal yourself**: check `world.isDisposed`. Cleanup calls are safe no-ops after `dispose()`.

## Guides

Each snippet assumes a `world` from `useWorld`.

### Entities

```ts
const box = world.spawn({ mesh: 'cube', position: [0, 1, 0], color: '#FF4757' });
world.set(box, { color: '#2ED573', scale: 2 }); // only the options you pass change
world.despawn(box);
```

Built-in meshes include `'cube'`, `'sphere'`, `'plane'` and `'cylinder'`.

### Game loop

```tsx
<GameView
  source={world}
  onUpdate={(dt) => {
    world.transforms.set(player, { position: [x, 0, z] }); // batched, applied as the world steps
  }}
/>
```

### Physics

```ts
const ball = world.spawn({ mesh: 'sphere', position: [0, 5, 0], physics: { type: 'dynamic', bounce: 0.6 } });
const coin = world.spawn({ mesh: 'cylinder', position: [2, 1, 0], physics: { type: 'fixed', sensor: true } });

world.impulse(ball, [0, 4, 0]);
world.forEachCollision((a, b, { started }) => {
  if (started && (a === coin || b === coin)) world.despawn(coin);
});
```

### Animation

#### React views

Wrap React content in `AnimationView` to animate opacity, translation, scale, rotation, or skew. Translation uses CSS pixels on web and density-independent pixels on React Native. Rotation and skew use degrees. Bind shared values directly to those properties. Assign a number for an immediate update, or use `withTiming` or `withSpring`. `duration` is in milliseconds.

```tsx
import { AnimationView, useAnimatedStyle, useSharedValue, withTiming } from 'nayan-ui/animations';
import { NPress, NText } from 'nayan-ui/components';

function Reveal() {
  const opacity = useSharedValue(0.4);
  const translateY = useSharedValue(12);
  const animatedStyle = useAnimatedStyle({ opacity, translateY });

  return (
    <NPress onPress={() => {
      opacity.value = withTiming(1, { duration: 220 });
      translateY.value = withTiming(0, { duration: 220 });
    }}>
      <AnimationView animatedStyle={animatedStyle}>
        <NText>Tap to reveal</NText>
      </AnimationView>
    </NPress>
  );
}
```

For imperative playback, attach a `useRef<AnimationViewRef>(null)` to `AnimationView` and call `animations.animateView(ref, { scale: 1.1 }, { duration: 180 })`. It starts immediately and returns a handle with `cancel()` and `finished`. The promise resolves to `true` on completion or `false` on cancellation, replacement, or unmount. A new animation replaces only its own properties.

```ts
scale.value = withSpring(1.08, { stiffness: 210, damping: 16 });
const pulse = animations.playView(ref, 'pulse', { repeat: 2, delay: 120 });
const turn = animations.playView(ref, {
  initial: { rotate: 0 },
  steps: [{ to: { rotate: 45 }, duration: 200 }]
}, { repeat: 1, yoyo: true });
```

`viewPresets` lists the available entrances, exits, and attention effects. Pass a preset name or a custom sequence to `animations.playView`. Set the wrapper's `initial` from `viewPresets.fadeIn.initial`, for example, to keep an entrance hidden before playback starts. `repeat` counts additional runs. `yoyo` plays alternating runs in reverse and requires an initial value for each animated property.

`AnimationView` is a React Native view or a browser `div`. Use it around `NView`, `NText`, and other React content in the platform view tree, or around a whole `NTheme` screen. The wrapper owns the animated properties. React Native uses the native driver and web uses the Web Animations API. Browsers without `CSS.registerProperty` apply individual translation, stretch, 3D rotation, and skew changes immediately. The system reduced-motion preference applies by default.

Inside an `NTheme` browser screen with a compiled stylesheet, `entrance={{ duration: 460, delay: 55, opacity: 0.2, translateY: 22 }}` reveals a block once a portion of it is visible. Rust fades and moves the component toward its resting layout and keeps the layout cached. Set `replay: true` to reveal it again after it fully leaves the viewport. Hosts that hide the surface while loading can set `surface.entrancesReady` to false until they reveal it. Reduced motion displays the final position immediately. The semantic HTML fallback renders its normal resting state.

#### Shared elements

Capture the source geometry before changing screens or layout, then pass the snapshot to the destination once its ref and layout are available. Mount the destination with `initial={{ opacity: 0 }}` to keep it hidden before playback.

```ts
const snapshot = await animations.captureSharedElement(sourceRef);
// Pass snapshot to the destination through your navigation or component state.

// Once the destination is mounted and laid out:
const transition = await animations.transitionSharedElement(snapshot, destinationRef, { duration: 360 });
await transition.finished;
```

The transition moves and resizes the live destination view from the source's bounds in the same window. Keep the destination wrapper's other transforms at their defaults and use a container that allows the content to extend beyond its bounds during playback. The destination's own content and clipping apply throughout the transition. An unavailable source fades in the destination, while unavailable destination bounds or reduced motion reveal it immediately.

#### Game entities

Import `animations` to control entity tweens and skeletal clips in an existing `World`. The same API runs on iOS, Android, and web and uses the compiled `games` feature. The world must be stepped while the tween is running.

```ts
import { animations } from 'nayan-ui/animations';

await animations.animate(world, box, { position: [2, 0, 3] }, { duration: 0.25, easing: 'back' });
void animations.animate(world, star, { scale: 1.2 }, { repeat: 'forever', yoyo: true });
animations.stopAnimation(world, star);
```

### Characters

glTF clips play natively, with crossfades.

```ts
const hero = await loadModel(require('./hero.glb'));
const player = world.spawn({ mesh: hero });

animations.playClip(world, player, 'idle');
animations.playClip(world, player, 'run', { fade: 0.2 });
animations.stopClip(world, player);
```

Clip names are in `hero.animations`. `world.sampleSkinnedVertices` reads chosen vertices of the next pose (for planting feet on uneven ground).

### Effects

```ts
import { effects } from 'nayan-ui/games';

effects.confetti(world, { position: [0, 2, 0], colors: ['#FF4D4D', '#FFD933'], count: 40 });
await effects.pop(world, box, { scale: 1, color: '#FF4D4D' }); // swell, flash, shrink away
```

Also available: `dust`, `sparkle`, `shatter`, `splash`, `sparks`, `explosion` and `flash`.

### Input

```tsx
<GameView
  source={world}
  onTap={(x, y) => {
    const hit = world.pick(x, y);
    if (hit) world.animate(hit.entity, { scale: 1.2 }, { yoyo: true, repeat: 1 });
  }}
  onSwipe={(direction) => move(direction)}
/>
```

Also available: `onDrag`, `onLongPress`, `onPinch`, the on-screen `Joystick` and `createKeyboardInput` (web).

### Assets

```ts
import { loadFont, loadModel, loadTexture } from 'nayan-ui/games';

const car = await loadModel(require('./car.glb'), { fit: 2 }); // or a URL on the web
const crate = await loadTexture(require('./crate.png'));
const font = await loadFont(require('./Inter-Bold.ttf'));

world.spawn({ mesh: car });
world.spawn({ mesh: 'cube', texture: crate });
world.spawn({ text: '2048', font, position: [0, 2, 0], scale: 0.5 });
```

### Sound and haptics

```ts
import { audio } from 'nayan-ui/audio';
import { haptics } from 'nayan-ui/haptics';

const sfx = audio.load({ coin: require('./coin.wav') });
await sfx.ready;
sfx.play('coin');
haptics.impact(0.5);

audio.enabled = settings.sounds; // respect the player's preferences
haptics.enabled = settings.haptics;
```

`SoundBank.ready` resolves after its named loads finish; unavailable sounds are logged
and skipped. The bank caches sounds for reuse. `audio.play(sound, { volume, pan, pitch,
loop })` returns a voice handle for `audio.stop(voice)`; `audio.volume` and `audio.muted`
control the mixer. WAV decoding supports PCM/float mono/stereo sources. Native audio
decodes on background threads; browsers keep their normal user-activation rules.
This is a decoded-sound mixer, with no streaming media-player API.

Use `haptics.selection()`, `haptics.notify('success' | 'warning' | 'error')` or
`haptics.play([{ time, intensity, sharpness }])` for additional feedback. Times are in
seconds, intensity/sharpness use 0..1, and `supported` reflects platform/hardware
availability. Keep global sound/haptic settings in the application.

### Score and timers

```ts
world.scoreboard.handlers = { onTimeUp: () => endGame('lose') };
world.scoreboard.listen({ onScore: setScore, onSecond: setTime }); // keep your UI in sync
world.scoreboard.reset(3, 60); // 3 lives, 60 s countdown
world.scoreboard.resume();
world.scoreboard.add(10);

const timer = world.after(0.5, spawnWave); // game time: pauses with the game
world.cancelTimer(timer);
```

### Shapes in code

Build a mesh once at module scope (after `warmUpEngine()`), then spawn it many times.

```ts
import { createShape, lathe } from 'nayan-ui/games';

const vase = createShape(
  lathe(
    [
      [0, 0],
      [0.4, 0.1],
      [0.25, 0.8],
      [0.3, 1]
    ],
    { segments: 24 }
  )
);
world.spawn({ mesh: vase, color: '#C8763A' });
```

Also available: `merge`, `tube`, `extrude`, `loft`, `block`, `ellipsoid`, `parametricSurface`, `Solid` and `shapeGeometry`.

### Procedural worlds

Describe terrain and placement rules as data; the native core generates the world on a background
thread and answers walker queries, so none of that work runs in JavaScript.

```ts
import { FieldGraph, generateWorldAsync } from 'nayan-ui/games';

const f = new FieldGraph();
const bank = f.sub(f.abs(f.sub(f.x, f.sines(f.x, f.z, 0, [[0, 0.04, 0, 12]]))), 4); // a winding river
f.output('bank', bank);
f.output('height', f.select(bank, -1, f.bumps(f.x, f.z, [[30, 20, 5, 15, 12, 0]])));
f.output('clear', f.sub(bank, 1));

const world = await generateWorldAsync({
  seed: 7,
  fields: f,
  terrain: {
    axis: [...Array(101).keys()].map((i) => i * 2 - 100),
    height: 'height',
    regions: [{ field: 'bank', surface: 2, material: 1 }],
    fallback: { surface: 1, material: 0 },
    materials: 2
  },
  walk: { boundary: 95, clearance: 'clear', height: 2 },
  steps: [
    { kind: 'spawn', near: [-30, 0], rings: 20, samples: 16, radius: 1 },
    { kind: 'reach', cell: 3, steps: 6, radius: 0.6, extent: 100 },
    { kind: 'pick', groups: [{ name: 'coins', count: 10, spacing: 8 }] }
  ]
});
const land = createShape(world.terrain(0), { center: false }); // one mesh per material
world.move(player, dx, dz, 0.5); // swept move-and-slide; also ground, walkable, canSee, tilt
```

Scatter steps place scenery with filters (fields, walkability, surfaces) and optional solids;
`generateMesh` builds parametric surfaces and seeded cards. Pass `key` to save a world (tied to its
exact recipe) and restore it on later visits.

### Flat boards and puzzles

`frontLight` keeps camera-facing surfaces at their exact color.

```tsx
<GameView source={world} camera={{ eye: [0, 0, 50], target: [0, 0, 0], fov: 1, ortho: 10 }} light={frontLight([-0.4, 0.6, 1], 0.5)} />
```

### Colors

Use CSS strings (`'#FF4757'`, `'rgba(0, 0, 0, 0.5)'`) or linear 0..1 tuples (`[1, 0.3, 0.3]`; channels above 1 glow). `toColor('#FF4757')` converts a CSS color to numbers.

## Performance

The engine is built so that a game written the obvious way stays smooth on mid-range Android phones.

- **Display clock and render thread (iOS and Android).** The display's vsync (`CADisplayLink` on iOS, `Choreographer` on Android) asks for each frame at 60 Hz. `onUpdate` steps the game and hands a copy of the frame to a native render thread, which culls, submits and presents it. The JS thread never waits on the GPU, and a frame that is still waiting when a newer one arrives is replaced, not queued. The clock stops while the app is in the background or the view is off screen. On the web, `requestAnimationFrame` drives the same loop.
- **Culling in Rust.** Everything outside the camera's view (and outside the light's box for shadows) is skipped every frame, so open levels and long tracks only pay for what is on screen. Don't cull scenery in JS.
- **Automatic quality.** `quality="auto"` (the default) starts at `high` and steps down (shadows off first, then anti-aliasing, resolution last) only while the device can't keep up. Shadows always come from a full-resolution map (soft at `high`, crisp at `medium`): `low` and `lowest` skip the shadow pass rather than show blurred low-resolution shadows. `lowest` smooths edges with FXAA (in the pass that stretches its reduced scene), and `lowest`'s pixel cap shrinks only the 3D scene (stretched to fill the view): the overlay, and so all HUD text, is always drawn at the screen's own resolution. With a `qualityKey` (games pass their id) the level it settles on is saved in the engine's durable store, so later visits, after app restarts too, start there. Pass `adaptQuality={false}` while what's on screen isn't the game being played (a menu, a results card): those frames then never change or save the level. `onStats` reports fps, update and render time, the quality chosen and the graphics backend.
- **Cached backdrops.** Spawn scenery that never moves (a sky, distant hills, a board's background) with `still: true`, or a whole still scene into `world.backdropLayer(capacity)` (then `update(0)` it). `GameView` draws the world's backdrop layer once into an image behind the scene and draws that image each frame instead, redrawing it only after a still entity changes, the camera moves or the light changes. Live entities are always drawn in front of it and it receives no live shadows, so keep anything that moves, or that live pieces pass behind, in the world. A still entity takes `set` and `despawn` but can't be attached, animated, picked or given physics or text.
- **Small things stay cheap.** Built-in spheres a few pixels across on screen (stars, pellets, beads) are drawn with 8- or 12-sided stand-ins, and instances scaled to nothing are never drawn, so pools of hidden pieces cost nothing on the GPU.
- **Background loading.** `loadTexture`, `loadModel`, `loadFont` and `audio.load` decode on native threads in parallel, and meshes are registered with the renderer inside Rust.
- **Work between frames.** `afterNextFrame(fn)` runs `fn` right after the next frame leaves, so you can spread long setup work (map generation, mesh building) over several frames behind a loading screen.
- **Cached procedural assets.** `ProceduralCache` saves built geometry on disk keyed by a recipe, so later launches restore it instead of rebuilding; `peek(key)` returns a saved value without building anything.

Keep these habits:

- Build meshes once, at module scope or behind a cache, and spawn new entities from them. Mesh ids are app-wide and never freed (`getMeshIdLimit()` tells you how many there are), so never create a mesh per spawn or per frame.
- Move many things each frame through `world.transforms` and the `out` arguments of queries, which allocate nothing.
- Keep long one-off jobs out of gameplay frames: a single slow frame stalls Android's Hermes far longer than desktop JavaScript suggests.

## Drawing

A native paint canvas, also usable as a live texture inside games.

Use the `drawing` feature with a scoped build. On the browser, await
`warmUpEngine()` before creating a `DrawingDocument`.

```tsx
import { useEffect, useState } from 'react';
import { DrawingCanvas, DrawingDocument } from 'nayan-ui/drawing';
import { warmUpEngine } from 'nayan-ui/games';

export function SketchPad() {
  const [paper, setPaper] = useState<DrawingDocument | null>(null);
  useEffect(() => {
    let active = true;
    let document: DrawingDocument | undefined;
    void warmUpEngine()
      .then(() => {
        if (!active) return;
        document = new DrawingDocument(512, 512);
        document.setBrush({ brushType: 'MARKER', color: '#e53935', width: 12, opacity: 1 });
        setPaper(document);
      })
      .catch((error) => {
        if (active) console.error(error);
      });
    return () => {
      active = false;
      document?.dispose();
    };
  }, []);

  return paper && !paper.isDisposed ? <DrawingCanvas document={paper} mode="draw" style={{ width: '100%', height: 400 }} /> : null;
}
```

Drawings save as SVG paths and export transparent PNG snapshots. Create one document
per mounted drawing/game screen and call `dispose()` on unmount; reuse `clear()` for
a new run. A document's live texture is created once and released with that document.
In a game, pass `paper.texture()` as the entity's `texture` to paint on a 3D object.

| API                                                 | Behavior                                                                                             |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `setBrush`, `updateControls`                        | Brushes, erasing, color/width/opacity, pressure, smoothing, symmetry and shape controls              |
| `undo`, `redo`, `clear`, `finish`, `cancel`         | Native editing history and in-progress gesture lifecycle                                             |
| `layer(action, options)`                            | Add, duplicate, select, update, move, delete or clear layers; preserve visibility, locks and opacity |
| `shapeCatalog`, `addShape`, `fill`                  | Shape previews/insertion and bounded color filling                                                   |
| `load`, `exportPaths`, `exportSVG`, `exportProject` | SVG-compatible paths or a versioned full editable project; failed imports leave existing art intact  |
| `snapshot`, `captureDraft`, `setEditingEnabled`     | PNG output, revision/idleness-aware autosave and explicit editing ownership                          |
| `setViewFit`, `resetView`, `transform`              | Fit artwork or fill width, reset, pan and zoom without changing saved dimensions                     |
| `input`, `strokes`, `sample`, `coverage`            | Game-owned input, committed geometry, composited color and ink coverage queries                      |

Use `DrawingCanvas mode="draw" | "move" | "view"` with `active`, `onChange` and
`onError`. Native coalesced pointer/stylus samples and rendering stay on the engine
path; React consumes change snapshots for controls rather than tracking live stroke
geometry. For games, `input(..., 'document')` accepts document-space points, such as
texture UVs scaled by paper dimensions. `coverage()` returns a 0..1 painted fraction.

## Rust components (experimental)

Import the UI controls from `nayan-ui/components`. They share the engine's Rust core,
wgpu device, queue and platform surface. React reconciles descriptions and invokes
application callbacks; Rust/egui owns layout, widget state, hit testing, text layout
and drawing. Text fields use the native/browser editor for immediate typing,
selection and IME composition, with their labels and chrome drawn by Rust.
Charts and data tables are outside this implementation.

Install `react-reconciler@^0.34.0` alongside React 19.3 when rendering a screen with `NTheme`.
Game-only applications do not need this optional peer.

```tsx
import { NCard, NCheck, NInput, NSlider, NTheme } from 'nayan-ui/components';

export function Preferences() {
  return (
    <NTheme theme="light" surface={{ style: { height: 480, width: '100%' }, onError: console.error }}>
      <NCard className="p-4">
        <NInput label="Name" defaultValue="Ada" />
        <NCheck label="Notifications" defaultChecked />
        <NSlider label="Volume" defaultValue={30} onChange={console.log} />
      </NCard>
    </NTheme>
  );
}
```

Give an embedded screen a bounded size with `surface.style` or its host layout. Custom
components, hooks and keyed children work inside the screen. The root `NTheme` supplies safe-area measurements when
no provider exists, derives sheet insets and lazily hosts toasts. Nested themes inherit
configuration without duplicating these services. `safeArea={false}` and `toasts={false}`
allow custom hosting.

### Application theming

The engine now uses the shared HeroUI semantic color defaults found in the reference
libraries: `background`, `foreground`, `surface`, `muted`, `accent`, `border`, form
field and status colors. The Nayan web base radius is 8 points; native buttons/cards
use its 12-point rounding and native fields use the 14-point field radius. This
aligns the default color/radius vocabulary, not every pixel: fonts, widget layouts,
shadows and animations still differ from the reference libraries.

Import `NTheme` and `useNTheme` directly for application theming. The provider owns
light/dark/system preference, persistence, palette resolution and component defaults;
applications only supply their brand configuration:

```tsx
import { createStorage } from 'nayan-ui/storage';
import { NButton, NTheme, useNTheme } from 'nayan-ui/components';

const preferences = createStorage({ id: 'preferences' });
const palettes = {
  light: { background: '#ffffff', foreground: '#111111', accent: '#6f3ef4', accentForeground: '#ffffff', patternOpacity: 0.4 },
  dark: { background: '#17122b', foreground: '#ffffff', accent: '#b99bff', accentForeground: '#17122b', patternOpacity: 0.2 }
};

<NTheme
  palettes={palettes}
  persistence={{ storage: preferences, key: 'theme' }}
  components={({ isDarkMode }) => ({ NCard: { className: isDarkMode ? 'shadow-lg' : 'shadow-sm' } })}>
  <App />
</NTheme>;

function ThemeToggle() {
  const { palette, isDarkMode, toggleTheme, setTheme } = useNTheme();
  // toggleTheme switches the resolved appearance; setTheme('system') follows the OS.
  return (
    <NButton style={{ color: palette.accent as string }} onPress={toggleTheme}>
      {isDarkMode ? 'Light' : 'Dark'}
    </NButton>
  );
}
```

`theme` is the selected preference; `resolvedTheme` is always `light` or `dark`.
`palette` includes active custom string/number tokens and camelCase semantic aliases.
For example, `accentForeground` configures the renderer's `accent-foreground` token.
Explicit `colors`/`themes` override palette colors in the same scope, and nested scopes
inherit the parent configuration. `colors` from the hook continues to expose semantic
overrides; unspecified tokens use the renderer defaults. Custom numeric tokens remain
application data, available from the hook and component-default resolver.

For typed custom palette fields, declare their shape once in the host application:

```ts
declare module 'nayan-ui/components' {
  interface NThemePalette {
    accent: string;
    patternOpacity: number;
  }
}
```

Persistence is optional and uses a synchronous engine-storage-compatible adapter.
It restores existing preferences on the first client render, observes external writes,
and unsubscribes on unmount. Use `encoding: 'json'` for values saved through `setJSON`.
Malformed or invalid preferences fall back to `defaultTheme` (normally `system`).
SSR uses the deterministic default without accessing client storage. Controlled
`theme` props remain authoritative and changes notify `onThemeChange`. Palette-only
nested themes delegate changes to their owning root. Existing saved light/dark choices
are preserved, while new installations follow system appearance by default.

Engine contexts transfer across surfaces and dialogs automatically. Register external
application contexts once with `contexts={[SessionContext, QueryClientContext]}`; each
surface captures the closest provider and follows updates without recreating its content.
React cannot enumerate arbitrary contexts across renderer roots. The advanced `providers`
wrapper remains supported for integrations that need to construct providers explicitly.

### Application contexts and game surfaces

Games use the same application boundary. `GameView` inherits the theme background
unless an explicit `background` is supplied. Inside an `NTheme` screen, it automatically
creates the platform surface and carries registered contexts to it. Game components
can use the same session, query and navigation contexts as other screens.

```tsx
import { GameView, useWorld } from 'nayan-ui/games';
import { NTheme } from 'nayan-ui/components';

function GameScreen() {
  const world = useWorld(100, setupWorld, []);
  return world && <GameView source={world} />;
}

<NTheme defaultTheme="system" contexts={[SessionContext]}>
  <GameScreen />
</NTheme>;
```

`NTheme` configures the application and owns the screen’s layout and rendering surface. `useWorld` manages game warm-up and disposal. Theme setup alone does not
create a game world or start its frame loop.

Import the public names directly, without an app-local UI barrel:

```tsx
import { UserIcon } from 'nayan-ui/icons/components/user';
import { NCard, NText, NTheme } from 'nayan-ui/components';

<NTheme surface={false} theme="dark" colors={appColors} contexts={[SessionContext, QueryClientContext]}>
  <Navigation />
</NTheme>;

function Details() {
  return (
    <NTheme>
      <NCard>
        <UserIcon />
        <NText>Profile</NText>
      </NCard>
    </NTheme>
  );
}
```

`contexts` preserves the nearest application service values across independent renderers;
context objects and service values are never serialized to Rust. `components` configures default `className`
and `style` values by public component name. Explicit component props override those defaults.
Rust resolves Tailwind utilities and declarative style arrays, including spacing, percentages,
flex rows, text properties and image aspect ratios. `NView` has no card decoration; `NCard`
retains the familiar card API. `NActionItem` retains its `icon`, `name`, `description`,
`showArrow` and text-class props.

### System bars and window appearance

On native, the outermost `NTheme` also controls status-bar icons and Android
navigation-bar icons. Rust resolves automatic icon contrast from `theme`, handles
`system` appearance, prioritizes nested scopes and restores the latest parent
configuration when a scope leaves. Ordinary nested palette themes do not change
global system bars. Use `systemBars={false}` to opt out.
Configure system bars on the root or screen-level `NTheme`; serialized palette nodes
inside a Rust-rendered surface do not create additional global bar owners.

```tsx
// App root: both bars follow the theme automatically.
<NTheme theme={theme} surface={false}>{children}</NTheme>;

// Optional focused-screen override; the rest of its UI keeps the inherited palette.
<NTheme systemBars={{ theme: 'dark' }} navigation={navigation} surface={false}>
  <Game />
</NTheme>;
```

`navigation` accepts a React Navigation-compatible object (`isFocused` and
`addListener`). NTheme releases its override directly on blur, including when the
screen is retained or frozen, and reapplies on focus or foreground return. Updating
the app's theme while a game is open does not displace the active game scope.

`systemBars` accepts `true` or options: `theme`, `statusBarStyle` and
`navigationBarStyle` (`auto`, `light` or `dark`, describing icon color), plus
`statusBarHidden` and Android-only `navigationBarHidden`. Unspecified visibility
preserves the window's original state. Hidden Android bars support transient swipe
access. The native bridge handles activity/modal windows and restores original
platform settings after the last scope unmounts. It uses no per-frame JS work.
Modern Android edge-to-edge backgrounds and safe-area layout are preserved; API
26–28 uses a navigation-bar contrast scrim for readable three-button icons. Browser system-bar handling is a
no-op, while the ordinary browser theme continues to apply.

Expo hosts add `"nayan-ui"` to `expo.plugins`; the shipped plugin configures
iOS app-level status-bar appearance. Bare iOS hosts set
`UIViewControllerBasedStatusBarAppearance` to `false` in their Info.plist. Remove
other root status/navigation-bar managers and per-screen status-bar overrides when
using NTheme ownership. Rebuild the Rust core, run engine codegen, reinstall pods
and rebuild the native host after adding this support.

To let NTheme also own native window backgrounds and light/dark appearance,
enable the engine's window integration in Expo:

```json
{ "plugins": [["nayan-ui", { "systemTheme": true }]] }
```

This replaces `expo-system-ui`. The root theme supplies `colors.background`
and optional `themes.light` / `themes.dark` overrides. Rust resolves both palette
variants; native code saves the root preference and restores it before JavaScript
starts on the next launch. The plugin preserves the configured initial
`userInterfaceStyle` and optional `backgroundColor`. Nested screen overrides
affect their active scope without overwriting the saved root theme; a
`systemBars.theme` override changes bar contrast only. Transparent React Native
modal backgrounds are preserved. Hosts without `systemTheme: true` retain their
existing window management.

Native regression checks require a booted simulator/emulator and, for Android,
the current Playtura debug APK installed:

```sh
NAYAN_IOS_SYSTEM_THEME_TEST=1 bun test packages/nayan-ui/native/tests/system-theme-ios.test.ts
NAYAN_ANDROID_SYSTEM_THEME_TEST=1 bun test packages/nayan-ui/native/tests/system-theme-android.test.ts
```

### Pages and component catalog

Set `surface={{ showsVerticalScrollIndicator: false }}` on `NTheme`, or `showsVerticalScrollIndicator={false}` on `NSheet`, to hide the indicator while keeping scrolling and sheet gestures available. Other pages
keep their default indicator behavior. This option requires rebuilding the native core and app.
Sheets can also opt into their `NTheme`'s `presentationBackground` with `blurred`;
the panel and engine canvas then stay transparent over that clipped backdrop.

`NTheme` automatically measures its native screen viewport and protects the bottom of its
primary scroll content. `NList` and vertical `NScrollView` keep the full viewport;
the inset scrolls away with the final item. Plain forms receive it on their content.
Rust uses the larger of existing bottom padding and the remaining system inset.
Tab screens whose viewport ends above the tab bar receive no additional inset,
and nested rows, horizontal lists and presentations do not inherit it again.
Use `safeArea={false}` when a screen manages its own content insets.

Use `surface={{ keyboard: true }}` on `NTheme` to enable keyboard avoidance. Screens host their controlled presentations automatically.
DOM elements and React Native visual elements require the explicit `NPlatformView`
attachment boundary inside an engine UI tree.

| Area                            | Public components                                                                                                                                      |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| App and layout                  | `NTheme`, `NView`, `NCard`, `NPlatformView`, `NDivider`                                                                             |
| Scrolling and navigation UI     | `NScrollView`, `NScrollShadow`, `NRefreshControl`, `NList`, `NCarousel`, `NDrawer`, `NTabs`, `NTabsContent`                                            |
| Content and feedback            | `NText`, `NImage`, `NPattern`, `NLink`, `NLinkify`, `NCode`, `NKbd`, `NTooltip`, `NAccordion`, `NRequired`                                            |
| Optional content entries        | `NIcon` and named components from `/icons`, `NMarkdown` from `/markdown`                                                                            |
| Actions and choices             | `NButton`, `NPress`, `NCheck`, `NSwitch`, `NToggleButton`, `NRadio`, `NRadioGroup`, `NButtonGroup`, `NActionItem`, `NMenuItem`                         |
| Fields                          | `NInput`, `NTextarea`, `NSearchField`, `NInputOtp`, `NSlider`, `NNumberField`, `NSelect`, `NDatePicker`                                                |
| Status and loading              | `NProgress`, `NLoading`, `NChip`, `NBadge`, `NAlert`, `NEmptyState`, `NSkeleton`, `NSkeletonGroup`, `NConfetti`, `NToastHost` and the `NToast` service |
| Presentations and native chrome | `NSheet`, `NDialog`, `NConfirm`, `NKeyboard`, `NBlur`, `NSafeArea`, `NSafeAreaProvider`, `NSafeAreaListener`                                           |

The engine exposes these controls through one shared API. Sheets, dialogs and confirmations use controlled `isOpen` /
`onOpenChange` props and a platform presentation host with Rust-rendered content.
Use `NAccordion` with one item for a single collapsible panel. Pass `defaultExpanded` to open it initially or use
`expanded` and `onExpandedChange` to control whether the accordion is open.
`NBlur` blurs the backdrop by default. To sample a specific Android view, put the source `NView` and its `NBlur`
overlay in an `NPlatformView`, set `collapsable={false}` on the source, and pass its ref as `blurTarget`.
The calendar and toast service also use Rust state and engine rendering. SDK-owned surfaces retain their platform integrations.

### Platform primitives and interop

`NPress` uses the app surface for hit testing, disabled state, press lifecycle callbacks, and pressed styles.

```tsx
import { GemIcon } from 'nayan-ui/icons/components/gem';
import { NPress, NText } from 'nayan-ui/components';

<NPress onPress={openPremium} className="bg-action flex-row items-center rounded-full px-2.5 py-1 active:opacity-80">
  <GemIcon size={14} className="text-action-foreground" />
  <NText className="text-action-foreground ml-1 text-xs leading-4 font-bold">PRO</NText>
</NPress>;
```

The parent app surface owns layout, drawing and event delivery. Press lifecycle updates are sent only when requested.
For a close control, give `NPress` an `accessibilityLabel` and render an icon or `×` as its content.

On the web, an app can explicitly wrap an HTML shell in `NPlatformView` for browser layout. Its semantic tags use the host stylesheet. `NTheme` can also serve HTML while WASM starts with `surface={{ serverFallback: true }}`.

For an SDK view or browser-owned attachment within a page, place it explicitly:

```tsx
<NPlatformView id="native-ad" style={{ height: 100, width: '100%' }}>
  <YourPlatformAdView />
</NPlatformView>
```

Rust positions and clips the attachment using its node bounds. `NTheme`’s `surface.overlays`
supports advanced keyed attachments, and `scrollableOverlays` forwards vertical
drags while leaving native taps available. Registered application contexts cross
these boundaries too. `GameView` handles its own attachment when used inside a page.

### Forms and keyboard

`NDatePicker` accepts `value`/`defaultValue` as `Date`, `minimumDate`,
`maximumDate` and `onChange`. The bridge transports local calendar days, avoiding
UTC timezone shifts. Rust owns Gregorian validation, disabled dates, month/year
navigation and selection; the default range is 1900–2100.

Wrap a form’s `NTheme` in `<NKeyboard>` to coordinate keyboard
avoidance and a themed Previous/Next/Done toolbar. Import `NKeyboard` and
`useNKeyboard` from `nayan-ui/components`; no keyboard-controller package is needed.
`useNKeyboard()` exposes `visible`, `height`, `focusedInput`, `hasPrevious`,
`hasNext`, `focus(id)`, `focusNext()`, `focusPrevious()` and `dismiss()`.
`NKeyboard.dismiss()` dismisses the platform keyboard from outside the scope.

```tsx
<NKeyboard doneLabel="Done">
  <NTheme>
    <NInput id="name" label="Name" />
    <NInput id="mobile" label="Mobile" keyboardType="numeric" />
    <NTextarea id="about" label="About" />
  </NTheme>
</NKeyboard>
```

`toolbar={false}` hides the native toolbar; `enabled={false}` disables avoidance,
and the host measures its screen/header offset automatically.
`keyboardVerticalOffset` overrides that measurement when needed. Rust supplies
editable field order and scrolls the destination into view, including offscreen
fields; disabled, hidden and read-only controls are skipped. The OS editor stays
mounted while its field scrolls away, preserving IME composition. Native layout
uses iOS keyboard transition events and Android `adjustResize`, without per-frame
JavaScript animation. Hosts should retain `adjustResize` on Android; a measured
overlap fallback handles an unresized window without padding an already resized one twice. The browser
keeps its own keyboard/accessory UI and uses VisualViewport for visibility.
`NTheme` with `surface={{ keyboard: true }}` uses this avoidance with its toolbar hidden and reuses an outer
`NKeyboard` scope. This covers form avoidance and navigation; worklet keyboard
animations and interactive keyboard-dismiss gestures are outside this API.

Browser file picking is also available through the engine's `NInput`:

```tsx
<NInput type="file" accept="image/*" multiple onChange={(event) => uploadFiles(Array.from(event.target.files ?? []))} />
```

This is a browser file input with its real `FileList` event, not the text field's
value-notification event. The `sr-only` class creates a hidden full-area upload
hit target inside a labelled trigger. Keep that trigger accessible and name it for
assistive technology. Native library/camera selection uses `imagePicker` from
`nayan-ui/image-picker`; process or upload selected files before releasing temporary results.

### Blur

`NBlur` renders a frosted container with sharp foreground children inside an `NTheme` screen. The GPU filter samples the background within that surface. An explicit browser layout can use the same component with browser backdrop filtering.

```tsx
<NView className="h-20 bg-accent">
  <NBlur className="absolute inset-0" intensity={45} tint="dark">
    <NText>Toolbar</NText>
  </NBlur>
</NView>
```

`intensity` is bounded to 0–100, and `radius` overrides it in logical points. `enabled={false}` removes the effect without unmounting children.

### Loading indicators

`NLoading` draws the same animated gradient ring in Rust on mobile and web.
Use `size="small" | "medium" | "large"` (20/32/48 points) or a numeric diameter,
`color`, optional `strokeWidth`, and an optional visible `label` beneath the ring.
`animating={false}` pauses it; system reduced motion shows a static ring.
For a screen or sheet loader, use `<NLoading fill label="Loading games…" />` inside
an `NTheme` screen. It centers within the remaining visible area below preceding content.
For a compact section or pagination footer, use `className="w-full py-6"` instead.
Animation uses the engine clock without JavaScript timers.

Outside a browser surface, the same `NLoading` component emits a semantic bootstrap
spinner that can paint before WASM finishes loading. Put it in a bounded loader
container for immediate feedback; a surface's `onReady` signals when its first UI
snapshot has arrived. `surface={{ serverFallback: true }}` on `NTheme` retains semantic fallback children
during server rendering and initial warm-up. Reuse a retained surface with the `surface.active`
and `surface.scrollKey` options when navigation should preserve the surface lifecycle.

### Toasts

The root `NTheme` mounts a toast outlet lazily when the first toast appears. Safe-area
spacing and a centered 480-point width limit are automatic; configure defaults with
`<NTheme toasts={{ top: 24, maxWidth: 400 }}>`. An explicit `<NToastHost />` suppresses
the automatic root outlet for compatibility; `toasts={false}` enables fully manual hosting. Toasts use a neutral card with a colored status icon, wrapped
message, optional title/action and a dismiss control. Titles wrap to two lines
and messages to three; accessibility announcements retain the complete text.

```ts
NToast.success('Profile saved');
NToast.error('Please try again.', { title: 'Upload failed', duration: 6000 });
NToast.show('Photo deleted', { action: { label: 'Undo', onPress: restorePhoto } });
```

`.success`, `.error`, `.warning` and `.info` accept either an options object or
the previous title string as their second argument. `show({ message, ...options })`
and legacy `actionLabel`/`onActionPress` remain supported. `dismissible: false`
hides the close control. Rust bounds the queue to eight messages and owns expiry
and dismissal; the shared platform adapter supplies visibility and accessibility.
The default duration is 4000 ms; zero persists until dismissed. `NToast.dismiss()`
and `.clear()` are available. Engine modal hosts include their own toast host
so messages remain visible above dialogs.

### Component confetti

`NConfetti` is a decorative Rust-painted burst inside an `NTheme` screen. Increment a
positive `run` value to start another celebration; zero is idle. The application
chooses when to celebrate, while the engine clock owns particle motion and expiry.

```tsx
<NConfetti run={celebrationId} count={24} duration={1.4} confettiColors={['#a78bfa', '#fbbf24', '#34d399']} className="h-48 w-full" />
```

`count` defaults to 24 and is bounded to 1..128; duration is in seconds and is
bounded to 0.1..10. Supply `confettiColors` for a custom palette. Reduced motion
shows a brief static burst instead of a moving animation. Update the Rust core
and native app before using this new widget in an existing development build.
Game-world particle effects remain available separately through `/games`.

### State ownership and callbacks

Inside engine surfaces, public controls are declarative TypeScript façades. Rust
owns their widget behavior; applications pass data through props and receive
callbacks. Controlled props carry application data while Rust retains the control's
layout, validation and interaction rules. Outside a surface, platform primitives
retain their normal native/DOM interactions as described in the interop guide.

Widget state, initial defaults, page selection, focus, pressed/expanded states,
interaction transitions and numeric stepping/clamping belong to Rust. TypeScript
exports components, prop types and focused platform/theme hooks. Hosts retain
lifecycle references and a read-only Rust snapshot for accessibility/IME, and
forward input and accessibility actions. Theme preference/persistence, React
context transport and platform presentation gestures belong to their adapters;
they are distinct from a widget's Rust-owned values and interaction rules.
Text fields use the platform editor directly: React Native `TextInput` on mobile,
and standard `input`/`textarea` elements in browsers. The platform paints text,
caret, selection and composition immediately, while Rust supplies the surrounding
layout, labels, field styling and validation. Cursor/composition painting does not wait for an engine frame.
Change callbacks remain immediate; controlled echoes and unchanged trees do not
trigger a redundant native tree update, and input acknowledgements include only
the edited field rather than the whole screen.
`defaultValue` and `defaultChecked` initialize state once. Optional
controlled `value`/`checked` props carry external application data; Rust still
applies control rules and emits the callbacks.

The shared controls accept familiar naming aliases, such as `onPress`/`onClick`,
`disabled`/`isDisabled`, and `checked`/`enabled`/`isSelected`. `NInput` and `NTextarea`
keep web `onChange(event)` with `event.target.value` and native `onChange(text)`;
`NSelect` returns an option on web and a string on native. The web input event is a
value notification, not a DOM `SyntheticEvent` or a DOM ref. Other prop details
are defined by the exported engine types; unsupported legacy props are not
implicitly emulated. `NCode` currently renders plain monospace text, and
`NScrollShadow` provides scrolling without gradient shadows.

### Single and multi-select

`NSelect` supports single selection and `isMulti` (also `multiple`) with `items` or
`options`. Pass `defaultValue` for Rust-owned selection, or `value` for controlled
application data. `onChangeOptions` consistently receives an option/null or an
array of options on both platforms; `onValueChange` receives the selected string
or strings. The existing platform-specific `onChange` payloads remain supported.
`isSearchable`, `isClearable`, placeholders and disabled options are handled in
Rust. The trigger and dropdown inherit `NTheme` field, surface, accent and focus
colors and radius, including scoped light/dark overrides.
Web dropdowns also inherit semantic CSS variables from the stylesheet. Explicit
`NTheme` colors take priority; menus use a solid surface to keep options readable.

```tsx
const languages = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'Hindi' }
];

<>
  <NSelect label="Language" options={languages} defaultValue="en" onValueChange={saveLanguage} />
  <NSelect
    label="Languages"
    options={languages}
    isMulti
    isSearchable
    isClearable
    defaultValue={['en']}
    onChangeOptions={(selected) => saveLanguages(selected.map((option) => option.value))}
  />
</>;
```

### Markdown and JSON frontmatter

The Markdown module renders CommonMark with tables, task lists and strikethrough
on web and React Native. Add the `markdown` feature to a scoped Rust build.

```tsx
import { NTheme } from 'nayan-ui/components';
import { NMarkdown } from 'nayan-ui/markdown';

export function ArticleScreen({ source }: { source: string }) {
  return (
    <NTheme surface={{ style: { width: '100%', height: 480 } }}>
      <NMarkdown source={source} blockSpacing={12} styles={{ h2: { fontSize: 24, lineHeight: 32 } }} />
    </NTheme>
  );
}
```

Render the screen beneath the app's root `NTheme`. Rust parses once
when the tree is committed and renders headings, paragraphs, nested lists, links,
images, quotes, code and tables. Default block spacing is 12 logical pixels;
`styles` and `classNames` customize individual elements. Theme colors flow through
the surrounding theme. Raw HTML is shown as text and unsafe URL schemes are
discarded. Code is monospace; math and syntax highlighting are not interpreted.
The module automatically chooses its server binding for React Server Components
and Node SSR, retaining semantic article HTML without a separate server import.
Its browser entry contains no parser loader, server I/O or game implementation.
The `markdown` feature enables the components runtime it needs.

`parseFrontMatter(source)` is available from the same Markdown import on web,
native and the server. It reads an optional JSON object between opening and
closing `---` lines and returns `{ data, content }`, retaining the exact body.
It uses the platform's built-in JSON reader, needs no engine warm-up, and adds
no YAML dependency. Empty metadata and plain Markdown are supported; malformed
JSON, non-object metadata and unclosed blocks throw. YAML-specific syntax is
intentionally unsupported.

```tsx
import { NMarkdown, parseFrontMatter } from 'nayan-ui/markdown';

const article = `---
{"title":"Release notes","tags":["engine","components"]}
---
# Release notes

One Markdown body for web and mobile.
`;
const { data, content } = parseFrontMatter(article);
// data is Record<string, unknown>; validate metadata fields for your application's schema.
<NMarkdown source={content} />;
```

Metadata stays in one document without a `gray-matter` runtime. This reader does not
interpret YAML syntax, JavaScript tags or implicit date values. The frontmatter
delimiter supports LF/CRLF line endings and an optional leading BOM. Formatters must
retain valid JSON quotes; do not let a YAML formatter rewrite them to single quotes.

### Link recognition

`NLinkify` recognizes HTTP(S), `www.` addresses and emails, preserves surrounding
punctuation, and keeps existing links intact. Wrapped links have per-line hit
areas and accessible link semantics. Detected links use the primary (`accent`)
theme color without underlines. Its optional `onPress(url, text)` overrides
opening the detected link; `linkStyle` customizes link text. On web, `className`
styles only detected links, matching the React library.

```tsx
<NLinkify onPress={(url, text) => openExternalLink(url, text)} linkStyle={{ color: '#7c3aed' }}>
  Visit https://example.com or contact hello@example.com.
</NLinkify>
```

### Images

```tsx
import { NImage } from 'nayan-ui/components';

<NImage
  source={{ uri: 'https://example.com/avatar.webp' }}
  placeholder={require('./placeholder.png')}
  fallbackSource={require('./user.png')}
  accessibilityLabel="Profile image"
  className="h-16 w-16 rounded-full"
  contentFit="cover"
  cachePolicy="memory-disk"
  onLoad={({ source }) => console.log(source.width, source.height)}
  onError={({ error }) => console.warn(error)}
/>;
```

Use URL strings, `{ uri, headers, width, height, scale, cache }` descriptors, or
Metro `require()` assets on native. Browsers use URLs (including asset-import
URLs); `src` is a URL alias. Set explicit dimensions or `style.aspectRatio` to
reserve stable space before a remote image loads. The default fit is `cover`;
`contain`, `fill`, `none`, `scale-down` and native `resizeMode` aliases (including
`repeat`) are supported. Use `tintColor`, rounded/opacity utilities, or numeric
`style` dimensions, border and background properties to customize the image.

Images wait for Rust layout before requesting a decode. The target accounts for
screen pixel density, uses stable size buckets to avoid repeated decodes for tiny
layout changes, and keys the decoded cache by source, size and fit. Resizing keeps
the previous image visible until its replacement is ready without repeating the
primary load callbacks. `onLoad` reports intrinsic source dimensions.

Mark visible, important images with `priority` to load them before ordinary
images. Browser HTML also uses eager loading and high fetch priority for these
images, and respects `loading="lazy"` for other images. Browser hosts replacing
already-visible HTML can set `surface.initialImageWaitMs` on `NTheme` to keep the
fallback visible while the first priority images decode, up to the specified
deadline.

PNG thumbnails stream rows into the destination buffer; JPEG uses scaled decoding
before area filtering. Alpha-weighted filtering preserves transparent edges. WebP
and interlaced PNG currently decode a full bounded frame before resizing. Game
textures loaded through `loadTexture` keep their existing full-resolution behavior.
Use `allowDownscaling={false}` for original-resolution pixels; `none` and `repeat`
also retain original pixels.

A single URI still downloads the original file. To reduce network bytes too,
provide actual CDN variants with dimensions; Rust selects the smallest adequate
variant for the layout and pixel density. NImage does not invent CDN resize URLs:

```tsx
<NImage
  width={160}
  height={160}
  source={[
    { uri: 'https://example.com/cover-256.webp', width: 256, height: 256 },
    { uri: 'https://example.com/cover-512.webp', width: 512, height: 512 },
    { uri: 'https://example.com/cover-1024.webp', width: 1024, height: 1024 }
  ]}
/>
```

Static PNG, JPEG and WebP decode in Rust, with a 4096-pixel limit per dimension
and a 32 MiB encoded-file limit. Animated images display their first frame;
SVG/GIF and progressive image rendering are not supported. `onLoadStart`,
`onLoad`, `onError` and `onLoadEnd` describe the primary source; fallback loading
does not emit a second primary lifecycle. Change `source` or `recyclingKey` to
retry. Rust rejects stale results after a source changes or a view unmounts.

`cachePolicy` accepts `none`, `memory`, `disk` and `memory-disk` (default).
The decoded shared memory cache has a 32 MiB budget; mounted images retain their
own resources. Disk policies use the engine asset cache; `memory` does not read or write disk.
Switching to a disk-backed policy saves available in-memory source bytes without
downloading them again. These saved bytes are reused on later launches or reloads.
Use versioned URLs for immutable cached content, or `source.cache="reload"` to
replace saved bytes. Source `cache` accepts
`reload`, `force-cache` and `only-if-cached`; browser/platform HTTP caches may
also participate. Network/decode jobs are limited to four across UI roots. Queued
images that have been removed or recycled skip network and decoding. Provide `alt` or `accessibilityLabel` for meaningful images; unlabeled
images are decorative to platform accessibility bridges.

### Unicode and fonts

Unicode symbols and colored emoji use cached platform glyphs: CoreText on Apple
platforms, Android Paint, and the browser canvas on web. This includes variation
selectors, skin tones, joined family emoji and flags supported by the platform.
Rust stores the resulting pixels in the egui atlas and wgpu draws them; no emoji
font bundle, network images or JavaScript glyph layout is required. `NText`,
inputs and inline links retain their original Unicode text for accessibility.
`NIcon name="🎮"` also accepts a literal Unicode icon alongside named vector icons.

Engine UI ships without font files. The default text uses installed system fonts on
iOS and Android and the browser's `system-ui` font on the web. Set `NTheme.fonts`
once, using the exported `NThemeFonts` type, to supply your own regular and optional
bold typefaces to Rust-rendered UI:

```tsx
import { NText, NTheme, type NThemeFonts } from 'nayan-ui/components';

const fonts: NThemeFonts = {
  regular: 'https://cdn.example.com/fonts/Interface-Regular.ttf',
  bold: 'https://cdn.example.com/fonts/Interface-Bold.ttf'
};

<NTheme fonts={fonts}>
  <NText className="font-semibold">Shared application typography</NText>
</NTheme>;
```

Font sources use the engine asset loader: URLs on either platform, or Metro
`require('./assets/Interface-Regular.ttf')` identifiers on native. Serve browser
fonts with the required CORS headers. Each file is limited to 6 MiB and must be a
font format accepted by the Rust parser. Loads are shared by source; inherited or
system fonts remain available while loading. Nested themes inherit their parent's
loaded fonts unless they supply their own. The optional bold face serves weights
600 and above; otherwise the regular face is used, including its variable weight
axis when present. System glyphs cover characters missing from the supplied face.
This registers faces with Rust UI surfaces; native navigation, SDK views and other
platform-owned text need their platform font registration. Load failures are logged;
invalid font data reported by a surface reaches its `onError` callback.

CSS-style `style.boxShadow` values are supported on container frames.
`NTheme`’s `surface.overlays` can place an SDK-owned platform view at a named Rust node's bounds;
see [platform interop](#platform-primitives-and-interop).

### Decorative backgrounds

`NPattern` draws decorative vectors directly through Rust/wgpu. Supply a `recipe`
of multistop linear gradients, circles, rounded rectangles, diamonds, paths and an optional
grid. Paths accept `d`, `fill`, `stroke`, `strokeWidth`, `strokeDasharray`, `opacity`,
`x`, `y` and `rotate` (degrees about the translated origin). Coordinates accept logical points, percentages, or `{ percent, offset, min,
maxInset }` for responsive placements bounded inside the viewport. Keep the recipe
at module scope and give the component a bounded size. Rust caches tessellated
geometry until its recipe, dimensions or pixel density change; scrolling needs no
image decode, network request or application frame callback. Patterns are decorative
and do not add accessibility controls.

```tsx
import { NPattern, type NPatternRecipe } from 'nayan-ui/components';

const background: NPatternRecipe = {
  gradients: [{ start: [0, 0], end: ['100%', '100%'], colors: ['#8b5cf620', '#06b6d420'] }],
  shapes: [{ kind: 'circle', cx: '75%', cy: '25%', r: 32, color: '#ffffff18' }],
  grid: { spacing: 40, color: '#00000005' }
};

<NPattern recipe={background} className="h-64 w-full" />;
```

Outside the engine screen, native navigation can use `<NPattern recipe={background}
width={width} height={height} onError={console.error} />`. Rust renders a transparent
PNG on the existing native worker; native Image displays it without a frame loop or
`react-native-svg`. Identical recipes, dimensions and densities share work and a
bounded eight-image cache. Images are capped at 2048 pixels per side and four million
pixels. Theme changes and rotation request new images; platform blur targets can
capture them normally. Width/height can also come from native layout via `style`.

### Sheets, dialogs and confirmations

Dialogs (`NDialog`, including `NConfirm`) fit their Rust-measured content up to
70% of the window height. Sheets fit their Rust-measured content, including changes
while open, up to 90% of the window height. Longer content scrolls inside the
sheet. A supplied first `snapPoints` value caps that height; use `fitContent={false}`
when a fixed snap-point height is required. Sheets sit flush with the screen's
bottom edge, use rounded top corners, and support handle/header drag-to-dismiss (including the body of short action sheets) when
`isSwipeable` and `onOpenChange` allow it. Mandatory sheets without an
`onOpenChange` callback cannot be dismissed by the backdrop or drag handle.
`NTheme` derives presentation insets from its safe-area provider; an explicit
`presentationInsets={{ top, bottom }}` remains available for custom layouts. Native sheet keyboards resize the available body;
the handle remains outside the scrolling content. `surface.background` on `NTheme` sets an
opaque surface clear color for modal content.

```tsx
import { useState } from 'react';
import { NButton, NSheet, NText, NTheme } from 'nayan-ui/components';

function DetailsScreen() {
  const [open, setOpen] = useState(false);
  return (
    <NTheme className="gap-3 p-3">
      <NButton onPress={() => setOpen(true)}>Show details</NButton>
      <NSheet isOpen={open} onOpenChange={setOpen} title="Details" snapPoints={['80%']} showCloseButton={false}>
        <NText>The handle and header still support drag-to-close.</NText>
      </NSheet>
    </NTheme>
  );
}
```

`showCloseButton={false}` hides only the header button; `isSwipeable={false}`
disables drag dismissal. `showsVerticalScrollIndicator={false}` hides the content
indicator without disabling scrolling. `blurred` uses the root theme's configured
presentation backdrop; supply that backdrop in the host application.

Native sheets observe delivered touch events instead of depending on child
responder negotiation. Drag down from the handle/header, or from the body when its
scroll ancestors are at the top. Rust checks the scroll boundary and keeps text
editors, sliders and carousels in control of their own gestures. A downward drag cancels the underlying
surface's pending press before moving the panel. Short/cancelled drags return to
rest, multi-touch cancels a drag, and the stationary backdrop fades with the panel.
Upward gestures and downward gestures in already-scrolled content keep scrolling.
Return content to the top before starting a body drag to dismiss. The native adapter
uses React Native Animated for panel/scrim motion; drawer motion uses its separate
Rust/display-clock implementation. The modal window and keyboard remain platform-owned.

### Tailwind-style customization in Rust

`NView`, `NText`, `NPress` and `NIcon` share the Rust surface and layout system. Browser and native accessibility elements mirror the resulting controls. Use a platform view ref on an explicit SDK attachment when the SDK needs platform measurement.

Use `className` for static layout and palette tokens. Keep runtime measurements,
computed data colors and unsupported shadow/layer properties in `style`; explicit
styles override classes. `NTheme textProps={{ allowFontScaling: false }}` can
scope native text defaults without changing React Native globals; individual
`NText` props override them. Engine layout resolves percentage sizes relative to their container. `NViewRef.captureImage` captures the Rust view bounds. An explicit browser shell uses semantic DOM and its stylesheet.

`className` accepts a supported Tailwind utility subset on both React and React
Native. No CSS, Tailwind or NativeWind runtime is installed or evaluated. Rust
resolves the classes against the active palette, viewport and control state, then
wgpu paints them. Dynamic class strings work without a source scanner or safelist.

```tsx
<NTheme
  theme="system"
  colors={{ 'accent': '#7c3aed', 'accent-foreground': '#ffffff' }}
  themes={{ dark: { 'accent': '#a78bfa', 'accent-foreground': '#18181b' } }}
  radius={8}>
  <NCard className="border-border bg-surface m-4 rounded-xl border p-4">
    <NText className="text-foreground text-xl">Preferences</NText>
    <NButton className="bg-accent text-accent-foreground w-full rounded-lg px-4 py-3 hover:bg-blue-600 disabled:opacity-50">Save</NButton>
  </NCard>
</NTheme>
```

`colors` overrides shared semantic colors within that `NTheme`. `themes.light`
and `themes.dark` override those colors for the selected scheme, with switching
managed in Rust. Nested themes are scoped to their descendants. Use these props
to carry over application-specific CSS variable overrides; existing CSS files
are not read automatically.

| Utilities  | Supported forms                                                                                                                                                                                                                   |
| ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Colors     | `bg-*`, `text-*`, `border-*` with semantic names, Tailwind 4.3.5 default palette colors, hex values such as `bg-[#123456]`, and `/50` opacity suffixes                                                                            |
| Spacing    | `p-*`, `px-*`, `py-*`, side padding; equivalent `m-*` margins including negatives; `gap-*`, `gap-x-*`, `gap-y-*`                                                                                                                  |
| Dimensions | Numeric `w-*`, `h-*`, `min/max-w-*`, `min/max-h-*`; `full`, fractions, arbitrary pixel/rem sizes such as `w-[240px]`                                                                                                              |
| Layout     | `flex-row`, `flex-col`, `flex-wrap`, `flex-nowrap`, `grow`, `grow-0`, `items-start/center/end/stretch`, `justify-start/center/end/between`, `hidden`, `block`, `flex` |
| Position   | `absolute` with `inset-*`, `inset-x/y-*`, `top/right/bottom/left-*`, placed over the parent's padding box after its other children; `relative`                                                                                    |
| Decoration | `rounded`, `rounded-none/sm/md/lg/xl/2xl/3xl/full` and per-side/corner `rounded-t/b/l/r/tl/tr/bl/br-*`, arbitrary radii, numeric border widths, `opacity-*`, vertical `bg-linear-to-b/t` with `from-*`/`to-*`                     |
| Typography | `text-xs` through `text-9xl`, arbitrary `px` and `rem` text sizes, `font-mono`, `font-normal/medium/semibold/bold/extrabold/black`, `leading-*`, `tracking-*`, `uppercase`, `lowercase`, `normal-case`, `text-left/center/right`. Text sizes respect native font scale. |
| Variants   | `dark:`, `light:`, `hover:`, `focus:`/`focus-visible:`, `active:`, `disabled:`, and `sm:`/`md:`/`lg:`/`xl:`/`2xl:` breakpoints; variants can be combined                                                                          |

Base utilities apply before matching variants. Within the same variant priority,
later utilities override earlier values per property; this is not Tailwind's CSS
stylesheet cascade. Explicit numeric `style` props override utility values;
`style.textAlign` and React Native's `textShadowColor`/`textShadowOffset`/`textShadowRadius`
are also read. Rows with `justify-center/end` are positioned from the width they measured
on the previous frame, as are boxes anchored only to the right or bottom (hidden on their
first frame). Font weights use the system font's weight axis, or Roboto's weight files on
Android; text inside `items-center` parents is centered.
Dimensions use logical points, with a four-point spacing unit and a 16-point rem.
The current egui margin representation caps individual padding/margin edges at
127 points; interactive buttons and fields retain a 44-point minimum height.
Hover depends on platform pointer events; touch controls do not retain hover on release.

The runtime supports the utility subset above and ignores unknown classes. Use
`NTheme.fonts` for shared typefaces. Web platform components forward `className`
to the DOM, so an application can use its own Tailwind-generated CSS there. Inside
an `NTheme` browser screen, CSS grid uses the compiled engine stylesheet described below.

### Compiling website classes without Tailwind

Browser platform elements outside a rendered screen can use the engine's build-time class
compiler. Import it from `nayan-ui/styles` in a Node/Bun build script:

```ts
import { buildStyles } from 'nayan-ui/styles';

await buildStyles({
  recipeFiles: ['src/theme.ts'],
  content: ['src'],
  output: 'public/engine/site-styles.json',
  manifest: 'src/app/nayan-ui-styles.ts',
  lowerCss: false
});
```

A recipe module groups engine utilities under reusable selectors:

```ts
import type { EngineStyleRecipes } from 'nayan-ui/styles';

export default {
  rules: [
    { selector: ':root', utilities: '[--accent:#6f3ef4]' },
    { selector: '.project-card', utilities: 'rounded-xl bg-surface p-4' }
  ]
} satisfies EngineStyleRecipes;
```

Serve the generated `browserStyles` string as a stylesheet and use
`browserStylesVersion` in its URL for caching. Pass the generated `stylesheet`
URL to `NTheme` for Rust layout. Use `browserOnly: true` for recipes
that target browser behavior. Projects with a CSS input can still use
`source` and `cssOutput`. Install `lightningcss` when CSS lowering is enabled.

The Rust compiler supports responsive and interaction variants, flex, grid
template tracks and spans, `grid-flow-*`, `auto-rows-*`, `auto-cols-*`, spacing,
sizes, typography, palette/theme colors, borders, gradients and common decorative
utilities. `compileUtilities(classes)` returns `unsupported` tokens
for explicit compatibility checks. This compiler is a supported subset rather
than a replacement for arbitrary Tailwind plugins. Keep complete class names
in scanned source files; dynamic strings inside an engine screen continue to use its
runtime Rust resolver described above. `developStyles(options, command)` watches
sources and regenerates both outputs before starting the development command.
The compiler and CSS parsers are a separate Node build entry and are excluded
from browser and game entry points.

| Option       | Purpose                                                                                       |
| ------------ | --------------------------------------------------------------------------------------------- |
| `root`       | Project directory; defaults to the current working directory                                  |
| `source`     | Optional application CSS input                                                               |
| `recipeFiles` | TypeScript or JavaScript modules exporting utility recipes                                   |
| `content`    | Files/directories scanned for complete utility names; shared engine UI source is also scanned |
| `cssOutput`  | Optional browser stylesheet file                                                            |
| `lowerCss`   | Lower CSS nesting and syntax for older browsers (default true). False requires flat CSS rules |
| `output`     | Generated JSON rules read by the Rust stylesheet layout backend                               |
| `manifest`   | TypeScript output with the JSON URL and browser styles when `cssOutput` is omitted            |
| `publicPath` | Public URL for JSON rules; defaults to `/engine/site-styles.json`                             |
| `font`       | Optional font file embedded in the JSON stylesheet                                            |

`buildStyles()` returns `{ rules, utilities }`. Load the browser stylesheet once in the
application layout and set `stylesheet={stylesheet}` on `NTheme`. Generated files should not be edited manually. With `developStyles`, the
build happens before the supplied development command starts, and source edits
regenerate outputs. Use static complete classes such as `p-3` and `md:grid-cols-2`;
constructing `p-${size}` at runtime does not give the source scanner the final name.
Runtime Rust utilities inside an ordinary UI surface do not need source scanning.

### Responsive layout contract

The existing controls are checked with long labels/content at
240, 320, 768 and 1200 logical-point widths, 1x/2x/3x font scaling, and both web
and native theme defaults. Tests measure actual unclipped layout bounds rather
than accessibility rectangles clipped to the viewport. Sliders and number fields
place captions above their editors, disclosure headers wrap, groups can wrap,
and the root scrolls vertically when content is taller than the surface.

Breakpoints use the engine surface's logical width, which may differ from the
browser window width when a screen is embedded in a smaller panel. Resizing keeps
Rust-owned control values. Give the screen’s layout a bounded responsive size
(`flex: 1` natively, or a bounded height and fluid width on web). Fixed widths,
large minimum widths and intentionally non-wrapping custom rows can still cause
overflow; this is not a full CSS flexbox/grid implementation. Native keyboard,
safe-area and assistive-technology behavior still require device validation.

### Accessibility and platform integration

Inside an engine surface, controls and field chrome are drawn by Rust/wgpu. Browser semantics and
native accessibility elements mirror Rust's computed bounds, names, values and
disabled states. Visible platform text editors paint text, caret, selection and IME
composition immediately, positioned inside the Rust field bounds. Rust owns accepted
values and validation. Outside a surface, platform primitives retain their native/DOM
semantics directly. These bridges are required for browser
assistive technology, VoiceOver/TalkBack and mobile keyboards. Supply a meaningful
`label`, `aria-label` or `accessibilityLabel` for every control, particularly icon
buttons. Native font scale, system appearance and reduced motion are forwarded
to Rust; an explicit `NTheme` preference overrides system appearance.
`NInput type="tel"`, `type="email"` and `type="number"` request the corresponding
native keyboard, and `maxLength` is enforced by Rust and mirrored to the IME bridge.

Use `NImage` for previews, `NDatePicker` for local calendar values, and the engine
`imagePicker` module for OS photo selection. File preprocessing, request payloads,
submission and application data remain the host's responsibility. Keep meaningful
labels on fields and surface actionable errors through the shared feedback controls.

Automated tests cover state, disabled/read-only enforcement, cancellation,
activation, reconciliation and import isolation. Full VoiceOver/TalkBack and
native keyboard/IME device validation remains required before production use.

### Virtualized lists

`NList` supports fixed-height rows and Rust-measured variable-height rows, including grids. Rust owns scrolling,
initial/visible ranges, scroll targeting and clamping, end thresholds, callback
deduplication, viewport clipping and row placement. React mounts only the requested window plus
`overscan` rows on each side; the dataset stays in JavaScript. Per-pixel scrolling
does not invoke application row renderers, and retained rows are memoized by stable
item key. The private React adapter retains only a read-only Rust row-window
snapshot and forwards imperative scroll intents; it does not calculate list
geometry or notification policy.

```tsx
import { NCard, NList, NText, NTheme } from 'nayan-ui/components';

<NTheme surface={{ style: { height: 520 } }}>
  <NList
    data={players}
    itemSize={64}
    height={480}
    keyExtractor={(player) => player.id}
    renderItem={({ item }) => (
      <NCard height={64} className="w-full justify-center rounded-none px-4 py-0">
        <NText>{item.name}</NText>
      </NCard>
    )}
    ListEmptyComponent={<NText>No players yet.</NText>}
    onEndReached={() => loadNextPage()}
  />
</NTheme>;
```

| Prop                                        | Behavior                                                                                                    |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `data`, `renderItem`, `keyExtractor`        | Required typed dataset, row renderer and stable string key                                                  |
| `itemSize`                                  | Optional exact row height; omit to let Rust measure content                                                 |
| `height`                                    | Bounded viewport height; defaults to up to 400 points                                                       |
| `overscan`                                  | Buffered rows on each side; defaults to 6                                                                   |
| `initialNumToRender`, `initialScrollIndex`  | Initial row window and initial position                                                                     |
| `extraData`                                 | Refresh mounted rows when an external value changes                                                         |
| `ItemSeparatorComponent`, `separatorSize`   | Separator element/component and its reserved height inside each row (default 1 point)                       |
| `ListHeaderComponent`, `headerSize`         | Scrolling header element/component and its exact height                                                     |
| `StickyHeaderComponent`, `stickyHeaderSize` | Header below the scrolling header, pinned at the top while scrolling                                        |
| `onStickyHeaderChange`                      | Reports when the sticky header becomes pinned or unpinned                                                   |
| `showsVerticalScrollIndicator`              | Show the native scroll indicator (default true)                                                             |
| `ListEmptyComponent`                        | Element/component displayed when the dataset is empty                                                       |
| `onVisibleRangeChange`                      | Reports inclusive `{ first, last }` indices; both are -1 when empty                                         |
| `onEndReached`, `onEndReachedThreshold`     | Load more near the end; threshold is a viewport-height fraction (default 0.5)                               |
| `ref`                                       | `NListRef` with `scrollToIndex({ index, viewPosition? })`, `scrollToOffset({ offset })` and `scrollToEnd()` |

`viewPosition` is 0 at the top, 0.5 in the middle and 1 at the bottom. End callbacks
are deduplicated for the current item count until the user leaves the threshold;
appending data permits another callback. Guard concurrent network requests in the
loader. Rows leaving the buffered window unmount, so keep editable/selected state
in your data or store, and replace changed items immutably. Keep `renderItem` and
`keyExtractor` stable when practical. The engine's 5000 live-node limit applies to
the mounted window, rather than the dataset; the list accepts up to one million items.

Omit `itemSize` and optionally provide `estimatedItemSize` (default 96) for natural-height
content. Rust maintains measured row heights and prefix sums; appending a page preserves
the current position. `numColumns` groups items in Rust, sizing each grid row to its tallest cell.
`ListHeaderComponent`, `ListFooterComponent` and `ListEmptyComponent` are measured automatically
in this mode. `fillViewport` uses the remaining screen height (default for measured lists).
`onRefresh` and `refreshing`, or an `NRefreshControl` passed as `refreshControl`, enable
Rust-owned pull-to-refresh detection. Horizontal lists and animated imperative scrolling
are not implemented. Fixed-height row content is clipped to `itemSize`. Platform `overlays` inside rows are clipped
to the visible list area, below its sticky header. Pass their IDs in
`surface.scrollableOverlays` on `NTheme` to forward vertical drags to the list while preserving
native taps (for example, native ad SDK views). Large scroll jumps while JavaScript is busy
can briefly expose rows before their React descriptions arrive. Browser arrow,
Page Up/Down and Home/End keys and native accessibility paging scroll the Rust
viewport. Native builds must rebuild the Rust core and host app to recognize `NList`.

### Safe areas

Import `NSafeArea`, `NSafeAreaProvider`, `useNSafeAreaInsets` and
`useNSafeAreaFrame` from `nayan-ui/components`. The provider observes its native
window position and system insets; Rust normalizes the measurements and applies
edge spacing. It does not initialize rendering or audio. Rebuild the native app
after adding this API.

```tsx
<NSafeAreaProvider>
  <NSafeArea edges={['top', 'left', 'right']} style={{ flex: 1 }}>
    <App />
  </NSafeArea>
</NSafeAreaProvider>;

const { top, bottom, left, right } = useNSafeAreaInsets();
const { x, y, width, height } = useNSafeAreaFrame();
```

All four edges default to additive padding. Select edges with an array, or use
`edges={{ bottom: 'maximum' }}` with `style={{ paddingBottom: 16 }}` to keep at
least 16 points below content. `mode="margin"` applies the same rules to margins;
`'off'` preserves existing spacing. Use numeric `style` spacing outside a
an engine screen; inside one, Rust also resolves class-based spacing and the hooks
inherit their app provider. `NSafeAreaListener` reports local geometry without
creating a new context. Add a provider around independently positioned native
modal content when it needs its own frame. Insets exclude the software keyboard;
use `NKeyboard` for keyboard avoidance.

Browsers read CSS `env(safe-area-inset-*)` and normalize provider-relative frames
through the same WASM core, without starting WebGPU. Server rendering starts with
zero metrics. Playtura maps Expo Router's legacy safe-area imports to the engine's
compatibility adapter in its own Metro config; other apps are unaffected.

### Drawer

`NDrawer` presents a side panel around native React content or browser DOM content.
Mount it around your existing navigator or around an `NTheme` screen. Routing, headers, tabs,
deep links and screen state remain with the host router.

```tsx
import { NDrawer, useNDrawer } from 'nayan-ui/components';

<NDrawer width={300} drawerContent={<AppMenu />}>
  <YourNavigator />
</NDrawer>;

// Inside a menu button or AppMenu:
const { isOpen, open, close, toggle } = useNDrawer();
```

Rust owns edge eligibility, direction locking, drag progress, fling decisions and
settling, using the engine's easing functions. Android Choreographer and iOS
CADisplayLink apply the samples directly to native views; browsers sample the same
Rust state through WASM. There is no React Native Animated/Reanimated/Worklets
animation and no native per-frame JavaScript callback. Ordinary vertical scrolling
is preserved. The closed panel is hidden from hit testing/accessibility; Back and
Escape dismiss an open panel, and reduced motion follows the OS preference.

Options include `side`, `width`, `edgeWidth` (24 by default), `swipeEnabled`,
`enabled`, `overlayColor`, `drawerStyle`, `defaultOpen`, or controlled `isOpen` with
`onOpenChange`. Close the drawer when your host route changes or loses focus.
Rebuild the Rust core and native app after adding the drawer view. The engine
does not depend on a navigation library.

### Featured carousel

`NCarousel` provides horizontal or vertical paging, snapping, accessible indicators
and autoplay in Rust. `orientation` defaults to `horizontal`; use `vertical` for
height-based paging. Import it with other components from `nayan-ui/components`. Its children
are pages; give the carousel a bounded `width` and `height`.

```tsx
<NCarousel width={360} height={240} autoPlay interval={5000} accessibilityLabel="Featured games">
  <NCard>
    <NText>Discover new games</NText>
  </NCard>
  <NCard>
    <NText>Play your favorites offline</NText>
  </NCard>
</NCarousel>
```

`defaultValue` sets the initial page; `value` and `onValueChange` support controlled
selection. `showIndicators` defaults to true. Autoplay pauses while interacting and when the carousel leaves the visible area.
Slide animations respect the reduced-motion setting. `indicatorPlacement="overlay"` draws the
dots over the slides (`indicatorInset` from the bottom, `indicatorGap` apart, in
`indicatorColor` with an optional `indicatorShadowColor`) instead of in a strip below them.

Set `autoPlay={false}` when the host screen loses focus or the app backgrounds.
For horizontal carousels inside `NList`, vertical swipes scroll the parent list;
horizontal swipes change slides. `NScrollShadow orientation="horizontal"` supports category
rows using the same gesture routing.

### Icons

Use the `/icons` entry for Lucide artwork or `NIcon` from `/components`
for custom paths, Unicode symbols and the small built-in icon set.

#### Custom artwork

`NIcon` draws SVG path data at the requested logical size. Supply `paths`,
`viewBox` and optional `strokeWidth`, then set `color` or a `text-*` class.

```tsx
import { NIcon } from 'nayan-ui/components';

<NIcon size={14} viewBox={24} strokeWidth={2} paths={['M5 21h14']} className="text-action-foreground" />
```

#### Built-in Lucide icons

```tsx
import { NIcon, type NIconName } from 'nayan-ui/icons';

const homeIcon: NIconName = 'house';
<NIcon name={homeIcon} size={24} color="#7654d1" />;
<NIcon name="gamepad-2" size={20} />;
```

The icons module includes Lucide 1.76.0 outlines, including upstream aliases. It also
exports `lucideIcon(name)` for access to the vector paths. `NIcon` resolves dynamic
names using the full catalogue. The `/components` entry has no dependency on that catalogue.
In Metro, `nayan-ui/icons/catalog` gives dynamic callers the catalogue by itself.
Import `NIcon` from `nayan-ui/components` to use custom `paths`, Unicode symbols,
or the small control icon set without including the full catalog.

Tree-shaking bundlers can import named components from `nayan-ui/icons`.
The `nayan-ui/icons/named` entry also exports those components.

```tsx
import { HeartIcon, SearchIcon } from 'nayan-ui/icons';

<HeartIcon size={20} color="#7654d1" />;
<SearchIcon size={20} />;
```

Use direct component imports to keep Metro bundles limited to the requested icons,
even without tree shaking.

```tsx
import { HeartIcon } from 'nayan-ui/icons/components/heart';

<HeartIcon size={20} />;
```

Import outline data from `nayan-ui/icons/<name>` for custom rendering.
Each outline contains its paths, viewBox and stroke width.

```tsx
import heart from 'nayan-ui/icons/heart';
import { NPathIcon } from 'nayan-ui/icons/outline';

<NPathIcon {...heart} size={20} color="#7654d1" />;
```

Use Lucide's kebab-case names; PascalCase names such as `Gamepad2` also work.
`NIconName` is exported for typed icon-name data. Named icons use Lucide's standard
24-unit grid, 2-unit strokes and rounded caps/joins. The named icon set is fixed;
icon-font loaders and theme icon registries are no longer public APIs.

Rust draws the requested vector on the app surface. Explicit browser HTML uses inline SVG. Unknown names show a question-mark icon and report through `onError` when supplied. Explicit paths and Unicode symbols are supported. Lucide does not include brand logos.

The vendored source includes the upstream ISC and Feather MIT notices in
`src/components/icons/LICENSE.lucide`. Maintainers can reproduce it with
`python3 scripts/import-lucide.py`, which verifies the pinned npm archive's
SHA-512 integrity before converting SVG primitives to paths.

### Text selection and copying

Browser page text supports drag selection, double-clicking words, triple-clicking
paragraphs, Shift-click extension and Cmd/Ctrl+A. Copy uses the browser clipboard
(Cmd/Ctrl+C) or the engine's right-click Copy menu. Touch screens support a
long press, selection handles and Copy. Glyph hit testing, ranges, auto-scrolling and visible
highlights stay in Rust; the web host only mirrors the selected plain text for
browser clipboard commands. Inputs keep their native editing/selection behavior.
Use `selectable={false}` on text/containers or CSS `user-select: none` to opt out.

## Shared modules

Import each service from its own `nayan-ui/<feature>` entry. Services
can run independently of a renderer. The host owns endpoints, credentials,
storage namespaces and business rules. Use the host's HTTP client for API
requests and `/network` for connection status and optional endpoint checks.

| Entry | Common operations | Platform limits |
| --- | --- | --- |
| [`/assets`](#asset-loading) | Resolve bundled and URL sources, read bytes, prefetch, reload and evict | Reads up to 128 MiB with platform-specific cache storage |
| [`/files`](#private-files) | Private directories, binary and UTF-8 reads and writes, stat, list, remove and temporary exports | 64 MiB per file. The browser uses IndexedDB and its quota. |
| [`/storage`](#application-storage) | Namespaces, primitives, binary data, JSON, subscriptions, React hooks and durable flush | Plaintext. One native process owns each store. Browser localStorage quotas apply. |
| [`/sqlite`](#sqlite) | Named and in-memory databases, bound parameters, scoped connections and atomic batches | Web persistence uses a secure-context worker and OPFS with one connection per name. |
| [`/uuid`](#uuid-utility) | Secure UUID v4 | Browser uses Web Crypto. |
| [`/network`](#connectivity) | Connection state, subscriptions, a React hook, cancellations and endpoint checks | The host supplies any health endpoint. Link state can be unknown. |
| [`/permissions`](#permissions) | Individual and batched checks and requests, Android manifest names and settings navigation | Host declarations and platform prompt rules apply. |
| [`/location`](#location) | Foreground fixes, watches, cancellation and permission helpers | Native watches end in the background. Web access requires a secure context. |
| [`/device`](#device-environment) | Identify a physical device, emulator, simulator or browser | Browser reports its own environment. |
| [`/audio`](#audio-playback) | Decode WAV, cache sound banks, play concurrent voices, seek and mix, analyze and shift sounds | Decoded WAV mixer. |
| [`/microphone`](#microphone-and-audio-processing) | Permission, status, level and bounded takes with loudness samples | Mono in-memory takes. Host declarations and platform permission apply. |
| [`/tts`](#system-speech) | System voices, language, queue, rate, pitch, volume and stop | Android lacks the system pause and resume operations. |
| [`/haptics`](#sound-and-haptics) | Impacts, selection, notification presets and custom sequences | Hardware support varies. |
| [`/camera`](#camera) | Permission, native system capture, web preview, image output and release | Native uses the image-picker feature. Web access requires a secure context. |
| [`/video`](#video) | Inline playback, controls, seek, loop, mute, volume, speed, status and progress | Foreground playback. Codecs and controls vary by platform. |
| [`/image-picker`](#image-picker) | Photo library, camera, crop, JPEG and PNG, multi-selection and release | Image outputs are temporary. Browser camera selection is a hint. |
| [`/clipboard`](#clipboard) | Read and write text, write HTML with a text alternative, check and clear | Platform clipboard permissions apply. |
| [`/sharing`](#sharing) | Share text, URL or one file, with titles and an optional iPad anchor | Outbound system sheet. Dismissal resolves normally. |
| [`/capture`](#screen-capture) | Capture engine surfaces in a native screenshot or a picked browser display | PNG output. Browser capture requires user permission. |
| [`/keep-awake`](#keep-awake) | Tagged leases, foreground ownership and a React hook | The browser requires support and a visible document. |
| [`/review`](#store-review) | Request a native store review | The store decides whether to show a prompt. |
| [`/components` safe areas](#safe-areas) | Providers, measurements, listeners, edge modes and spacing | Native uses numeric insets. Web supports CSS environment values. |

### Asset loading

```ts
import { assets } from 'nayan-ui/assets';

const source = require('./assets/model.glb'); // Native; use an imported URL in browsers.
const info = assets.resolve(source); // URI, name, type, dimensions, density and Metro hash.
const { bytes } = await assets.load(source);
await assets.prefetch([source, 'https://example.com/image.png']);
await assets.evict(source);
```

Use `clearAssetCache()` from the same entry for a settings action that clears
the shared byte and procedural cache. Existing worlds and loaded handles can
still use resources registered for the session. Apps own custom cache adapters.

`assets.read(source)` returns only the `ArrayBuffer`; `load`/`read` also accept
`{ reload: true }`. Source bytes share the engine's 16 MiB / 128-entry memory cache,
concurrent-request deduplication and checksummed Rust disk cache. Bundled identities
include their content hash and density. Native packaged resources, file URLs and
Android content/asset URIs are read on workers without temporary copies to disk.
Each read is limited to 128 MiB. Failed requests can be retried. Browser sources use
URLs and the existing engine browser cache. No render surface or manual warm-up is needed.
This API returns bytes and metadata; it does not register fonts with React Native Text
or provide an Expo Asset class/localUri compatibility layer. Rebuild native hosts after upgrading.

Expo hosts may still install `expo-asset` and `expo-font` transitively through the Expo SDK;
the engine itself neither imports nor requires those packages.

### Private files

```ts
import { files } from 'nayan-ui/files';

const drafts = await files.openDirectory('drafts');
await drafts.writeText('project.json', JSON.stringify({ version: 1 }));
const saved = await drafts.readText('project.json');
const entries = await drafts.list();
const info = await drafts.stat('project.json'); // name, size in bytes and modifiedAt in milliseconds
const removed = await drafts.remove('project.json'); // true when an existing file was deleted
```

Directories use lowercase ASCII namespaces. Supply a single filename for each
operation. It can contain spaces and Unicode. `write` accepts an `ArrayBuffer`
or view and `read` returns bytes. `writeText` and `readText` use UTF-8. Writes
replace the file atomically, and missing reads or metadata return `undefined`.
Private files are limited to 64 MiB each. The web implementation uses IndexedDB
and follows browser storage quotas. For share sheets and other URI consumers,
use [temporary files](#temporary-files).

### Temporary files

```ts
import { files } from 'nayan-ui/files';
import { sharing } from 'nayan-ui/sharing';

const uri = await files.writeTemporary(pngBase64, { fileName: 'post.png', mimeType: 'image/png' });
try {
  await sharing.share({ uri, mimeType: 'image/png', fileName: 'post.png' });
} finally {
  await files.removeTemporary(uri);
}
```

`writeTemporary` accepts plain, padded base64 and returns an engine-owned file URI
on iOS/Android or a Blob URL in browsers. Native decoding and disk I/O run on a serial
worker; atomic publication prevents readers seeing partial files. Filenames are unique,
files are limited to 64 MiB, and each native cache is limited to 256 MiB / 1,024 files.
Native writes prune files older than 24 hours. Browsers enforce the same size/count
budgets and revoke owned Blob URLs on removal. Callers keep ownership until their
consumer finishes; missing-file removal is idempotent. Native removal rejects foreign
paths and directories; browsers revoke only URLs created by this module.
This temporary cache is separate from application storage and the engine asset cache.
No storage permissions or render surface are needed. Rebuild native hosts after upgrading.

Use `assets.read` for source bytes and `sharing.share({ uri: remoteUrl })` to share a
remote file: the existing native share adapter downloads and stages its own bounded
copy, so apps do not need a separate download-to-cache step.

### Application storage

```ts
import { createStorage } from 'nayan-ui/storage';

const storage = createStorage({ id: 'my-app' });
storage.setJSON('settings', { sound: true });
const settings = storage.getJSON<{ sound: boolean }>('settings');
storage.remove('settings');
```

The same API works in React Native and browsers: `set`, `getString`, `getNumber`,
`getBoolean`, `contains`, `remove` (`delete` alias), `getAllKeys`, `clearAll`,
`subscribe` and `flush`. Values are strings, numbers, booleans or binary buffers.
`set` also accepts typed-array/DataView slices; `getBuffer` returns an independent copy.
`setJSON` and `getJSON<T>` serialize/parse structured JSON; malformed data throws.
Generic JSON types describe expected data and do not validate or revive Dates/classes. Missing keys or mismatched types return `undefined`. Instances
with the same ID share data, and `clearAll` affects only that ID. No engine warm-up or
platform checks are required.

```tsx
'use client'; // For Next.js; the hook also works in React Native.
import { createStorage, useStorage } from 'nayan-ui/storage';

const preferences = createStorage({ id: 'my-app' });
function SoundToggle() {
  const [sound, setSound] = useStorage('sound', true, preferences);
  // setSound(false), setSound(current => !current), or setSound(undefined) to remove.
  return null; // Connect sound and setSound to your platform's UI controls.
}
```

`useStorage(key, defaultValue, storage?)` returns a typed value and setter. Without a
store it uses the shared default ID. It reacts to writes/removals/clears from any
instance of the same ID; browsers also receive updates from other tabs. Server
rendering returns the supplied default without reading browser storage.
`useStorageJSON(key, defaultValue, storage?)` provides the same reactive and functional
setter behavior for JSON objects, arrays and null. Its snapshots compare the serialized
value, so an unchanged object does not cause an update loop. JSON uses standard
`JSON.stringify` semantics; use plain JSON data, and validate external data as needed.

Native storage uses a Rust in-memory index and a checksummed, append-only memory-mapped
file in the app's durable private directory, separate from the asset cache. It grows
as needed and compacts obsolete records automatically. Sets are buffered: recent
writes can be lost on power failure until `flush()` completes. The engine flushes on
app background and inactive transitions. Removal, clearing and MMKV import flush
before returning. Call `flush()` explicitly at other durability boundaries. Corruption
inside flushed data is reported rather than silently resetting or restoring deleted
sessions; an interrupted buffered tail can be discarded during recovery. Each file
has one process owner; another process receives an explicit error. Multiple instances
and JS runtimes in the same native process share the Rust store.

Browsers use synchronous localStorage; `flush()` needs no extra operation. Storage
access/quota errors propagate to callers. Direct reads during server rendering are
unsupported. Native applications must be rebuilt after updating the Rust core.

The store is plaintext. Use the optional one-time, read-only importer for an
existing unencrypted MMKV string store.

```ts
const migrated = createStorage({ id: 'my-app', importMMKVStrings: 'mmkv.default' });
const previousSettings = migrated.getJSON('settings');
```

The source ID identifies a legacy store in the application's default MMKV location;
web imports its legacy localStorage prefix. Existing engine values win. The source
is retained, and a completion marker outside the destination namespace prevents
`clearAll()` from importing deleted values again. Native import verifies checksums
and parses the complete source before applying records. Encrypted, expiring,
unsupported-version and non-string native records are rejected. This is not a
full MMKV API or custom-path migration; validate decoded JSON and own application
schema/session recovery in the host. Rebuild native storage support before opting in.

#### Query persistence

```ts
import { createStorage, createStoragePersister } from 'nayan-ui/storage';

const storage = createStorage({ id: 'query-cache' });
export const persister = createStoragePersister({ storage, key: 'app-queries' });
```

`createStoragePersister<T>()` provides `persistClient`, `restoreClient`,
`removeClient` and `flush`. It implements the TanStack Persister contract.
The default key is `REACT_QUERY_OFFLINE_CACHE`. Writes coalesce, serialize in
order and flush native storage. Removal waits for an in-flight write and
discards queued snapshots. Pass `onError` to handle background write errors.
Explicit `flush` still reports failures. The host owns cache expiry and
invalidation when the session or schema changes.

### SQLite

```ts
import { sqlite } from 'nayan-ui/sqlite';

const first = await sqlite.withDatabase('notes', async (db) => {
  await db.run('CREATE TABLE IF NOT EXISTS notes (title TEXT NOT NULL)');
  await db.batch([
    { sql: 'INSERT INTO notes (title) VALUES (?)', params: ['First note'] },
    { sql: 'INSERT INTO notes (title) VALUES (?)', params: ['Second note'] }
  ]);
  return db.get('SELECT title FROM notes ORDER BY rowid LIMIT 1');
});
const title = first?.[0];
```

Use `sqlite.open()` or `sqlite.open(':memory:')` for an ephemeral database.
Call `close()` when you own the connection directly. `withDatabase` closes it
when the callback returns or throws. Use `batch` for a transaction.
Named databases use app-private files on React Native and OPFS on the web.
Browser operations run in a dedicated worker. Named databases require a secure
context with OPFS sync access handles and permit one open connection per name
across tabs. Close the connection to reopen it elsewhere. If storage is unavailable,
opening a named database rejects. Rebuild native hosts to include the SQLite bridge.

`run` and `batch` accept statements that return no rows. `query` accepts one
read-only statement and returns buffered `{ columns, rows }` in column order.
`get` returns the first row or `undefined`. Bind SQL values as `null`, strings,
numbers, `bigint` or `Uint8Array`. Large integers are returned as `bigint`.
SQLite allows schema version and application ID updates, with connection
settings managed by the module.

### UUID utility

```ts
import { uuid } from 'nayan-ui/uuid';

const id = uuid();
```

`uuid()` generates a lowercase UUID v4 using secure randomness. Native uses the Rust
UUID bridge and the browser uses Web Crypto. `prepareUuid()` is an optional
availability check. UUID generation requires no world, surface or WASM warm-up.

### Connectivity

Use `network.waitForOnline` when work can wait for a reported connection.

```ts
import { network } from 'nayan-ui/network';

export async function syncWhenOnline(sync: () => Promise<void>, signal?: AbortSignal) {
  if (await network.waitForOnline({ timeoutMs: 10_000, signal })) await sync();
}
```

The default deadline is 30 seconds. The wait returns `false` at the deadline
and rejects on cancellation. Use `checkReachability` to check a specific service.

```ts
import { checkReachability } from 'nayan-ui/network';

const reachable = await checkReachability({
  url: 'https://api.example.com/health',
  expectedStatus: 204,
  timeout: 5000
});
```

Reachability checks response status through platform fetch. No default vendor endpoint
is contacted. The default request is HEAD and accepts a 2xx response. GET, headers,
AbortSignal and an exact expected status are configurable.
Timeouts/transport failures return false; invalid options and explicit caller
cancellation reject. Reachability is independent of the online hook and does not
start polling or change its connection-state snapshot. Browser CORS still applies.

```tsx
import { network, useOnline } from 'nayan-ui/network';

const online = await network.fetch(); // boolean | null
const unsubscribe = network.subscribe((online) => console.log(online));
unsubscribe();

function ConnectionStatus() {
  const online = useOnline();
  return <span>{online === null ? 'Checking connection' : online ? 'Online' : 'Offline'}</span>;
}
```

This is a small connectivity API inspired by [NetInfo](https://github.com/react-native-netinfo/react-native-netinfo#netinfostate).
`true` means a connection is available, `false` means disconnected, and `null` means
unknown. It uses Apple's Network path monitor, Android's default-network callbacks,
and browser `navigator.onLine` plus online/offline events. These signals do not
guarantee that the internet or your API server is reachable (for example, behind a
captive portal). There are no endpoint probes, polling, Wi-Fi details or location
permissions. Android's normal `ACCESS_NETWORK_STATE` permission is included by the
engine; no runtime prompt is needed.

Listeners and hooks share one lazy observer, which stops when the last subscriber
leaves. A one-off `fetch()` shares that observer when present, otherwise starts a
temporary watch; it returns `null` after five seconds if the platform never reports.
Native monitoring refreshes on foreground return. Server rendering returns `null`.
Neither platform needs engine warm-up. Reinstall pods and rebuild the native host
after adding this module.

### Permissions

```ts
import { permissions } from 'nayan-ui/permissions';

const current = await permissions.check('notifications');
const media = await permissions.checkMany(['camera', 'microphone']);

// Call from a foreground user action.
const answer = await permissions.request('notifications');
if (answer.requiresSettings) {
  await permissions.openSettings('notifications');
}

// Use the full manifest name for platform or vendor permissions on Android.
const sms = await permissions.check('android:android.permission.READ_SMS');
```

`permissionNames` lists the built-in names. Both `check` and `request` return
`{ status, canAskAgain, requiresSettings? }`. Status can be `granted`, `limited`,
`prompt`, `denied`, `unknown`, or `unavailable`. Limited access covers cases
such as selected photos, provisional notifications, or approximate location.
`canAskAgain` is `null` when the platform cannot determine whether it can
prompt again. `check` never opens a prompt. `openSettings` resolves to whether
the OS opened settings. Check the permission again after the user returns.

`checkMany(names)` and `requestMany(names)` return maps keyed by permission and
deduplicate names. `requestMany` requests permissions in order. Start requests
from a user action and account for platform rules around subsequent prompts.

| Platform | Supported access |
| --- | --- |
| Android | Camera, microphone, notifications, foreground and background location, photos, video and audio media, storage, media location, contacts, calendars, Bluetooth, nearby Wi-Fi and local network, activity recognition, body sensors, phone, call logs and SMS. |
| Android special access | Overlay, system write settings, exact alarms, all-files access, unknown-source installs, notification listener, Do Not Disturb, usage access, and battery-optimization exemption. Full-screen notifications, media management, and accessibility services are available under their Android manifest names. |
| iOS | Camera, microphone, notifications, foreground and background location, photos and videos, add-only photo access, contacts, calendars, calendar write-only access, reminders, Bluetooth, motion, speech recognition, tracking, Apple Music library, HomeKit, and Siri. |
| Web | Camera, microphone, notifications, location, persistent storage, motion where supported, and clipboard permission checks where the browser exposes them. |

**Android.** Declare each required permission in the host manifest or Expo
`android.permissions`. The `android:<manifest-name>` form checks declared
permissions and prompts for runtime permissions when the OS allows it.
OS versions, target SDK, device policy, app roles and installer restrictions
still control eligibility. Declare coarse and fine location together to
request precise location. Request foreground access before background location
or body sensors. Settings-only access returns `requiresSettings: true` when
disabled. Call `openSettings(name)` to open the matching screen. Ordinary
permissions use the app's settings screen.

**iOS.** Supply the host's usage descriptions in Info.plist or Expo
`ios.infoPlist`. Missing usage descriptions return `unavailable`.

| Permission | Usage description |
| --- | --- |
| Camera and microphone | `NSCameraUsageDescription`, `NSMicrophoneUsageDescription` |
| Location | `NSLocationWhenInUseUsageDescription`; add `NSLocationAlwaysAndWhenInUseUsageDescription` for background access |
| Photos and videos | `NSPhotoLibraryUsageDescription`; `NSPhotoLibraryAddUsageDescription` for add-only |
| Contacts | `NSContactsUsageDescription` |
| Calendar and reminders on iOS 17+ | `NSCalendarsFullAccessUsageDescription`, `NSCalendarsWriteOnlyAccessUsageDescription`, `NSRemindersFullAccessUsageDescription` |
| Calendar and reminders on earlier iOS | `NSCalendarsUsageDescription`, `NSRemindersUsageDescription` |
| Bluetooth and motion | `NSBluetoothAlwaysUsageDescription`, `NSMotionUsageDescription` |
| Speech, tracking, music | `NSSpeechRecognitionUsageDescription`, `NSUserTrackingUsageDescription`, `NSAppleMusicUsageDescription` |
| HomeKit and Siri | `NSHomeKitUsageDescription`, `NSSiriUsageDescription` and the corresponding host capabilities |

iOS can defer a background location upgrade. `location-coarse` accepts reduced
accuracy. The permission prompt follows the host's accuracy configuration and
the user's choice. The result reflects the access
observed at completion. A HomeKit check before the first requested access can
return `unknown`, because starting HomeKit can trigger the prompt. Local network
access on iOS is decided during the app's protected network operation. It has
no general query or prompt API. Health records, biometric authentication, managed
entitlements, and special system roles use their own capability-specific APIs.
[Apple's local network guidance](https://developer.apple.com/documentation/technotes/tn3179-understanding-local-network-privacy)

**Web.** Use a secure context and allow the capability in Permissions Policy.
Camera and microphone requests briefly open a stream and then stop all tracks.
Location requests discard position data. Clipboard permissions are checked
without reading or writing clipboard contents. Browsers control their own
settings UI, so `openSettings` returns `false` on web. Server-side calls for
permission status return `unavailable`.

Reinstall iOS pods and rebuild native hosts after upgrading this module.

### Location

Import `location` from `nayan-ui/location`.
Rust validates coordinates and normalizes optional fields from Android LocationManager,
iOS Core Location, and browser Geolocation. Location requests use the platform
provider directly and require no game world, render surface or Google Play Services.

```ts
import { location } from 'nayan-ui/location';

const permission = await location.requestPermission();
if (permission.status === 'granted' || permission.status === 'limited') {
  const position = await location.getCurrentPosition({ highAccuracy: true, timeoutMs: 12000 });
  console.log(position.latitude, position.longitude, position.accuracy);
}
```

Use `location.getPermission()` to check without prompting. Both permission helpers
accept `'approximate'` for a coarse permission request or check on Android.
On the web, a direct position request can display the browser's prompt. The page
needs a secure context and permission under the embedding page's `geolocation`
Permissions Policy.

```ts
const controller = new AbortController();
const stop = location.subscribe(updateMap, {
  signal: controller.signal,
  onError: (error) => showLocationError(error.code)
});
// Call cleanup when the user leaves this screen.
stop();
```

`subscribe` and `watchPosition` deliver the first fix and subsequent updates as
the platform reports them. Both the one-time and streaming APIs accept an
`AbortSignal`. The first-fix deadline defaults to 15
seconds. A watch ends on terminal errors or when a native app leaves the foreground.
Call it again to resume after foregrounding. `LocationError.code` is
`permission-denied`, `unavailable`, `timeout`, or `aborted`. Calling the watch
cleanup function ends it silently. Accuracy and altitude are in meters, timestamp
is epoch milliseconds, and altitude, vertical accuracy, heading, and speed can
be null. `await location.isAvailable()` checks for the provider and the compiled
feature. A fix still requires enabled location services and permission.

For an Expo host, set `locationPermission` on the `nayan-ui` config plugin
to your user-facing purpose string and regenerate the native projects. If you
select native or WASM features explicitly, include `location`, which enables
`permissions`. Bare hosts declare `NSLocationWhenInUseUsageDescription` on iOS and
`ACCESS_COARSE_LOCATION` and `ACCESS_FINE_LOCATION` on Android, then rebuild. Declare
only coarse access on Android if your application only needs approximate location.

### Device environment

```ts
import { device } from 'nayan-ui/device';

device.getEnvironment(); // 'physical' | 'emulator' | 'simulator' | 'browser'
device.isPhysicalDevice();
device.isVirtualDevice(); // Android emulator or Apple simulator.
```

These synchronous utilities need no permissions, render surface or engine warm-up.
Native results are cached for the process. iOS uses the compiler's simulator target;
Android checks public OS build signatures, independently of debug/release mode or CPU
architecture. Android detection is a compatibility heuristic and cannot prove hardware
integrity. Browsers report `browser`, with both predicates false: user-agent strings do
not reliably identify physical hardware. Missing native support reports a rebuild error.

Playtura uses `isPhysicalDevice()` for its existing push-registration guard. It no
longer requires `expo-device`; notification delivery/permissions remain with the host SDK.
Reinstall pods and rebuild native hosts after upgrading this bridge.

### Audio playback

`audio.loadSound(source)` loads a session-cached WAV from an asset or URL.
`audio.decodeWav(bytes)` loads caller-owned WAV bytes from a file or other
source. Release sounds created by `decodeWav` when finished.

```ts
import { audio } from 'nayan-ui/audio';

const sound = await audio.loadSound('/sounds/ambience.wav');
const voice = audio.play(sound, { loop: true, volume: 0.5 });
if (voice && audio.canControlVoices) {
  audio.pause(voice);
  audio.seek(voice, 2);
  audio.setVoiceMix(voice, 0.25, -0.2);
  audio.resume(voice);
}
```

Live controls queue changes on the mixer and return whether it accepted the
command. They require the audio feature and a native build with the new bridge.
`audio.stopAll()` stops the entire mixer, including paused voices and loops.

### Microphone and audio processing

Recording, levels, takes and sound processing share the Rust audio core on native
and web. Prepare the browser bridge before direct calls, then request permission:

```ts
import { warmUpEngine } from 'nayan-ui/games';
import { audio } from 'nayan-ui/audio';
import { microphone } from 'nayan-ui/microphone';

async function startListening() {
  await warmUpEngine(); // Reuses an existing game/UI initialization when present.
  if (!microphone.supported || !(await microphone.requestPermission())) return false;
  return microphone.start({ maxSeconds: 10 });
}

function finishRecording() {
  const recording = microphone.take(3, { skipEnd: 0.2, levelsPerSecond: 30 });
  microphone.stop();
  return recording;
}
```

`state` is `off`, `starting`, `listening` or `failed`; `level` is current normalized
loudness and `held` is buffered seconds. `maxSeconds` bounds the retained input
(0.5..30, default 10). A take returns a mixer `sound`, duration and level samples,
or `null` if nothing is available, and clears the captured input. Stop recording on
background/navigation/unmount when the feature no longer owns the microphone.

`audio.duration(sound)` and `audio.levels(sound, perSecond)` support analysis.
`audio.shift(sound, { pitch, tempo, clean, loudness })` creates a new sound with
independent pitch/tempo ratios (0.25..4); optional cleaning/leveling targets speech.
It returns `null` when unavailable. Processing runs synchronously in Rust; perform
it once per take rather than each game frame. Check `audio.canShift`, reuse
processed sounds, and release runtime sounds with `audio.release` after use.
Already-playing voices retain their samples; bank-owned cached sounds should stay
with the bank.

Hosts declare `NSMicrophoneUsageDescription` on iOS and `RECORD_AUDIO` on Android.
The browser requires HTTPS/localhost, microphone permission and an allowing
Permissions-Policy. iOS switches to play-and-record while listening, restores its
ambient session after stop and handles route changes. Takes remain local mono
samples in memory; an encoded recording-file/streaming API is not exposed.

### System speech

```ts
import { speech } from 'nayan-ui/tts';

await speech.speak('Well done!', { language: 'en-US', rate: 1, pitch: 1, volume: 1 });
const voices = await speech.getAvailableVoicesAsync();
await speech.speak('Your next turn', { voice: voices[0]?.identifier });
await speech.stop(); // Cancel current speech and clear the queue when leaving the screen.
```

Speech runs through the Rust core, using iOS AVSpeechSynthesizer through Objective-C bindings,
Android TextToSpeech through JNI, and browser speechSynthesis through web-sys/WASM.
It creates no audio files, needs no microphone permission or Expo Speech dependency,
and plays independently of `audio` and its volume/mute settings. The web adapter automatically
awaits engine warm-up before sending commands into WASM. Rebuild native apps after upgrading
from an engine without speech support; `speech.supported` checks API availability.

`speak` adds text to the system queue and returns a promise that resolves when queued, **not when
playback ends**. Initialization, invalid voices, unsupported languages and Android's system text
length limit can reject that promise. On Android, initialization times out after 15 seconds and a
later request can retry. Stopping during initialization cancels pending speech immediately (those
`speak` promises reject); it does not wait for a system callback. Empty/whitespace text is ignored. Options default to the
system language/voice, rate 1, pitch 1 and volume 1. Rate accepts 0.1–2, pitch 0.5–2 and volume 0–1;
the platform may clamp the effective rate. Voices and pronunciation depend on the installed system
speech engine. `getAvailableVoicesAsync()` returns identifiers, names, BCP 47 languages and quality.
Android lists installed voices that do not require a network connection.

`isSpeakingAsync()` reports active speech (including paused speech on iOS/web). `pause()` and
`resume()` work on iOS/web and reject on Android, whose system API has no pause/resume support.
`stop()` resets paused browser state and ends the iOS synthesizer session so the next run starts cleanly.
Browsers may require a user gesture before speaking, and voice discovery can initially be empty.
As with [Expo Speech](https://docs.expo.dev/versions/latest/sdk/speech/), actual output depends on
device settings such as silent mode. This API implements the options and methods above, not Expo's
utterance event callbacks. System playback errors after an utterance is queued are not reported.

For a muted iOS integration check, rebuild the core, boot an Apple Silicon simulator and run
`bun test packages/nayan-ui/native/tests/speech-ios.test.ts` from the repository root. This checks the
real Rust/native bridge, including stopping before playback begins and speaking again afterwards.

### Camera

```ts
import { camera } from 'nayan-ui/camera';

// Call from a user action.
const photo = await camera.takePhoto({ quality: 0.85, maxDimension: 2048 });
if (photo) {
  try {
    await uploadPhoto(photo.uri);
  } finally {
    await camera.release(photo.uri);
  }
}
```

`getPermission()` and `requestPermission()` use the shared permissions API.
Native hosts enable the image picker and declare camera access as described in
[App utilities](#app-utilities). `takePhoto()` opens the system camera on native
and a live camera preview in secure browser contexts. It returns `null` on
cancellation and releases the browser media stream when the preview closes.
Photo results are temporary and should be released after use.

### Video

```tsx
import { useRef } from 'react';
import { VideoPlayer, type VideoPlayerHandle } from 'nayan-ui/video';

function LessonVideo({ uri }: { uri: string }) {
  const player = useRef<VideoPlayerHandle>(null);
  return (
    <VideoPlayer
      ref={player}
      source={uri}
      volume={0.7}
      playbackRate={1.25}
      accessibilityLabel="Lesson video"
      onError={(error) => console.error(error.message)}
    />
  );
}
```

The player defaults to an inline 16:9 view with the platform's controls. Use
`controls={false}` with `play()`, `pause()`, and `seek(seconds)` for app-owned
controls. `muted`, `loop`, `autoPlay` and `contentFit` configure playback.
`volume` accepts 0–1 where supported and `playbackRate` accepts 0.25–4.
`onStatusChange` reports loading, buffering, playback and completion.
`onProgress` reports elapsed time and duration in seconds. Regular progress
updates run at up to four per second, with immediate updates for seeks and
state changes. A live stream can report a null duration.

Use HTTPS media URLs on all platforms. React Native also accepts local URIs and
Metro assets from `require()`. iOS and Android support HLS, and web playback
uses the browser's available formats. Specify
`{ uri, mimeType: 'application/x-mpegURL' }` for Android HLS URLs without an
`.m3u8` extension. Browsers may require a user gesture for playback with sound.

AVKit on iOS, Media3 with a SurfaceView on Android, and HTML video on the web
own decoding, frame presentation and controls. The module needs no engine
warm-up. Players pause when the app or page goes into the background and release
their media on unmount. Use `NPlatformView` to place the player inside a Rust
an `NTheme` screen. Reinstall iOS pods and rebuild native hosts to register the video view.

### Clipboard

```ts
import { clipboard } from 'nayan-ui/clipboard';

await clipboard.setString('Referral code');
const text = await clipboard.getString();
```

Both methods are asynchronous. Native access uses `UIPasteboard` on iOS and
`ClipboardManager` on Android, dispatched onto the UI thread; browser access uses
[`navigator.clipboard`](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard).
Call from a user action. Browsers require HTTPS or localhost and may require focus,
permission or user activation. Access failures reject, so show copy success only
after awaiting `setString`. `getString` returns an empty string when no plain text
is available; the OS may prompt when reading another app's clipboard.

`setHTML(html, plainText)` supplies rich content with an explicit plain-text alternative;
`getHTML()` returns empty text when no HTML is present. Browsers may sanitize HTML and
require separate rich-clipboard support. `hasString()` checks for nonempty text
and requires clipboard read access, which can trigger an OS prompt. `clear()` clears the native clipboard
and writes empty text on browsers. `isAvailable()` checks text-write API availability,
not permission. Image clipboard operations are not currently exposed.

The module supports Unicode and empty strings. It does not
monitor or read the clipboard automatically. No engine warm-up is needed. Reinstall
pods and rebuild the native host after adding this module.

### Sharing

Use `sharing.share({ url: 'https://example.com/article', text: 'Read this' })` for a
webpage. The `url` field shares a link; the `uri` field loads a file for sharing.

```ts
import { sharing } from 'nayan-ui/sharing';

if (await sharing.isAvailable()) {
  await sharing.share({
    uri: screenshotUri,
    text: 'Join me on Playtura',
    title: 'Share screenshot',
    mimeType: 'image/png',
    fileName: 'screenshot.png'
  });
}
```

Share text, one file, or both. iOS uses `UIActivityViewController`; Android uses
`ACTION_SEND` with a private FileProvider and read-only access. Native files are
copied on a background worker before presentation, so callers can release their
original screenshot/download after awaiting `share`. Local file/content URIs,
bundled resource names and HTTP(S) file URLs are supported on their respective
native platforms. Optional `anchor: { x, y, width, height }` positions the iPad
popover in the presenting view's points; the default is its center.

Browsers use the [Web Share API](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share).
Call from a user gesture over HTTPS or localhost. For browser file sharing, preload
a `File` and pass `{ file }` directly in the gesture handler: fetching a `uri` first
can lose transient activation. URI downloads also follow browser CORS rules.
`isAvailable()` checks API availability; particular files, permissions or foreground
requirements can still cause `share()` to reject.

Both methods are asynchronous. Dismissal resolves normally; failures reject.
Resolution means the share flow finished and does not confirm delivery. Targets
decide whether to accept both text and a file. Native shares allow one active flow,
limit each file to 64 MiB and cap their private cache at 256 MiB; staged files remain
available to recipients and are pruned after 24 hours when preparing a later file
share. Browser files also have a 64 MiB limit. No engine warm-up is needed. Reinstall
pods and rebuild the native host after adding this module.

### Screen capture

```ts
import { capture } from 'nayan-ui/capture';
import { sharing } from 'nayan-ui/sharing';

// Native app window, including the game, engine UI and native header.
const image = await capture.screen();
try {
  await sharing.share({ uri: image.uri, mimeType: 'image/png' });
} finally {
  await capture.release(image.uri);
}
```

`capture.isAvailable()` checks platform support. `screen()` returns an engine-owned
PNG URI, pixel `width`/`height`, and `scale` (pixels per native window point). Pass
`{ width: image.width / image.scale, height: image.height / image.scale }` to
`NView.captureImage` when cropping a native screenshot with Rust layout bounds.
Only the visible app window is captured; there is no offscreen/full-scroll export.

Android copies the engine's SurfaceView frames with PixelCopy, reads its UI
TextureViews and draws them at their original places in the view hierarchy, so
native clipping and overlay order are retained. iOS captures the foreground window
with UIKit's hierarchy compositor. PNG encoding and file I/O run off the UI thread;
no full-frame base64 buffer crosses the JS bridge. Other native surface types are
not supported on Android. Native captures allow one active request, a 12-megapixel
image (24-megapixel aggregate bitmap budget on Android) and a 128 MiB private cache;
unreleased files older than 24 hours are pruned on a later capture. `release` only
deletes engine capture files and is safe to repeat.

Browsers use `getDisplayMedia`: call `screen()` from a user gesture over HTTPS or
localhost, and the browser asks the user to choose a tab/window/display. It is not
a silent DOM screenshot. The result is a PNG object URL in media-frame pixel
coordinates (`scale: 1`); tracks stop as soon as the frame is captured. Release the
object URL after use. Browser cancellation rejects. Web sharing may need a separate
user gesture after capture. No engine warm-up is needed. Run codegen, reinstall pods
and rebuild native hosts when upgrading to a build with capture support.

Native pixel regression checks use isolated test fixtures and send no API events:
`NAYAN_ANDROID_CAPTURE_TEST=1 bun test packages/nayan-ui/native/tests/capture-android.test.ts`
requires a booted AVD with the current Playtura debug APK installed;
`NAYAN_IOS_CAPTURE_TEST=1 bun test packages/nayan-ui/native/tests/capture-ios.test.ts`
requires a booted iOS simulator. Both checks are opt-in and skip during ordinary tests.

### App utilities

#### Keep awake

```ts
import { keepAwake } from 'nayan-ui/keep-awake';

export async function uploadWhileAwake(upload: () => Promise<void>) {
  await keepAwake.activate('upload');
  try {
    await upload();
  } finally {
    await keepAwake.deactivate('upload');
  }
}
```

Keep-awake tags are idempotent and independent. Rust tracks native runtime ownership;
native adapters restore the prior idle-timer/window setting when released and suspend
it in the background. Browsers use the Screen Wake Lock API, require a supported
secure/visible document, and reacquire when it becomes visible again. Availability
checks do not grant permission. The `useKeepAwake(active, onError?)` hook from the
same entry owns a unique tag and releases it on cleanup. Pass the navigation
screen's focus state when a retained screen should keep the display awake.

#### Store review

```ts
import { review } from 'nayan-ui/review';

if (await review.isAvailable()) await review.requestReview();
```

Store review uses StoreKit on iOS and Google Play Review on Android. Resolution
means a request completed; the store controls whether a prompt appears. Browser
availability is false and requests reject. Product-specific review URLs and cooldown
rules belong in the host, which can offer a link when native review is unavailable.

#### Image picker

```ts
import { imagePicker } from 'nayan-ui/image-picker';

export async function chooseAvatar(save: (uri: string) => Promise<void>) {
  const picked = await imagePicker.pickFromLibrary({ allowsEditing: true, aspect: [1, 1] });
  if (picked.canceled) return;
  const [photo] = picked.assets;
  if (!photo) return;
  try {
    await save(photo.uri);
  } finally {
    await imagePicker.release(photo.uri);
  }
}
```

Image picking supports the system library picker and native camera, optional pan/pinch
cropping with an aspect ratio, multiple library images (explicit `selectionLimit`, up
to 20), JPEG/PNG output, quality, dimensions and optional base64. Editing requires one
image. `getCameraPermission` and `requestCameraPermission` report status/canAskAgain.
The system library picker grants access to selected images without requesting broad
photo-library access. Browser camera capture is a file-input hint that the browser may
handle differently; browser cropping uses an accessible dialog/canvas with drag,
keyboard positioning and zoom controls. It requires no renderer, audio or WASM warm-up.

The default maximum output dimension is 4096 (configurable 64..8192); native inputs are
limited to 64 MiB each. Native images are copied into an engine-owned temporary cache
with a 256 MiB budget and 24-hour stale-file cleanup. Browser results are owned object
URLs. Release images after use; persist/upload them before relying on them long-term.
Cancellation returns `{ canceled: true, assets: null }`; permission, decoding and access
errors reject. This is an image API; video picking is not exposed.

Expo hosts enable native image picking with `"image-picker"` in a feature list, or with the compatibility plugin option below.

```json
["nayan-ui", { "imagePicker": true, "cameraPermission": "Explain why this app needs the camera." }]
```

Run Expo prebuild to apply the setting. The plugin enables the picker source set
and configures the iOS and Android camera permissions. Without the setting, the
iOS picker and PhotosUI dependency and the Android picker classes and crop
activity are omitted from the app build.

For React Native projects without Expo prebuild, set `nayanEngine.imagePicker=true`
in `android/gradle.properties` and run `NAYAN_ENGINE_IMAGE_PICKER=true pod install`
from `ios`. Declare Android CAMERA and iOS NSCameraUsageDescription if using camera
capture. Reinstall pods and rebuild when changing native picker configuration.
Microphone permission is configured independently.

## Bundle and binary size

Pick the entry points that match the app. ESM imports and `sideEffects: false`
let capable bundlers remove unused JavaScript. Direct icon paths also work with
Metro builds that retain an entire named barrel.

```tsx
import { NButton, NList } from 'nayan-ui/components';
import { HeartIcon } from 'nayan-ui/icons/components/heart';
```

| Size | What controls it |
| --- | --- |
| JavaScript bundle | Feature imports and the host bundler's tree shaking. |
| Android, iOS and WASM binaries | The compiled feature list. Cargo links selected implementations and required dependencies. The shared wgpu backend stays available for rendering. |
| npm download | The single SDK tarball, including prebuilt Android archives, both iOS slices and the default browser WASM. |

For a components-only app, use `features: ['components']`. Enable `markdown`
and `drawing` when the app needs those Rust implementations. Measure the final
app or generated WASM for the selected profile. [Compiled Rust features](#selecting-compiled-rust-features)

### What npm includes

The package ships public entries, declarations, React Native codegen and
autolinking files, Rust and native build inputs, the WASM and its worker assets,
prebuilt native libraries, this README and licenses. Native profiles compile
from the shipped build sources. The package allowlist keeps tests, benchmarks,
source maps, build caches and repository release tools in the source checkout.

The repository's publish checks verify the actual npm inventory. Run the same
check from `packages/nayan-ui` after building the distribution.

```sh
npm pack --ignore-scripts --dry-run --json | bun scripts/check-package.mjs --pack-json
```

## Development and verification

Native implementations follow the SDK feature names under `native/`. For example,
`native/games/rust` owns the 3D renderer and world simulation, `native/components` owns the
UI renderer and native views, and `native/image-picker` owns its Android and iOS
adapters. `native/core` holds the single Cargo manifest and platform build scripts.
Its Rust sources group the shared GPU and surface lifecycle in `src/render/`,
platform setup in `src/platform/`, C ABI entry points in `src/ffi/`, and helpers
used by multiple features in `src/support/`. Feature-specific WASM exports and
examples live beside their implementations. `shared/android`, `shared/ios`, and
`shared/cpp` hold the shared React Native integration, including the surface views.
SDK build, packaging, and codegen tools live under `scripts/`.

From the Nayan UI repository root, install the engine dependencies and use the
workspace scripts below. The filtered install works in a public checkout. Its
hoisted workspace link lets the generated icon modules resolve the package's
platform-specific exports during bundle tests.

```sh
bun install --frozen-lockfile --filter nayan-ui
bun run engine:typecheck
bun run engine:test
bun run engine:test:integration
bun run engine:test:web
bun run engine:core:test
bun run engine:build:web
bun run engine:build
bun run engine:core:build:ios
bun run engine:core:build:android
bun run engine:codegen
```

Run `engine:build` before the JavaScript test suites so they can load the
published browser package and compiled WASM. The integration suite also runs
host-side platform probes. Simulator and emulator probes use the prerequisites
and environment variables documented in their test files. Use
`engine:test:coverage` to check measured source coverage and find runtime
modules absent from the report.

The [Build engine workflow](../../.github/workflows/npm-publish.yml) builds and tests
the distribution on standard GitHub-hosted runners. Download the
`nayan-ui` artifact from a successful run to get the checked npm tarball.

Browser builds need the Rust `wasm32-unknown-unknown` target, matching
`wasm-bindgen-cli` (currently 0.2.129 in Cargo), and a WASM-capable C/C++ toolchain
for mesh optimization. Native distribution builds also need Xcode or the Android
NDK. Consumers installing shipped native artifacts do not need a Rust compiler.
Use the manifests and existing build scripts as the source of truth for versions
and platform configuration.

TypeScript-only changes reach workspace Metro consumers through source links.
Rebuild the browser package when changing browser bindings/declarations. Rust,
native view, C++ or TurboModule spec changes require the affected native core/host
rebuild; spec changes additionally require codegen and reinstalling iOS pods.
Restart Metro after resolver/config changes. Simulator apps used for runtime
checks need normal local signing; unsigned builds are compile-only checks.

Run the relevant import-isolation, control, lifecycle and platform checks for
implementation changes. Device fixtures under `native/tests` state their
simulator and emulator requirements. Use the [npm inventory check](#what-npm-includes)
on publishing changes.

From the repository checkout, run the storage microbenchmark with
`cargo run --release --manifest-path packages/nayan-ui/native/core/Cargo.toml --example storage_bench`.
It measures the native core outside the JSI and React layers.

### Source organization

Game assets, input, rendering, worlds and types live under `src/games/` and are
exported through `nayan-ui/games`. Common services each have a folder under
`src/`, with public service exports in `src/index.ts`. The `/modules` subpath also
resolves to this entry. UI and its theme layer live in `src/components/`. Drawing, Markdown,
and build-time styling have their own source folders. Native feature code lives
under `native/` and the shared platform integration under `shared/`. The active
Rust crate is `native/core/Cargo.toml`. `scripts/` holds SDK build tools and
`lib/` is generated package output.
The root import remains available for compatibility; prefer the feature entries.

## Troubleshooting

| Symptom                                              | Fix                                                                                                                                |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `isEngineAvailable` is `false`                       | You're in Expo Go or a build made before installing the engine: make a new development build.                                      |
| `.glb` files fail to bundle                          | Add `glb` and `gltf` to Metro's `assetExts`.                                                                                       |
| Android build fails on `minSdkVersion`               | Set it to 26 or higher.                                                                                                            |
| An Android screenshot of the game view is blank      | The engine draws into a `SurfaceView`: use `capture.screen()` from `nayan-ui/capture`.                                     |
| Out of mesh ids                                      | A mesh is being created per spawn or per frame: build it once and reuse it (`getMeshIdLimit()`).                                   |
| Browser UUID generation reports unavailable secure randomness | Check that Web Crypto is available in the runtime. |
| A web UI surface has zero height                     | Give the surface and its container bounded dimensions; a `flex: 1` child alone cannot size an unbounded browser page.              |
| Website classes differ during initial loading        | Import the generated engine CSS at the app layout and use the matching generated stylesheet manifest for `NTheme`.        |
| An app context disappears inside a page or sheet     | Register its React context object in the root `NTheme contexts`; keep its value provider above the relevant surface.               |
| A sheet cannot be dragged closed                     | Provide controlled `isOpen` and `onOpenChange`, keep `isSwipeable` enabled, and drag its handle/header after its content is ready. |
| Extra space remains below scroll content             | Let `NTheme` own the bottom content inset, or use `safeArea={false}` when the host deliberately supplies its own.                   |
| A Markdown metadata block fails to parse             | `parseFrontMatter` accepts JSON objects between `---` lines; retain double quotes and migrate YAML-specific syntax.                |
| A native API is missing after a package update       | Rebuild the affected Rust/native code, regenerate the bridge if its spec changed, reinstall pods and rebuild the host app.         |

## Prebuilt games

[@nayan-ui/games](https://www.nayanui.com/games) offers ready-made 3D games built on this engine. Each is one component with the same props.

`@nayan-ui/games` is a **private package**. To use it in your application or website, reach out to [niranjan.devasani@gmail.com](mailto:niranjan.devasani@gmail.com).

**[Play them in your browser](https://www.nayanui.com/games)**

## Learn more

| Topic                                 | Guide                                                                                                               |
| ------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Build a complete game step by step    | [First game](https://www.nayanui.com/game-engine/first-game)                                                        |
| Copy-paste solutions                  | [Recipes](https://www.nayanui.com/game-engine/recipes)                                                              |
| Worlds, entities, rotations, disposal | [World & entities](https://www.nayanui.com/game-engine/world-entities)                                              |
| Effects and particles                 | [Effects](https://www.nayanui.com/game-engine/particles)                                                            |
| Procedural meshes and modelling       | [Geometry](https://www.nayanui.com/game-engine/procedural-geometry)                                                 |
| Drawing and painting                  | [Drawing](https://www.nayanui.com/game-engine/drawing)                                                              |
| Performance and caching               | [Performance](https://www.nayanui.com/game-engine/cache-performance)                                                |
| Coding agents                         | [Agent guide](https://www.nayanui.com/game-engine/agent-guide) · [engine.json](https://www.nayanui.com/nayan-game-engine.json) |

## License

MIT

---

Made with ❤️ by [Niranjan Reddy Devasani](https://github.com/ursnj)
