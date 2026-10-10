# @nayan-ui/engine

A small, fast 3D engine for React Native.

- **Rendering:** WebGPU through [`react-native-webgpu`](https://github.com/wcandillon/react-native-webgpu) (Dawn → Metal / Vulkan), driven over JSI.
- **Simulation:** anything implementing `Simulation` (`src/types.ts`). The renderer only reads its `matrices` buffer.
- **Core (Rust):** `core/` owns transforms and writes that matrix buffer natively. Not yet wired into the JS side.

## Quick look

```tsx
import { GameView, World, Mesh, audio, haptics } from "@nayan-ui/engine";

const world = new World(500); // fixed capacity

// Static level geometry and a dynamic, physically simulated player.
world.spawn({ mesh: Mesh.Plane, scale: [40, 1, 40], body: "fixed" });
const player = world.spawn({
  mesh: Mesh.Sphere, position: [0, 1, 0], color: [0.3, 0.6, 1],
  body: "dynamic",
  collider: { layer: 2, mask: 1 | 4, restitution: 0.2 },
});
const pickup = world.spawn({ mesh: Mesh.Sphere, position: [5, 1, 0], body: "kinematic",
  collider: { layer: 4, sensor: true } });
const enemy = world.spawn({ body: { type: "dynamic", lockRotations: true }, follow: { target: player, speed: 3 } });

const sfx = audio.load({ pickup: require("./pickup.wav"), bump: require("./bump.wav"), music: require("./music.wav") });
await sfx.ready;
sfx.play("music", { volume: 0.4, loop: true });
// The core plays this itself on every solid impact: volume/haptic scale with speed, panned to the listener.
world.setImpactFeedback(player, { sound: sfx.get("bump"), minSpeed: 1, maxSpeed: 10, haptic: 0.7 });
world.setListener(player);

<GameView
  source={world}
  camera={camera}                                // mutate camera.eye / camera.target each frame
  light={{ direction: [0.4, 0.8, 0.5], ambient: 0.3, shadows: true }}
  onUpdate={(dt) => {
    world.setPlanarVelocity(player, stick.x * 8, -stick.y * 8);
    world.update(dt);                            // Rust: fixed-step physics, chasing, events
    world.forEachCollision((a, b, { started, sensor }) => {
      if (started && sensor) { sfx.play("pickup"); haptics.impact(0.4, 0.8); }
    });
  }}
/>
```

`example/OrbRush.tsx` is a complete game built this way.

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
src/            TypeScript library (World, GameView, Renderer, WGSL, Joystick)
core/           Rust simulation core (+ C header in core/include)
cpp/ ios/       C++ TurboModule + provider that expose the core to JS (zero-copy)
example/        Expo app: Flappy, Orb Rush, and a JS-vs-Rust / physics benchmark
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
- Changed `src/specs/*` (the native module's TS spec): run `pod install` in `example/ios` **before** rebuilding.
  Codegen regenerates the C++ spec header only then; otherwise new methods compile but are `undefined` in JS.
- Don't start Metro with `CI=1` while developing: it disables file watching and serves stale JS.
- `EXPO_PUBLIC_AUTOPLAY=1` (set when starting Metro) makes a bot play Orb Rush: handy for demos and QA.

## How it stays fast

- One pipeline, one `drawIndexed` call for all instances. Model matrices live in a storage buffer.
- One `writeBuffer` for all matrices per frame. No per-entity JS↔native calls.
- 4x MSAA with depth/MSAA targets set to `storeOp: "discard"`, so tile GPUs keep them on-chip.
- No allocation in the frame loop.
- Rust core: structure-of-arrays transforms, dirty-flagged matrix rebuilds, entities are `u32` handles.

## Status

Engine v0.3 (iOS only so far):

- [x] Rust world with generation-checked handles; Rapier rigid bodies, colliders, events, raycasts
- [x] Fixed-step simulation with interpolation; lifetimes; chase; bounds
- [x] Renderer with shadows; `GameView`; `Joystick`
- [x] Audio mixer and haptics in Rust; impact feedback from physics; attachments; sky color and fog
- [ ] Android audio/haptics backends (cpal AAudio is ready; haptics needs a JNI Vibrator call)
- [ ] Android native module
- [ ] glTF / custom meshes, textures, transparency

- [x] WebGPU renderer, instanced cubes (iOS)
- [x] Rust core: transforms, angular velocity, C ABI (tested on host)
- [ ] JSI module exposing the core to JS, matrix buffer shared zero-copy
- [ ] Cross-compiled binaries (iOS xcframework, Android ABIs) + autolinking + Expo config plugin
- [ ] Public scene API (`<Scene>`, `<Mesh>`, `<Camera>`, `<Light>`), glTF loading
- [ ] Android verification
