# @nayan-ui/engine

A small, fast 3D game engine for React Native.

- **Rendering** in TypeScript on WebGPU through [`react-native-webgpu`](https://github.com/wcandillon/react-native-webgpu) (Dawn → Metal / Vulkan).
- **Everything else** in a Rust core: entities, [Rapier](https://rapier.rs) physics, audio, haptics. JS calls it through a
  JSI TurboModule, and the render buffers alias Rust memory (zero-copy).

## Quick look

```tsx
import { GameView, World, Mesh, audio, haptics } from "@nayan-ui/engine";

const world = new World(500); // fixed capacity

// One call per entity: everything about it in one options object.
world.spawn({ mesh: Mesh.Plane, scale: [40, 1, 40], physics: "fixed" });
const player = world.spawn({
  mesh: Mesh.Sphere, position: [0, 1, 0], color: [0.3, 0.6, 1],
  physics: { type: "dynamic", layer: 2, mask: 1 | 4, bounce: 0.2 },
});
const coin = world.spawn({ mesh: Mesh.Sphere, position: [5, 1, 0], physics: { type: "kinematic", layer: 4, sensor: true } });
const enemy = world.spawn({ physics: { type: "dynamic", upright: true }, follow: { target: player, speed: 3 } });

const sfx = audio.load({ coin: require("./coin.wav"), bump: require("./bump.wav"), music: require("./music.wav") });
await sfx.ready;
sfx.play("music", { volume: 0.4, loop: true });
// The core plays this itself on every solid impact: volume/haptic scale with speed, panned to the listener.
world.set(player, { impact: { sound: sfx.get("bump"), minSpeed: 1, maxSpeed: 10, haptic: 0.7 } });
world.listener = player;

<GameView
  source={world}
  camera={camera}                                // mutate camera.eye / camera.target each frame
  light={{ direction: [0.4, 0.8, 0.5], ambient: 0.3, shadows: true }}
  onUpdate={(dt) => {
    world.set(player, { groundVelocity: [stick.x * 8, -stick.y * 8] });
    world.update(dt);                            // Rust: fixed-step physics, chasing, events
    world.forEachCollision((a, b, { started }) => {
      if (started && (a === coin || b === coin)) { sfx.play("coin"); haptics.impact(0.4, 0.8); }
    });
  }}
/>
```

`example/games/` has complete examples: Flappy, Orb Rush, a glTF models scene and a benchmark.

## 3D models

Load glTF 2.0 models (`.glb`, or `.gltf` with embedded buffers) and spawn them like any mesh:

```ts
import { loadModel } from "@nayan-ui/engine";

const tree = await loadModel(require("./assets/tree.glb"), { fit: 2 }); // largest side = 2 units
world.spawn({ mesh: tree.mesh, position: [0, tree.size[1] / 2, 0], physics: "fixed" });
```

- Parsed in Rust: meshes, node transforms and material base colors (and vertex colors) are kept.
  Textures, skins, animations and Draco compression are not supported yet.
- Every entity using a model is drawn in one instanced draw call, like the built-in shapes.
- Physics colliders sized "from the mesh" use the model's bounding box times the entity's scale.
- `center` (default true) puts the bounding box center at the origin; `fit` rescales to a size.
- Up to 61 models (64 mesh ids including the 3 built-ins). Loading the same file twice returns the cached model.
- Add the extensions to Metro so `require` works: `config.resolver.assetExts.push("glb", "gltf")`.

## Features

- **Rendering** (WebGPU): cube / sphere / plane meshes and glTF models, per-instance color, one instanced draw per mesh,
  directional light with a filtered shadow map that follows the camera, 4x MSAA.
- **Physics** ([Rapier](https://rapier.rs) in Rust): dynamic / kinematic / fixed bodies, ball and box colliders,
  friction, restitution, density, damping, rotation locks, CCD, gravity, impulses, raycasts,
  collision layers/masks, sensors, start/stop contact events with impact speed.
- **Simulation**: fixed 60 Hz steps with render interpolation; velocity, spin, visual bobbing,
  chase behavior, arena bounds, lifetimes (auto-despawn with shrink-out) for particles and projectiles.
- **Audio** (Rust): a realtime mixer on its own thread (32 voices, pitch, constant-power pan, looping,
  soft limiter) fed by WAV files and played through cpal (CoreAudio on iOS, AAudio on Android). The JS thread talks to it
  through a lock-free queue. iOS session category "ambient": respects the silent switch and mixes with other apps.
- **Haptics** (Rust): Core Haptics transients with continuous intensity and sharpness on iOS; the Vibrator
  service on Android (amplitude-controlled one-shots and waveforms). Patterns, throttling.
- **Impact feedback** (Rust): per-entity sound + haptic played by the core straight from physics contacts,
  scaled by approach speed and panned/attenuated relative to a listener entity. No JS per impact.
- **Attachments**: child entities follow a parent's interpolated pose (characters made of parts, props).
- **Input**: `Joystick` touch stick; plain RN touchables for buttons.

No Expo modules are required: rendering, physics, audio and haptics all live in this package.

## Layout

```
src/                      TypeScript library
  index.ts                public API
  types.ts                shared types (Mesh, Camera, Light, RenderSource)
  assets.ts               loads require() assets / URIs as bytes
  model/Model.ts          loadModel (glTF)
  world/World.ts          entities, physics, collisions, impact feedback
  render/                 GameView, Renderer, WGSL shader, meshes
  media/                  audio.ts (sound banks, playback), haptics.ts
  input/Joystick.tsx      touch stick
  native/                 TurboModule spec (codegen input)
core/                     Rust core (static library)
  src/world/              entities · physics · simulation · feedback · render · tests
  src/audio/              public API · mixer · device output
  src/model.rs            glTF parsing and the model registry
  src/haptics.rs          Core Haptics (iOS), Vibrator (Android)
  src/android.rs          JavaVM/Context hand-off for audio and haptics
  src/ffi/                C ABI (world, media, models, android); header in include/engine_core.h
  scripts/build-ios.sh    builds build/EngineCore.xcframework
  scripts/build-android.sh builds build/android/<abi>/libengine_core.a
  examples/bench.rs       benchmarks
cpp/                      JSI TurboModule (C++, shared by iOS and Android); cpp/generated = codegen header
ios/                      iOS module provider
android/                  Android build: CMakeLists.txt (a pure C++ module, autolinked via react-native.config.js)
example/                  Expo app
  games/flappy/           Flappy (physics, attachments, feedback, fog)
  games/orb-rush/         Orb Rush (joystick, dash, crates, sparks, music)
  games/models/           glTF trees and rockets with physics
  games/benchmark/        JS vs Rust and 1,500-body physics benchmark
  assets/sfx/             sounds, generated by scripts/make-sounds.py
  assets/models/          low-poly GLBs, generated by scripts/make-models.py
```

## Develop

Needs a dev client (native code), so Expo Go will not work.

```sh
bun install                 # from the repo root
bun run engine:typecheck
bun run engine:example      # then: ios / android
```

Rust core:

```sh
cd packages/engine
bun run core:test           # unit tests
bun run core:bench          # ms per update() at 10k / 100k entities
```

Native changes need extra steps (JS changes just reload):

- Changed `core/` (Rust): `bun run core:build:ios` and/or `bun run core:build:android`, then rebuild the app.
- Changed `src/native/*` (the native module's TS spec): run `bun run codegen` (Android's shipped header) and
  `pod install` in `example/ios` **before** rebuilding. Otherwise new methods compile but are `undefined` in JS.

Android requirements:

- `minSdkVersion` 26 or higher (AAudio, and react-native-webgpu's hardware buffers). The example sets it with
  `example/plugins/withAndroidMinSdk.js`.
- The vibrate permission for haptics (the engine has no manifest of its own). In Expo:
  `{ "expo": { "android": { "permissions": ["android.permission.VIBRATE"] } } }`
- Building: JDK 17–21, tested with 21 (JDK 25 breaks React Native's CMake/prefab step), and the Rust Android targets
  (`rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android`).

Tips:

- Don't start Metro with `CI=1` while developing: it disables file watching and serves stale JS.
- `EXPO_PUBLIC_AUTOPLAY=1` (set when starting Metro) makes a bot play the games: handy for demos and QA.
- `EXPO_PUBLIC_SCREEN=models` (or `flappy`, `orbrush`, `benchmark`) opens that example first.

## How it stays fast

- One pipeline, one instanced `drawIndexed` per mesh in use. Model matrices live in a storage buffer.
- One `writeBuffer` for all matrices per frame. No per-entity JS↔native calls.
- 4x MSAA with depth/MSAA targets set to `storeOp: "discard"`, so tile GPUs keep them on-chip.
- No allocation in the frame loop. `world.position(e, out)` / `velocity(e, out)` fill an array you reuse.
- One native call per `spawn` / `set`: options are packed into a reusable Float64Array that the core decodes.
- Rust core: structure-of-arrays storage, entities are `u32` handles, render buffers are fixed-size and never move.

## Status

Engine v0.4 (iOS and Android):

- [x] Rust world with generation-checked handles; Rapier rigid bodies, colliders, events, raycasts
- [x] Fixed-step simulation with interpolation; lifetimes; chase; bounds
- [x] Renderer with shadows; `GameView`; `Joystick`
- [x] Audio mixer and haptics in Rust; impact feedback from physics; attachments; sky color and fog
- [x] Android: native module (pure C++ autolinking), AAudio sound, Vibrator haptics
- [x] glTF models (meshes, node transforms, material colors) with instancing and bounding-box colliders
- [ ] Textures, skinned animation, transparency
- [ ] CI that builds the binaries and publishes
