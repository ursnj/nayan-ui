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

`example/games/` has three complete examples: Flappy, Orb Rush and a benchmark.

## Features

- **Rendering** (WebGPU): cube / sphere / plane meshes, per-instance color, one instanced draw per mesh,
  directional light with a filtered shadow map that follows the camera, 4x MSAA.
- **Physics** ([Rapier](https://rapier.rs) in Rust): dynamic / kinematic / fixed bodies, ball and box colliders,
  friction, restitution, density, damping, rotation locks, CCD, gravity, impulses, raycasts,
  collision layers/masks, sensors, start/stop contact events with impact speed.
- **Simulation**: fixed 60 Hz steps with render interpolation; velocity, spin, visual bobbing,
  chase behavior, arena bounds, lifetimes (auto-despawn with shrink-out) for particles and projectiles.
- **Audio** (Rust): a realtime mixer on its own thread (32 voices, pitch, constant-power pan, looping,
  soft limiter) fed by WAV files and played through cpal (CoreAudio on iOS). The JS thread talks to it
  through a lock-free queue. iOS session category "ambient": respects the silent switch and mixes with other apps.
- **Haptics** (Rust): Core Haptics transients with continuous intensity and sharpness, patterns, throttling.
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
  world/World.ts          entities, physics, collisions, impact feedback
  render/                 GameView, Renderer, WGSL shader, meshes
  media/                  audio.ts (sound banks, playback), haptics.ts
  input/Joystick.tsx      touch stick
  native/                 TurboModule spec (codegen input)
core/                     Rust core (static library)
  src/world/              entities · physics · simulation · feedback · render · tests
  src/audio/              public API · mixer · device output
  src/haptics.rs          Core Haptics
  src/ffi/                C ABI (world, media); header in include/engine_core.h
  scripts/build-ios.sh    builds build/EngineCore.xcframework
  examples/bench.rs       benchmarks
cpp/                      JSI TurboModule (C++, shared by iOS and Android)
ios/                      iOS module provider
example/                  Expo app
  games/flappy/           Flappy (physics, attachments, feedback, fog)
  games/orb-rush/         Orb Rush (joystick, dash, crates, sparks, music)
  games/benchmark/        JS vs Rust and 1,500-body physics benchmark
  assets/sfx/             sounds, generated by scripts/make-sounds.py
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

- Changed `core/` (Rust): `bun run core:build:ios`, then rebuild the app.
- Changed `src/native/*` (the native module's TS spec): run `pod install` in `example/ios` **before** rebuilding.
  Codegen regenerates the C++ spec header only then; otherwise new methods compile but are `undefined` in JS.
- Don't start Metro with `CI=1` while developing: it disables file watching and serves stale JS.
- `EXPO_PUBLIC_AUTOPLAY=1` (set when starting Metro) makes a bot play the games: handy for demos and QA.

## How it stays fast

- One pipeline, one `drawIndexed` call for all instances. Model matrices live in a storage buffer.
- One `writeBuffer` for all matrices per frame. No per-entity JS↔native calls.
- 4x MSAA with depth/MSAA targets set to `storeOp: "discard"`, so tile GPUs keep them on-chip.
- No allocation in the frame loop. `world.position(e, out)` / `velocity(e, out)` fill an array you reuse.
- One native call per `spawn` / `set`: options are packed into a reusable Float64Array that the core decodes.
- Rust core: structure-of-arrays storage, entities are `u32` handles, render buffers are fixed-size and never move.

## Status

Engine v0.3 (iOS only so far):

- [x] Rust world with generation-checked handles; Rapier rigid bodies, colliders, events, raycasts
- [x] Fixed-step simulation with interpolation; lifetimes; chase; bounds
- [x] Renderer with shadows; `GameView`; `Joystick`
- [x] Audio mixer and haptics in Rust; impact feedback from physics; attachments; sky color and fog
- [ ] Android audio/haptics backends (cpal AAudio is ready; haptics needs a JNI Vibrator call)
- [ ] Android native module
- [ ] glTF / custom meshes, textures, transparency
- [ ] CI that builds the binaries and publishes
