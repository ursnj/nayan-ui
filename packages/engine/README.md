# @nayan-ui/engine

A small, fast 3D engine for React Native.

- **Rendering:** WebGPU through [`react-native-webgpu`](https://github.com/wcandillon/react-native-webgpu) (Dawn → Metal / Vulkan), driven over JSI.
- **Simulation:** anything implementing `Simulation` (`src/types.ts`). The renderer only reads its `matrices` buffer.
- **Core (Rust):** `core/` owns transforms and writes that matrix buffer natively. Not yet wired into the JS side.

## Layout

```
src/            TypeScript library (GameView, Renderer, WGSL)
core/           Rust simulation core (+ C header in core/include)
example/        Expo demo app (10k cubes + fps counter)
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

## How it stays fast

- One pipeline, one `drawIndexed` call for all instances. Model matrices live in a storage buffer.
- One `writeBuffer` for all matrices per frame. No per-entity JS↔native calls.
- 4x MSAA with depth/MSAA targets set to `storeOp: "discard"`, so tile GPUs keep them on-chip.
- No allocation in the frame loop.
- Rust core: structure-of-arrays transforms, dirty-flagged matrix rebuilds, entities are `u32` handles.

## Status

- [x] WebGPU renderer, instanced cubes (iOS)
- [x] Rust core: transforms, angular velocity, C ABI (tested on host)
- [ ] JSI module exposing the core to JS, matrix buffer shared zero-copy
- [ ] Cross-compiled binaries (iOS xcframework, Android ABIs) + autolinking + Expo config plugin
- [ ] Public scene API (`<Scene>`, `<Mesh>`, `<Camera>`, `<Light>`), glTF loading
- [ ] Android verification
