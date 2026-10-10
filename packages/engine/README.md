# @nayan-ui/engine

A small, fast 3D engine for React Native.

- **Rendering:** WebGPU through [`react-native-webgpu`](https://github.com/wcandillon/react-native-webgpu) (Dawn → Metal / Vulkan), driven over JSI.
- **Simulation:** anything implementing `Simulation` (`src/types.ts`). The renderer only reads its `matrices` buffer.
- **Core (Rust):** `core/` owns transforms and writes that matrix buffer natively. Not yet wired into the JS side.

## Quick look

```tsx
import { GameView, World, Mesh, Joystick, createJoystickState, impactStrength } from "@nayan-ui/engine";
import { createExpoAudio, createExpoHaptics } from "@nayan-ui/engine/expo"; // optional

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

const audio = createExpoAudio({ pickup: require("./pickup.wav"), music: require("./music.wav") });
const haptics = createExpoHaptics();
audio.playMusic("music", { volume: 0.4 });

<GameView
  source={world}
  camera={camera}                                // mutate camera.eye / camera.target each frame
  light={{ direction: [0.4, 0.8, 0.5], ambient: 0.3, shadows: true }}
  onUpdate={(dt) => {
    world.setPlanarVelocity(player, stick.x * 8, -stick.y * 8);
    world.update(dt);                            // Rust: fixed-step physics, chasing, events
    world.forEachCollision((a, b, { started, sensor, speed }) => {
      if (started && sensor) { audio.play("pickup"); haptics.impact("light"); }
      if (started && !sensor) audio.play("bump", { volume: impactStrength(speed) });
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
- **Audio** (`@nayan-ui/engine/expo`, expo-audio): preloaded effects with a voice pool, looping music, mute.
- **Haptics** (`@nayan-ui/engine/expo`, expo-haptics): impacts, notifications, selection; throttled.
- **Input**: `Joystick` touch stick; plain RN touchables for buttons.

`GameAudio` / `GameHaptics` are interfaces: the core has no audio dependency and you can swap in another backend.

## Layout

```
src/            TypeScript library (World, GameView, Renderer, WGSL, Joystick)
core/           Rust simulation core (+ C header in core/include)
cpp/ ios/       C++ TurboModule + provider that expose the core to JS (zero-copy)
example/        Expo app: Orb Rush game + a 10k-cube JS-vs-Rust benchmark
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
- [x] Audio and haptics (Expo adapters)
- [ ] Android native module
- [ ] glTF / custom meshes, textures, transparency

- [x] WebGPU renderer, instanced cubes (iOS)
- [x] Rust core: transforms, angular velocity, C ABI (tested on host)
- [ ] JSI module exposing the core to JS, matrix buffer shared zero-copy
- [ ] Cross-compiled binaries (iOS xcframework, Android ABIs) + autolinking + Expo config plugin
- [ ] Public scene API (`<Scene>`, `<Mesh>`, `<Camera>`, `<Light>`), glTF loading
- [ ] Android verification
