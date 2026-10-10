# @nayan-ui/engine

A small, fast 3D engine for React Native.

- **Rendering:** WebGPU through [`react-native-webgpu`](https://github.com/wcandillon/react-native-webgpu) (Dawn → Metal / Vulkan), driven over JSI.
- **Simulation:** anything implementing `Simulation` (`src/types.ts`). The renderer only reads its `matrices` buffer.
- **Core (Rust):** `core/` owns transforms and writes that matrix buffer natively. Not yet wired into the JS side.

## Quick look

```tsx
import { GameView, World, Mesh, Joystick, createJoystickState } from "@nayan-ui/engine";

const world = new World(1000);                       // fixed capacity
const player = world.spawn({
  mesh: Mesh.Sphere, position: [0, 0.5, 0], color: [0.3, 0.6, 1],
  collider: { radius: 0.5, layer: 1, mask: 2 },
});
const enemy = world.spawn({ mesh: Mesh.Cube, follow: { target: player, speed: 3 } });

<GameView
  source={world}
  camera={camera}                                      // mutate camera.eye / camera.target each frame
  onUpdate={(dt) => {
    world.setVelocity(player, [stick.x * 9, 0, -stick.y * 9]);
    world.update(dt);                                  // Rust: motion, chasing, collisions
    world.forEachCollision((a, b) => { /* ... */ });
  }}
/>
```

`example/OrbRush.tsx` is a complete game built this way (about 250 lines).

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

Engine v0.2 (iOS only so far):

- [x] Rust world: spawn/despawn with generation-checked handles, velocity, spin, oscillation, chase, bounds
- [x] Sphere colliders with layers/masks and per-frame collision events (brute force; add a grid beyond a few thousand colliders)
- [x] Renderer: cube / sphere / plane, per-instance color, camera, directional light, one instanced draw per mesh
- [x] Touch `Joystick`, `GameView` game loop, example game
- [ ] Shadows, glTF, audio, rigid-body physics

- [x] WebGPU renderer, instanced cubes (iOS)
- [x] Rust core: transforms, angular velocity, C ABI (tested on host)
- [ ] JSI module exposing the core to JS, matrix buffer shared zero-copy
- [ ] Cross-compiled binaries (iOS xcframework, Android ABIs) + autolinking + Expo config plugin
- [ ] Public scene API (`<Scene>`, `<Mesh>`, `<Camera>`, `<Light>`), glTF loading
- [ ] Android verification
