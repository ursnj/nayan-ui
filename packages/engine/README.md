# @nayan-ui/engine

A small, fast 3D game engine for React Native.

- **Rendering** in TypeScript on WebGPU through [`react-native-webgpu`](https://github.com/wcandillon/react-native-webgpu) (Dawn → Metal / Vulkan).
- **Everything else** in a Rust core: entities, [Rapier](https://rapier.rs) physics, audio, haptics. JS calls it through a
  JSI TurboModule, and the render buffers alias Rust memory (zero-copy).

## Quick look

```tsx
import { GameView, World, audio, haptics } from "@nayan-ui/engine";

const world = new World(500); // fixed capacity

// One call per entity: everything about it in one options object.
world.spawn({ mesh: "plane", scale: [40, 1, 40], physics: "fixed" });
const player = world.spawn({
  mesh: "sphere", position: [0, 1, 0], color: [0.3, 0.6, 1],
  physics: { type: "dynamic", layer: 2, mask: 1 | 4, bounce: 0.2 },
});
const coin = world.spawn({ mesh: "sphere", position: [5, 1, 0], physics: { type: "kinematic", layer: 4, sensor: true } });
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

`example/games/` has complete examples: Racing (a 3D highway racer) and a benchmark.

## Board and puzzle games

Tap to pick, animate pieces, write numbers and letters in 3D:

```tsx
const font = await loadFont(require("./Inter-Bold.ttf"), { chars: "0123456789" });
const tile = world.spawn({ mesh: "roundedBox", scale: [1, 0.3, 1], color: [1, 0.8, 0.4] });
const label = world.spawn({ text: "2048", font, parent: tile, position: [0, 0.6, 0], rotation: flat, scale: 0.4 });

<GameView
  source={world}
  camera={{ eye: [0, 10, 0.01], target: [0, 0, 0], fov: 1, ortho: 5 }} // straight down, no perspective
  onTap={(x, y) => {
    const hit = world.pick(x, y);                 // what's under the finger (no physics needed)
    if (hit?.entity === tile) world.animate(tile, { scale: [1.2, 0.3, 1.2] }, { yoyo: true, repeat: 1 });
  }}
  onSwipe={(direction) => slide(direction)}       // "left" | "right" | "up" | "down"
  onDrag={({ phase, x, y }) => {                  // drag a piece: the finger on the board plane
    const at = world.screenToWorld(x, y, { point: [0, 0.25, 0] });
    if (phase === "move" && at && held) world.animate(held, { position: at }, { spring: true });
  }}
  onLongPress={(x, y) => showMoves(world.pick(x, y)?.entity)}
  onPinch={({ scale }) => (camera.ortho = zoom / scale)} // two fingers; ends any drag (cancelled: true)
/>

await world.animate(piece, { position: [2, 0, 3] }, { duration: 0.25, easing: "back" }); // then check the board
world.set(label, { text: "4096" });
world.burst({ position: [0, 1, 0], count: 30, color: [[1, 0.3, 0.3], [1, 0.9, 0.2]] }); // confetti
```

- **Shapes**: `"cube"`, `"sphere"`, `"plane"`, `"cylinder"`, `"cone"`, `"capsule"`, `"torus"`, `"roundedBox"`,
  `"puff"` (a soft round sprite that faces the camera: fire, smoke, dust), and `"none"` (invisible: groups, pivots,
  trigger zones). Each is 1 unit across before scaling; colliders match the shape.
- **Groups**: `parent` nests to any depth; children move, turn and scale with their parent.
- **Animations** run in Rust and return a Promise (see [Animation](#animation)).
- **Text** (`text` + `font`): each character is an extruded mesh, so every "7" on screen is one draw call. Letters are
  1 unit tall at scale 1; `align` is left / center / right. Changing `text` rebuilds the letters (one entity each).
- **Picking** tests what was drawn (bounding boxes), not physics. `pickable: false` lets taps through.
- **`toScreen(position)`** places React Native views (score popups, labels) over 3D objects.
- **Transparency**: any color with alpha below 1 is drawn see-through, after everything solid.
- **Textures**: `loadTexture(require("./crate.png"))` (PNG / JPEG), then `{ mesh: "cube", texture }`. `textureRegion`
  shows part of an atlas (cards, sprite sheets). glTF models keep their base color texture.
- **2D physics**: `physics: { type: "dynamic", planar: true }` keeps a body in its XY plane, so 2D games keep their
  rules and gain 3D looks. Pair it with an orthographic camera looking down -z.
- **Camera**: `ortho` for flat board views, `follow: { target, offset, smoothing }` to chase an entity, and
  `camera.shake = 0.3` for a hit (it fades by itself).
- **Particles**: `world.burst(...)` spawns short-lived pieces in one native call (direction, spread, speed, gravity,
  up to 4 colors). `endSize` and `endColor` grow / shrink and recolor them over their life (fire cooling to red,
  smoke swelling and thinning). They count against the world's capacity.

## Animation

Everything runs in the Rust core at 60 Hz, smoothed between steps like physics: no per-frame JS, and one native
call however many entities you animate.

```ts
await world.animate(piece, { position: [2, 0, 3] }, { duration: 0.25, easing: "back" });     // tween, then continue
world.animate(coin, { scale: 1.2 }, { repeat: "forever", yoyo: true });                       // pulse
world.animate(piece, [{ moveBy: [1, 1.5, 0] }, { moveBy: [2, 0, 0] }], { path: "smooth" }); // hop in an arc
world.animate(card, { turn: [0, Math.PI, 0] });                                               // flip (2π = full spin)
world.animate(tiles, { scale: 1 }, { stagger: 0.03, easing: "back" });                        // reveal a board
world.animate(cursor, { position: [x, 0, z] }, { spring: true });                             // chase a target
world.animate(tile, { shake: 0.15 }, { duration: 0.4 });                                      // "no!"
```

- **Independent properties**: position, rotation, scale, color and shake are separate tracks, so a piece can move while
  it pulses. Animating a property again replaces just that property.
- **Keyframes**: pass an array of targets, each with an optional `at` (0..1). `path: "smooth"` curves through them.
- **Relative**: `moveBy` (offset from the start) and `turn` (angles; more than 2π keeps spinning).
- **Springs**: `spring: true`, `"bouncy"` or `{ stiffness, damping, mass }` instead of a duration. Retargeting a moving
  spring keeps its velocity, so following a finger or a moving target never jerks.
- **Stagger**: give several entities and `stagger` seconds; one Promise resolves when the last one is done.
- **Shake**: decaying jitter on the drawn position only; the entity's real position (and collider) stays put.
- Easings: linear, easeIn, easeOut (default), easeInOut, back, bounce, elastic. Plus `delay`, `repeat` (or
  `"forever"`) and `yoyo`. `world.stopAnimation(e)` stops everything on an entity where it is.
- Cost: 10,000 entities with looping keyframe animations (30,000 tracks) take about 0.7 ms per update on an M-series
  Mac (`bun run core:bench`).

## 3D models

Load glTF 2.0 models (`.glb`, or `.gltf` with embedded buffers) and spawn them like any mesh:

```ts
import { loadModel } from "@nayan-ui/engine";

const tree = await loadModel(require("./assets/tree.glb"), { fit: 2 }); // largest side = 2 units
world.spawn({ mesh: tree, position: [0, tree.size[1] / 2, 0], physics: "fixed" });
```

- Parsed in Rust: meshes, node transforms, material base colors (and vertex colors) and the base color texture are
  kept (one texture per model). Skins, animations and Draco compression are not supported yet.
- Every entity using a model is drawn in one instanced draw call, like the built-in shapes.
- Physics colliders sized "from the mesh" use the model's bounding box times the entity's scale.
- `center` (default true) puts the bounding box center at the origin; `fit` rescales to a size.
- Models, font letters and textured variants share 240 mesh ids. Loading the same file twice returns the cached model.
- Add the extensions to Metro so `require` works: `config.resolver.assetExts.push("glb", "gltf")`.

## Custom shapes

Build your own meshes in code, Skia-style: draw a 2D `Path` (or paste SVG path data), then extrude it, spin it on a
lathe, or run a tube along a curve. `merge` bakes colored parts into one mesh, and `createShape` registers it like a
model. Fruit for a Fruit Ninja game is a few lines each:

```ts
import { createShape, extrude, lathe, merge, Path, tube } from "@nayan-ui/engine";

// A lathe spins a profile (x = distance from the axis, y down, as drawn) around the vertical axis.
const outline = Path.fromSVG("M0 0.1 C 0.12 -0.03 0.42 -0.06 0.5 0.3 C 0.55 0.62 0.36 0.9 0.14 0.93 Q 0.05 0.94 0 0.88");
const body = lathe(outline, { color: [0.85, 0.08, 0.1] });
const stem = tube([[0, 0, 0], [0.01, 0.1, 0], [0.04, 0.16, 0]], { radius: 0.022 });
const leaf = extrude(Path.fromSVG("M0 0 C 0.12 -0.1 0.34 -0.1 0.5 0 C 0.34 0.1 0.12 0.1 0 0 Z"), { depth: 0.015 });

const apple = createShape(
  merge([
    { geometry: body },
    { geometry: stem, position: [0, -0.12, 0], color: [0.42, 0.27, 0.13] }, // in the dimple at the top
    { geometry: leaf, position: [0.04, 0, 0], color: [0.25, 0.62, 0.2] },
  ]),
  { fit: 1, shine: 0.6 },
);
// Half an apple for slicing: half a turn, with the cut face (+Z) filled in the flesh color.
const appleHalf = createShape(lathe(outline, { sweep: Math.PI, color: [0.85, 0.08, 0.1], cutColor: [0.98, 0.93, 0.72] }));

world.spawn({ mesh: apple, position: [0, 2, 0], physics: "dynamic" });
```

- **`Path`**: `moveTo` `lineTo` `quadTo` `cubicTo` `arcTo` (SVG arcs) `close`, and `addRect` `addRRect` `addOval`
  `addCircle` `addPoly` `addStar` `addRegularPolygon`. `Path.fromSVG(d)` reads SVG path data (M L H V C S Q T A Z,
  absolute and relative), so you can draw in Figma or take any icon. Like Skia and SVG, y grows downward;
  solids are flipped upright.
- **`extrude(path, { depth, fillRule })`**: fills the path and gives it depth, facing +Z (`depth: 0` makes a flat,
  one-sided face). `fillRule` is `"nonzero"` (Skia's default, kWinding) or `"evenodd"` (every inner contour is a
  hole: rings, tags, donuts). Overlapping and self-crossing contours are resolved in Rust, as for 3D text. Textures map
  across the face. Badges, coins, leaves, hearts, stars, logos, fruit slices.
- **`lathe(profile, { segments, sweep, color, displace, capColor, cutColor })`**: fruit, vases, bottles, bowls, chess
  pieces. The profile is a `Path` or `[radius, height]` points (y up). With `sweep` below a full turn, the cut faces are
  filled (`cutColor`); flat ends away from the axis are capped (`capColor`: the face of a fruit cut across).
- **`tube(points, { radius, shape, sides, color, capColor })`**: a smooth tube through 3D points. `radius` can be a
  function of t (0..1) to taper it, and `shape` a function around it for ridges: bananas, stems, horns, worms, ropes.
- **Surface detail**: every `color` can be a function of the surface point (`u` around, `v` along, position, normal)
  for blushes, streaks, stripes and speckles; `capColor` and `cutColor` can be functions of the distance from the
  middle and the angle (or height) for segments, rinds and cores. `displace(u, v)` pushes a lathe's surface in or out
  (peel dimples, ribs) and recomputes its normals. Painted detail needs vertices: raise `segments` (and the number of
  profile points) for fine patterns.
- **`merge(parts)`**: bakes parts (any of the above, or `shapeGeometry("sphere")` and the other built-ins), each
  moved, rotated, scaled and colored, into one geometry. One mesh is one instanced draw and moves as one entity.
- **`createShape(geometry, { center, fit, shine })`**: registers it. Use the result as `mesh` anywhere (spawn, burst,
  `texture`, physics, picking). Colliders sized from the mesh use a box around the origin that holds the shape.
- Shapes share the 240 mesh ids with models and fonts, for the life of the app: create each one once (at module
  level), not per render or per spawn.

The example app's **Shapes** screen tosses fruit built this way (`example/games/shapes/fruits.ts`) and slices it on tap:
apple, orange, lemon, pear, strawberry, watermelon, banana, cherries, grapes, kiwi, mango, peach, pineapple, pomegranate
and papaya, each with painted skin and a cut face showing its flesh, seeds or stone.

## Features

- **Rendering** (WebGPU): 8 built-in shapes, custom shapes (Skia-style paths and SVG, extrude, lathe, tube, merge), glTF models, 3D text, textures and atlas regions, transparency,
  per-instance color, one instanced draw per mesh, directional light with a filtered shadow map that follows the camera,
  fog, perspective or orthographic cameras with follow and shake, 4x MSAA, and quality levels (`quality="auto"` steps
  down resolution, MSAA and shadows on phones that can't hold 60 fps).
- **Physics** ([Rapier](https://rapier.rs) in Rust): dynamic / kinematic / fixed bodies, ball, box, cylinder, capsule
  and cone colliders, friction, restitution, density, damping, rotation locks, 2D (planar) bodies, CCD, gravity, impulses, raycasts,
  collision layers/masks, sensors, start/stop contact events with impact speed.
- **Simulation**: fixed 60 Hz steps with render interpolation; velocity, acceleration, spin, visual bobbing,
  chase behavior, arena bounds, lifetimes (auto-despawn with shrink-out), tween animations, particle bursts,
  nested attachments (scene graph), picking.
- **Audio** (Rust): a realtime mixer on its own thread (32 voices, pitch, constant-power pan, looping,
  soft limiter) fed by WAV files and played through cpal (CoreAudio on iOS, AAudio on Android). The JS thread talks to it
  through a lock-free queue. iOS session category "ambient": respects the silent switch and mixes with other apps.
- **Haptics** (Rust): Core Haptics transients with continuous intensity and sharpness on iOS; the Vibrator
  service on Android (amplitude-controlled one-shots and waveforms). Patterns, throttling.
- **Impact feedback** (Rust): per-entity sound + haptic played by the core straight from physics contacts,
  scaled by approach speed and panned/attenuated relative to a listener entity. No JS per impact.
- **Attachments**: child entities follow a parent's interpolated pose (characters made of parts, props).
- **Input**: `onTap` / `onSwipe` / `onDrag` / `onLongPress` / `onPinch` on `GameView`, `world.pick(x, y)`,
  `world.screenToWorld(x, y, plane)` (finger to board position), a `Joystick` touch stick; plain RN
  touchables for buttons.

No Expo modules are required: rendering, physics, audio and haptics all live in this package.

## Layout

```
src/                      TypeScript library
  index.ts                public API
  types.ts                shared types (Shape, Camera, Light, RenderSource)
  assets/                 loadModel (glTF), loadTexture, loadFont, custom shapes (Path, extrude, lathe, tube, merge), asset bytes
  world/World.ts          entities, physics, collisions, animation, particles, text, picking
  render/                 GameView (touch, camera follow/shake), Renderer, WGSL shader, built-in shapes
  media/                  audio.ts (sound banks, playback), haptics.ts
  input/Joystick.tsx      touch stick
  native/                 TurboModule spec (codegen input)
core/                     Rust core (static library)
  src/world/              entities · physics · simulation · animation · particles · feedback · render/picking · shapes
  src/audio/              public API · mixer · device output
  src/model.rs            glTF parsing and the mesh registry (models, glyphs, textured variants)
  src/texture.rs          PNG / JPEG decoding
  src/font.rs             TrueType / OpenType glyphs extruded into meshes
  src/shape.rs            custom shapes: geometry registered from JS, 2D paths filled and extruded
  src/haptics.rs          Core Haptics (iOS), Vibrator (Android)
  src/android.rs          JavaVM/Context hand-off for audio and haptics
  src/ffi/                C ABI (world, media, meshes/textures/fonts, android); header in include/engine_core.h
  scripts/build-ios.sh    builds build/EngineCore.xcframework
  scripts/build-android.sh builds build/android/<abi>/libengine_core.a
  examples/bench.rs       benchmarks
cpp/                      JSI TurboModule (C++, shared by iOS and Android); cpp/generated = codegen header
ios/                      iOS module provider
android/                  Android build: CMakeLists.txt (a pure C++ module, autolinked via react-native.config.js)
example/                  Expo app
  games/racing/           Racing (curving, hilly track through city, suburbs and countryside; one glossy glTF
                          car painted per instance; textured road and grass; billboards; crashes into physics;
                          Playtura's 2-minute timer, lives and score)
  games/shapes/           custom shapes: fruit (lathes, tubes, extruded leaves) sliced on tap, and extruded SVG badges
  games/benchmark/        JS vs Rust and 1,500-body physics benchmark
  assets/sfx/             sounds, generated by scripts/make-sounds.py
  assets/models/          the tree (generated by scripts/make-models.py); the car: Khronos' "Car Concept"
                          glTF sample (CC BY 4.0, after a public-domain model by Unity Fan), simplified and split
                          into paintable body, glass and trim by scripts/import-car.py
  assets/textures/        asphalt, grass, building facades and billboard ads, generated by scripts/make-textures.py
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
- The example uses Expo Router: its home screen lists the examples, and a deep link opens one directly, e.g.
  `npx uri-scheme open nayan-engine-example://car-racing --android` (or `benchmark`).
- The games share one layout (`example/games/ui/GameLayout.tsx`): header, scoreboard, controls, and the result,
  leaderboard and settings cards. A game supplies its scene and scoreboard columns.

## How it stays fast

- One instanced `drawIndexed` per mesh in use. Model matrices live in a storage buffer.
- Glossy models (`loadModel(src, { shine })`) get a sun highlight and Fresnel sky reflection from a per-mesh
  material, at no per-instance cost.
- Colors above 1 glow (self-lit at 2): fire and lamps need no extra pass or per-instance data.
- Particle size and color over life are interpolated in the Rust core's fixed step; `"puff"` sprites are turned to
  the camera in the vertex shader (flagged by zero normals), so neither costs extra JS or draw calls.
- `light.color` dims and tints sun and ambient (moonlight); glowing colors ignore it, so night scenes keep lit lamps.
- One `writeBuffer` for all matrices per frame. No per-entity JS↔native calls.
- 4x MSAA with depth/MSAA targets set to `storeOp: "discard"`, so tile GPUs keep them on-chip.
- Resolution capped per quality level (phones with 3x+ screens don't draw every pixel); `"auto"` drops a level
  after two slow seconds.
- Only cut-out textures use `discard`, so early depth testing stays on for everything else on tile GPUs.
- Shadow coordinates computed per vertex; 16-bit shadow map and 16-bit indices halve their bandwidth.
- No allocation in the frame loop. `world.position(e, out)` / `velocity(e, out)` fill an array you reuse.
- One native call per `spawn` / `set`: options are packed into a reusable Float64Array that the core decodes.
- Rust core: structure-of-arrays storage, entities are `u32` handles, render buffers are fixed-size and never move.

## Status

Engine v0.5 (iOS and Android):

- [x] Rust world with generation-checked handles; Rapier rigid bodies, colliders, events, raycasts
- [x] Fixed-step simulation with interpolation; lifetimes; chase; bounds
- [x] Renderer with shadows; `GameView`; `Joystick`
- [x] Audio mixer and haptics in Rust; impact feedback from physics; attachments; sky color and fog
- [x] Android: native module (pure C++ autolinking), AAudio sound, Vibrator haptics
- [x] glTF models (meshes, node transforms, material colors, base color texture) with instancing and bounding-box colliders
- [x] Board / puzzle toolkit: picking, tap / swipe / drag, Rust animations, 3D text, more shapes, nested groups
- [x] Textures and atlas regions, transparency, orthographic camera, camera follow and shake, particle bursts, 2D physics
- [ ] Skinned / animated models, mipmapped textures, sorted transparency
- [ ] CI that builds the binaries and publishes
