// Code samples for the @nayan-ui/engine docs. Keep them in sync with packages/engine.

// ── Installation ─────────────────────────────────────────────────────────

export const engineInstallCode = `npm install @nayan-ui/engine react-native-webgpu`;

export const engineInstallBunCode = `bun add @nayan-ui/engine react-native-webgpu`;

export const engineExpoBuildCode = `# Native code: build a development client (Expo Go can't load it)
npx expo prebuild
npx expo run:ios      # or: npx expo run:android`;

export const engineBareIosCode = `cd ios && pod install && cd ..
npx react-native run-ios      # or: npx react-native run-android`;

export const engineAndroidConfigCode = `{
  "expo": {
    "android": { "permissions": ["android.permission.VIBRATE"] },
    "plugins": [["expo-build-properties", { "android": { "minSdkVersion": 26 } }]]
  }
}`;

export const engineCheckCode = `import { isEngineAvailable } from "@nayan-ui/engine";

if (!isEngineAvailable) {
  // Expo Go, or a platform the native core doesn't support yet.
  console.warn("The game engine's native core isn't linked into this build.");
}`;

// ── Quick start ──────────────────────────────────────────────────────────

export const engineQuickStartCode = `import { useEffect, useMemo } from "react";
import { GameView, World, type Camera } from "@nayan-ui/engine";

export default function BouncingBalls() {
  // 1. A world holds every object in the game. Capacity is fixed up front.
  const world = useMemo(() => {
    const w = new World(200);

    // A floor that never moves...
    w.spawn({ mesh: "plane", scale: [20, 1, 20], color: [0.2, 0.25, 0.3], physics: "fixed" });

    // ...and balls that fall, bounce and roll under real physics.
    for (let i = 0; i < 20; i++) {
      w.spawn({
        mesh: "sphere",
        position: [Math.random() * 6 - 3, 4 + i, Math.random() * 6 - 3],
        color: [1, 0.6, 0.2],
        physics: { type: "dynamic", bounce: 0.7 },
      });
    }
    return w;
  }, []);

  // 2. Free the native world when the screen goes away.
  useEffect(() => () => world.dispose(), [world]);

  const camera = useMemo<Camera>(() => ({ eye: [0, 10, 16], target: [0, 0, 0], fov: Math.PI / 3 }), []);

  // 3. GameView draws the world; onUpdate is your game loop.
  return <GameView source={world} camera={camera} onUpdate={(dt) => world.update(dt)} style={{ flex: 1 }} />;
}`;

export const engineGameLoopCode = `const tmp: [number, number, number] = [0, 0, 0]; // reused every frame

<GameView
  source={world}
  camera={camera}
  onUpdate={(dt) => {
    // 1. Read input and steer.
    world.set(player, { groundVelocity: [stick.x * 8, -stick.y * 8] });

    // 2. Step the simulation (physics, chasing, lifetimes) in Rust.
    world.update(dt);

    // 3. React to what happened.
    world.forEachCollision((a, b, { started }) => {
      if (started && (a === coin || b === coin)) collect();
    });

    // 4. Move the camera (pass an array to reuse: no garbage each frame).
    const p = world.position(player, tmp);
    if (p) camera.target = [p[0], 0, p[2]];
  }}
/>`;

// ── World & entities ─────────────────────────────────────────────────────

export const engineSpawnCode = `import { World } from "@nayan-ui/engine";

const world = new World(500);

const crate = world.spawn({
  mesh: "cube",
  position: [0, 2, 0],
  scale: 1.5,                    // a number scales uniformly, or pass [x, y, z]
  color: [0.6, 0.45, 0.3],       // RGB, 0..1
  spin: [0, 1, 0],               // 1 radian per second around Y
});

world.despawn(crate);            // returns false if it was already gone`;

export const engineTransformCode = `// One call changes any options, in one native round trip. Only what you pass changes.
world.set(entity, { position: [0, 1, 0], color: [1, 0.2, 0.2] });
world.set(entity, { velocity: [3, 0, 0], spin: [0, 2, 0] });   // units / radians per second
world.set(entity, { rotation: [0, 0.38, 0, 0.92] });            // quaternion (x, y, z, w)
world.set(entity, { bob: { amplitude: [0, 0.3, 0], speed: 3 } }); // bob up and down
world.set(enemy, { follow: { target: player, speed: 2.5 } });   // chase on the ground

// null removes something.
world.set(entity, { bob: null, follow: null, physics: null });

// World-wide settings are properties.
world.bounds = [-20, -20, 20, 20];  // keep moving things inside an arena
world.gravity = [0, -20, 0];`;

export const engineLifetimeCode = `// Short-lived effects clean themselves up: the entity shrinks away and is despawned.
world.spawn({
  mesh: "cube",
  position: [x, y, z],
  scale: 0.2,
  color: [1, 0.8, 0.2],
  velocity: [Math.random() * 4 - 2, 6, Math.random() * 4 - 2],
  physics: "dynamic",
  lifetime: 0.8, // seconds
});`;

export const engineAttachCode = `// A character made of parts: children follow the parent exactly, with no lag.
const bird = world.spawn({ mesh: "sphere", color: [1, 0.8, 0.2], physics: "dynamic" });

world.spawn({ mesh: "sphere", parent: bird, position: [0.3, 0.2, 0.4], scale: 0.3, color: [1, 1, 1] }); // eye
const wing = world.spawn({ mesh: "cube", parent: bird, position: [-0.1, 0, 0.5], scale: [0.45, 0.1, 0.3] });

// For an attached entity, position and rotation are relative to the parent.
world.set(wing, { rotation: [Math.sin(angle / 2), 0, 0, Math.cos(angle / 2)] });

// Despawning the parent despawns its children too.
world.despawn(bird);`;

export const engineGroupsCode = `// "none" draws nothing: use it as a group, a pivot or a trigger zone.
const piece = world.spawn({ mesh: "none", position: [0, 0, 0], scale: 0.5 });

// An X made of two bars. Children move, turn and scale with their parent.
world.spawn({ mesh: "roundedBox", parent: piece, rotation: [0, 0.38, 0, 0.92], scale: [1.7, 0.36, 0.38] });
world.spawn({ mesh: "roundedBox", parent: piece, rotation: [0, -0.38, 0, 0.92], scale: [1.7, 0.36, 0.38] });

// Groups nest to any depth: a windmill > a turning hub > two crossed blades.
const windmill = world.spawn({ mesh: "none", position: [5, 0, 0] });
world.spawn({ mesh: "cylinder", parent: windmill, position: [0, 2, 0], scale: [0.4, 4, 0.4] }); // tower
const hub = world.spawn({ mesh: "none", parent: windmill, position: [0, 4, 0.3], spin: [0, 0, 1] });
world.spawn({ mesh: "cube", parent: hub, scale: [0.2, 3, 0.05] });
world.spawn({ mesh: "cube", parent: hub, scale: [3, 0.2, 0.05] });

// Moving, turning or scaling a group affects every part inside it.
world.set(windmill, { scale: 2 });`;

export const engineAccelerationCode = `// Debris that arcs and falls without a physics body.
world.spawn({
  mesh: "cube",
  position: [x, y, z],
  scale: 0.2,
  velocity: [2, 6, 0],
  acceleration: [0, -9.81, 0], // units per second²
  lifetime: 1.5,
});

// Decorations that taps should pass through.
world.spawn({ mesh: "plane", scale: [10, 1, 10], color: [0.2, 0.3, 0.4], pickable: false });`;

export const engineQueryCode = `const p = world.position(player);       // [x, y, z] or null if it's gone (relative to the parent when attached)
const w = world.worldPosition(sword);   // where it was last drawn, in world space (parents included)
const v = world.velocity(player);       // [x, y, z] or null
world.has(player);                      // still exists?
world.count;                            // live entities
world.capacity;                         // the fixed maximum

// In the game loop, reuse one array so nothing is allocated per frame.
const tmp: [number, number, number] = [0, 0, 0];
world.position(player, tmp);`;

export const engineDisposeCode = `useEffect(() => () => world.dispose(), [world]); // any call after dispose() throws`;

// ── Physics ──────────────────────────────────────────────────────────────

export const engineBodiesCode = `// Never moves: floors, walls, platforms.
world.spawn({ mesh: "plane", scale: [40, 1, 40], physics: "fixed" });

// Moved by physics: gravity, collisions, impulses.
const ball = world.spawn({ mesh: "sphere", position: [0, 5, 0], physics: "dynamic" });

// Moved by you, but still pushes dynamic bodies out of the way.
const paddle = world.spawn({ mesh: "cube", scale: [3, 0.5, 1], physics: "kinematic" });

// Fine-tune with the long form. The collider is sized from the mesh and scale unless you say otherwise.
world.spawn({
  mesh: "cube",
  physics: { type: "dynamic", upright: true, drag: 0.5, ccd: true, friction: 0.2, bounce: 0.4, density: 2 },
});`;

export const engineColliderShapesCode = `// The default collider matches the mesh: a cylinder rolls, a capsule stands like a character.
world.spawn({ mesh: "cylinder", position: [0, 2, 0], physics: "dynamic" });
world.spawn({ mesh: "capsule", scale: [1, 2, 1], physics: { type: "dynamic", upright: true } });

// Or pick the shape and size yourself. height is end to end.
world.spawn({
  mesh: tree, // a loaded model: a cylinder hugs the trunk better than its bounding box
  physics: { type: "fixed", shape: "cylinder", radius: 0.3, height: 2 },
});
world.spawn({ mesh: "cone", physics: { type: "dynamic", shape: "cone", radius: 0.5, height: 1 } });`;

export const enginePlanarCode = `// A 2D game with 3D looks: bodies move in x/y and spin only around z.
world.spawn({ mesh: "cube", position: [0, -0.5, 0], scale: [10, 1, 1], physics: { type: "fixed", planar: true } });

const fruit = world.spawn({
  mesh: "sphere",
  position: [0, 8, 0],
  physics: { type: "dynamic", planar: true, bounce: 0.15 },
});

// Look straight down -z with an orthographic camera, so it reads as 2D.
const camera: Camera = { eye: [0, 5, 30], target: [0, 5, 0], fov: 0.5, ortho: 8 };`;

export const engineLayersCode = `// Give each kind of object a layer bit...
const WORLD = 1, PLAYER = 2, COIN = 4, ENEMY = 8;

const player = world.spawn({
  mesh: "sphere",
  // ...and say which layers it interacts with.
  physics: { type: "dynamic", layer: PLAYER, mask: WORLD | COIN | ENEMY },
});

// Two colliders interact if either one's mask includes the other's layer,
// so coins don't need their own mask to be picked up by the player.
const coin = world.spawn({
  mesh: "sphere",
  scale: 0.6,
  physics: { type: "kinematic", layer: COIN, mask: 0, sensor: true }, // a sensor reports touches but doesn't push
});`;

export const engineCollisionsCode = `world.update(dt);

world.forEachCollision((a, b, info) => {
  if (!info.started) return;            // also fires when a touch ends (started: false)

  const other = a === player ? b : b === player ? a : null;
  if (other === null) return;

  if (coins.delete(other)) {
    world.despawn(other);               // ids of despawned entities are safely ignored
    score += 10;
  } else if (enemies.has(other)) {
    gameOver();
  }

  // info.speed is the impact speed: use it to scale a sound or a haptic.
});`;

export const engineMovementCode = `// Steer on the ground but keep falling: sets horizontal speed, keeps vertical.
world.set(player, { groundVelocity: [stick.x * 8, -stick.y * 8] });

// A one-off push (jump, explosion, knockback). Dynamic bodies only.
world.impulse(player, [0, 5, 0]);

// Change gravity for the whole world (default [0, -9.81, 0]).
world.gravity = [0, -26, 0];`;

export const engineRaycastCode = `// What is under the player? (solid colliders only; sensors are skipped)
const hit = world.raycast(position, [0, -1, 0], 2);
if (hit) {
  hit.entity;    // what was hit
  hit.distance;  // how far along the ray
  hit.point;     // [x, y, z]
  hit.normal;    // surface direction at the hit
}

// Only consider some layers.
const wall = world.raycast(eye, forward, 50, WORLD);`;

export const engineChangePhysicsCode = `// Swap or remove an entity's physics later, e.g. a bird that tumbles once it dies.
world.set(bird, { spin: [0, 0, 9], physics: { type: "dynamic", bounce: 0.4 } });
world.set(bird, { physics: null }); // no more physics`;

// ── Rendering ────────────────────────────────────────────────────────────

export const engineCameraCode = `const camera = useMemo<Camera>(() => ({ eye: [0, 20, 15], target: [0, 0, 0], fov: Math.PI / 3 }), []);
const tmp: [number, number, number] = [0, 0, 0];

<GameView
  source={world}
  camera={camera}
  onUpdate={(dt) => {
    world.update(dt);
    // Mutate the camera object every frame: no React re-render needed.
    const p = world.position(player, tmp);
    if (p) {
      const k = 1 - Math.exp(-dt * 5); // smooth follow
      camera.eye[0] += (p[0] - camera.eye[0]) * k;
      camera.eye[2] += (p[2] + 15 - camera.eye[2]) * k;
      camera.target = [p[0], 0, p[2]];
    }
  }}
/>`;

export const engineLightCode = `<GameView
  source={world}
  light={{
    direction: [0.4, 0.8, 0.5], // towards the light
    ambient: 0.35,              // 0..1 fill light
    shadows: true,              // soft shadows around the camera target
    shadowExtent: 25,           // half-size of the shadowed area
  }}
  background={[0.47, 0.73, 0.93]} // sky color, also the fog color
  fog={0.016}                     // distant objects fade into the sky
/>`;

export const engineShapesCode = `// Built-in shapes are strings. Each is 1 unit across before scaling.
world.spawn({ mesh: "cube" });
world.spawn({ mesh: "sphere" });
world.spawn({ mesh: "plane" });       // flat, facing up
world.spawn({ mesh: "cylinder" });    // radius 0.5, height 1
world.spawn({ mesh: "cone" });        // base radius 0.5, height 1, tip up
world.spawn({ mesh: "capsule" });     // radius 0.25, height 1 in total
world.spawn({ mesh: "torus" });       // lies flat: outer radius 0.5, tube 0.15
world.spawn({ mesh: "roundedBox" });  // a cube with soft edges: tiles, buttons
world.spawn({ mesh: "none" });        // invisible: groups, pivots, trigger zones

// Alpha below 1 makes any shape see-through: glass, ghosts, highlights.
world.spawn({ mesh: "cube", scale: [6, 8, 0.1], color: [0.75, 0.9, 1, 0.2] });`;

export const engineOrthoCode = `// Straight down, no perspective: boards and puzzles look flat and tidy.
const camera: Camera = {
  eye: [0, 10, 0.01],
  target: [0, 0, 0],
  fov: 1,     // ignored when ortho is set
  ortho: 5,   // half the visible height, in world units
};`;

export const engineFollowCode = `const camera = useMemo<Camera>(
  () => ({
    eye: [0, 8, 12],
    target: [0, 0, 0],
    fov: Math.PI / 3,
    // Each frame the target eases toward the player and the eye keeps this offset.
    follow: { target: player, offset: [0, 8, 12], smoothing: 0.15 },
  }),
  [player],
);

// On a big hit: shake it. The shake fades out by itself.
camera.shake = 0.3;

// Stop following.
camera.follow = null;`;

export const engineStatsCode = `<GameView
  source={world}
  onStats={({ fps, updateMs }) => setStats(\`\${fps.toFixed(0)} fps · \${updateMs.toFixed(2)} ms\`)}
  onError={(error) => console.error(error)}
/>`;

// ── Models ───────────────────────────────────────────────────────────────

export const engineModelMetroCode = `// metro.config.js: let require() bundle model files
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
config.resolver.assetExts.push("glb", "gltf");

module.exports = config;`;

export const engineModelLoadCode = `import { loadModel, World } from "@nayan-ui/engine";

// Loads and parses once; later calls with the same file return the same model.
const tree = await loadModel(require("./assets/tree.glb"), { fit: 2 }); // largest side = 2 units

world.spawn({
  mesh: tree,
  position: [4, tree.size[1] / 2, 0], // size is the model's bounding box at scale 1
  scale: 1.5,
  physics: "fixed",                   // collider = bounding box * scale
});`;

export const engineModelScreenCode = `function Forest() {
  const [tree, setTree] = useState<Model | null>(null);

  useEffect(() => {
    loadModel(require("./assets/tree.glb"), { fit: 2 }).then(setTree, console.error);
  }, []);

  const world = useMemo(() => {
    if (!tree) return null;
    const world = new World(200);
    world.spawn({ mesh: "plane", scale: [60, 1, 60], color: [0.35, 0.55, 0.3], physics: "fixed" });
    for (let i = 0; i < 100; i++) {
      world.spawn({ mesh: tree, position: [(i % 10) * 4 - 18, 1, Math.floor(i / 10) * 4 - 18] });
    }
    return world;
  }, [tree]);
  useEffect(() => () => world?.dispose(), [world]);

  return world ? <GameView source={world} /> : <Text>Loading…</Text>;
}`;

// ── Animation & effects ──────────────────────────────────────────────────

export const engineAnimateCode = `// Animate from where it is now to the target. Anything you leave out stays as it is.
world.animate(piece, { position: [2, 0, 3] }, { duration: 0.25, easing: "back" });

// Animate several things at once: position, rotation, scale and color.
world.animate(tile, { scale: 1.2, color: [1, 0.8, 0.3] }, { duration: 0.4 });

// Wait before starting.
world.animate(door, { rotation: [0, 0.71, 0, 0.71] }, { delay: 0.5 }); // turn 90° around y`;

export const engineAnimateChainCode = `// animate returns a Promise that resolves when it finishes, so you can wait for it.
async function move(piece: Entity, x: number, z: number) {
  await world.animate(piece, { position: [x, 1, z] }, { duration: 0.2 });              // lift and slide
  await world.animate(piece, { position: [x, 0, z] }, { duration: 0.3, easing: "bounce" }); // drop
  checkBoard(); // runs once the piece has landed
}

// Different entities animate side by side. Wait for all of them.
await Promise.all(tiles.map((t, i) => world.animate(t, { position: targets[i] })));`;

export const engineAnimatePulseCode = `// A pulse: grow, then play backwards, forever.
world.animate(coin, { scale: 1.25 }, { duration: 0.35, repeat: "forever", yoyo: true, easing: "easeInOut" });

// A quick pop: up and back once (one extra run, played backwards).
world.animate(scoreText, { scale: 1.35 }, { duration: 0.12, repeat: 1, yoyo: true });

// Stop it where it is.
world.stopAnimation(coin);`;

export const engineBurstCode = `// Confetti: one call spawns them all. They fly out, fall, spin, shrink away and clean themselves up.
world.burst({
  position: [0, 1, 0],
  count: 30,
  color: [[1, 0.3, 0.3], [1, 0.9, 0.2], [0.3, 0.7, 1]], // up to 4 colors, picked at random
});

// Sparks shooting up in a narrow cone that float instead of falling.
world.burst({
  position: hit.point,
  direction: [0, 1, 0],
  spread: 0.4,          // radians around direction
  mesh: "sphere",
  size: 0.08,
  speed: 8,
  lifetime: 0.5,
  gravity: 0,
  color: [1, 0.8, 0.2],
});`;

export const engineShakeCode = `<GameView
  source={world}
  camera={camera}
  onUpdate={(dt) => {
    world.update(dt);
    world.forEachCollision((a, b, { started, speed }) => {
      // Shake harder for harder hits. It fades out by itself.
      if (started && speed > 5) camera.shake = Math.min(0.5, speed * 0.03);
    });
  }}
/>`;

// ── Text & textures ──────────────────────────────────────────────────────

export const engineFontCode = `import { loadFont } from "@nayan-ui/engine";

// Each character becomes a 3D mesh. Only build the ones you need: it loads faster.
const font = await loadFont(require("./assets/Inter-Bold.ttf"), { chars: "0123456789", depth: 0.2 });

// Letters are 1 unit tall at scale 1.
const score = world.spawn({ text: "0", font, position: [0, 5, 0], scale: 0.8, color: [1, 1, 1] });

// Change the text or color later. Changing text rebuilds the letters.
world.set(score, { text: "120" });
world.set(score, { color: [1, 0.4, 0.4] });

// Line it up around its position: "left", "center" (default) or "right".
world.spawn({ text: "42", font, align: "right", position: [4, 5, 0] });`;

export const engineTextTileCode = `// Text faces +z. Turn it -90° around x to lie face up on a tile.
const flat = [-Math.SQRT1_2, 0, 0, Math.SQRT1_2] as const;

const tile = world.spawn({ mesh: "roundedBox", scale: [1, 0.3, 1], color: [1, 0.8, 0.4] });

// Parent the label to the tile: it moves, turns and scales with it.
// Children inherit the parent's scale, so position is in the tile's units: 0.6 x 0.3 = 0.18, just above its top.
const label = world.spawn({ text: "2048", font, parent: tile, position: [0, 0.6, 0], rotation: flat, scale: 0.4 });

// Moving or animating the tile carries the label along.
world.animate(tile, { position: [1, 0, 0] }, { easing: "back" });`;

export const engineTextureCode = `import { loadTexture } from "@nayan-ui/engine";

// PNG or JPEG, up to 4096 x 4096. Loading the same file twice returns the cached texture.
const wood = await loadTexture(require("./assets/wood.png"));

world.spawn({ mesh: "cube", texture: wood });                         // any built-in shape or model
world.spawn({ mesh: "plane", texture: wood, color: [1, 0.8, 0.6] });   // color tints the texture

// To change the texture with set, pass the mesh too.
world.set(crate, { mesh: "cube", texture: metal });
world.set(crate, { mesh: "cube", texture: null }); // remove it`;

export const engineAtlasCode = `// One image holds all 52 cards: 13 columns, 4 rows.
const cards = await loadTexture(require("./assets/cards.png"));
const COLS = 13, ROWS = 4;

// [u0, v0, u1, v1], each 0..1: the part of the image to show.
const region = (col: number, row: number) =>
  [col / COLS, row / ROWS, (col + 1) / COLS, (row + 1) / ROWS] as const;

const card = world.spawn({ mesh: "plane", scale: [0.7, 1, 1], texture: cards, textureRegion: region(0, 0) });

// Show a different card: change only the region.
world.set(card, { textureRegion: region(11, 2) });`;

export const engineTransparencyCode = `// Alpha below 1 is drawn see-through, after everything solid.
world.spawn({ mesh: "cube", scale: [6, 8, 0.1], color: [0.75, 0.9, 1, 0.16], pickable: false }); // glass
world.spawn({ mesh: "sphere", color: [1, 1, 1, 0.4] });                                         // a ghost

// Fade something out, then remove it.
await world.animate(enemy, { color: [1, 0.3, 0.3, 0] }, { duration: 0.4 });
world.despawn(enemy);`;

// ── Audio & haptics ──────────────────────────────────────────────────────

export const engineSoundsCode = `import { audio } from "@nayan-ui/engine";

// Load once (outside components is fine): sounds are decoded a single time.
const sfx = audio.load({
  jump: require("./assets/jump.wav"),
  coin: require("./assets/coin.wav"),
  music: require("./assets/music.wav"),
});

await sfx.ready;   // a few milliseconds; plays before this are ignored

sfx.play("coin");
sfx.play("jump", { volume: 0.8, pitch: 1.1, pan: -0.3 });`;

export const engineMusicCode = `const voice = sfx.play("music", { loop: true, volume: 0.4 });

audio.stop(voice);     // stop that one sound
audio.muted = true;    // a settings toggle
audio.volume = 0.8;    // master volume, 0..2`;

export const engineImpactCode = `const sfx = audio.load({ bump: require("./assets/bump.wav") });
await sfx.ready;

// The engine plays this by itself whenever the player hits something solid:
// louder for harder hits, silent below minSpeed. No code runs in JS per impact.
world.set(player, {
  impact: {
    sound: sfx.get("bump"),
    minSpeed: 1,
    maxSpeed: 10,
    volume: 1,
    haptic: 0.7, // vibration strength at full speed (0 = none)
  },
});

// Impact sounds pan left/right relative to this entity.
world.listener = player;

// Or set it when spawning:
world.spawn({ mesh: "cube", physics: "dynamic", impact: { sound: sfx.get("bump"), minSpeed: 3 } });`;

export const engineHapticsCode = `import { haptics } from "@nayan-ui/engine";

haptics.impact(0.6, 0.5);   // intensity, sharpness (0..1); rapid repeats are throttled
haptics.selection();        // a light tick for UI
haptics.notify("success");  // "success" | "warning" | "error"

// Your own pattern: taps with times in seconds.
haptics.play([
  { time: 0, intensity: 1, sharpness: 0.8 },
  { time: 0.12, intensity: 0.5, sharpness: 0.3 },
]);

haptics.enabled = false;    // a settings toggle
haptics.supported;          // false on simulators and devices without a haptic engine`;

export const engineImpactStrengthCode = `world.forEachCollision((a, b, { started, speed }) => {
  if (!started) return;
  const strength = Math.min(1, Math.max(0, (speed - 2) / 10)); // 0 below 2, 1 at 12 and above
  if (strength > 0) sfx.play("hit", { volume: strength });
});`;

// ── Input ────────────────────────────────────────────────────────────────

export const engineJoystickCode = `import { View } from "react-native";
import { GameView, Joystick, useJoystick } from "@nayan-ui/engine";

function Game() {
  const stick = useJoystick(); // { x, y }, each -1..1, y is up

  return (
    <View style={{ flex: 1 }}>
      <GameView
        source={world}
        onUpdate={(dt) => {
          world.set(player, { groundVelocity: [stick.x * 8, -stick.y * 8] });
          world.update(dt);
        }}
      />
      <Joystick state={stick} size={150} style={{ position: "absolute", left: 28, bottom: 56 }} />
    </View>
  );
}`;

export const engineGesturesCode = `import { GameView, type DragEvent, type SwipeDirection } from "@nayan-ui/engine";

<GameView
  source={world}
  onUpdate={(dt) => world.update(dt)}
  // A quick tap, in points from the view's top-left.
  onTap={(x, y) => tapAt(x, y)}
  // A quick flick: "left" | "right" | "up" | "down".
  onSwipe={(direction: SwipeDirection) => slide(direction)}
  // Finger down, moving and up. dx and dy are measured from where the drag started.
  onDrag={({ phase, x, y, dx, dy }: DragEvent) => {
    if (phase === "start") startAim(x, y);
    else if (phase === "move") aim(dx, dy);
    else shoot(dx, dy); // "end"
  }}
/>`;

export const enginePickCode = `// Find the entity under the finger. It tests what was drawn, so no physics is needed.
<GameView
  source={world}
  onTap={(x, y) => {
    const hit = world.pick(x, y);
    if (!hit) return;               // nothing pickable there
    hit.entity;                     // what was tapped
    hit.point;                      // [x, y, z] where the tap ray hit it
    hit.distance;                   // how far from the camera
    if (cells.has(hit.entity)) play(hit.entity);
  }}
/>

// Things taps should pass through (glass, guides, text):
world.spawn({ mesh: "cube", color: [1, 1, 1, 0.2], pickable: false });`;

export const engineToScreenCode = `// Place a React Native view over a 3D object, e.g. a name tag or a "+10" popup.
const [tag, setTag] = useState<[number, number] | null>(null);
const tmp: [number, number, number] = [0, 0, 0];

<View style={{ flex: 1 }}>
  <GameView
    source={world}
    onUpdate={(dt) => {
      world.update(dt);
      const p = world.worldPosition(player, tmp);
      // [x, y] in points from the view's top-left, or null if it's behind the camera.
      const screen = p && world.toScreen([p[0], p[1] + 1.5, p[2]]);
      if (screen && shouldUpdate(screen)) setTag(screen); // update state only when it really moves
    }}
  />
  {tag && <Text style={{ position: "absolute", left: tag[0], top: tag[1] }}>Player 1</Text>}
</View>`;

export const engineButtonsCode = `import { Pressable, StyleSheet, Text } from "react-native";

// Any React Native touchable works. onPressIn reacts on touch-down: lowest latency.
<Pressable onPressIn={() => world.impulse(player, [0, 6, 0])} style={styles.jump}>
  <Text>JUMP</Text>
</Pressable>

// Lowest-latency "tap anywhere": a full-screen Pressable over the GameView.
// GameView's onTap waits for the finger to lift, to tell taps from swipes.
<Pressable style={StyleSheet.absoluteFill} onPressIn={flap} />`;

// ── API reference ────────────────────────────────────────────────────────

export const engineExportsCode = `import {
  // World
  World, isEngineAvailable,
  // Rendering and touch
  GameView,
  // Models, textures and fonts
  loadModel, loadTexture, loadFont,
  // Sound and haptics
  audio, haptics,
  // Input
  Joystick, useJoystick,
} from "@nayan-ui/engine";

import type {
  // World
  Entity, EntityOptions, PhysicsOptions, BodyType, ImpactFeedback, CollisionInfo, RaycastHit, PickHit, Bounds,
  AnimateOptions, AnimateTarget, Easing, BurstOptions, Color, Quat, Vec3, Shape,
  // Rendering and touch
  Camera, Light, RenderSource, GameStats, DragEvent, SwipeDirection,
  // Models, textures and fonts
  Model, ModelOptions, Texture, Font, FontOptions, TextAlign,
  // Sound, haptics and input
  Sound, SoundBank, Voice, PlayOptions, SoundSource, HapticTap, JoystickState,
} from "@nayan-ui/engine";`;

export const engineWorldApiCode = `class World {
  constructor(capacity: number);
  readonly capacity: number;
  readonly count: number;        // live entities (text letters count too)

  // Entities: one call each
  spawn(options?: EntityOptions): Entity;
  set(e: Entity, options: EntityOptions): boolean;  // only what you pass changes; null removes
  despawn(e: Entity): boolean;                       // also removes anything attached to it
  impulse(e: Entity, impulse: Vec3): void;

  // Animation and effects
  animate(e: Entity, to: AnimateTarget, options?: AnimateOptions): Promise<void>;
  stopAnimation(e: Entity): void;
  burst(options: BurstOptions): number;              // how many particles were spawned

  // Queries (pass \`out\` to reuse an array)
  position(e: Entity, out?: [x, y, z]): [x, y, z] | null;       // relative to the parent when attached
  worldPosition(e: Entity, out?: [x, y, z]): [x, y, z] | null;  // where it was last drawn, world space
  velocity(e: Entity, out?: [x, y, z]): [x, y, z] | null;
  has(e: Entity): boolean;
  raycast(origin: Vec3, direction: Vec3, maxDistance: number, mask?: number): RaycastHit | null;
  pick(x: number, y: number): PickHit | null;        // the entity under a GameView point
  toScreen(position: Vec3): [x, y] | null;           // GameView points, null if behind the camera

  // World settings
  gravity: Vec3;                 // default [0, -9.81, 0]
  bounds: Bounds | null;         // [minX, minZ, maxX, maxZ]
  listener: Entity | null;       // impact sounds pan relative to it

  // Simulation
  update(dt: number): void;
  forEachCollision(fn: (a: Entity, b: Entity, info: CollisionInfo) => void): void;
  dispose(): void;
}

type EntityOptions = {
  mesh?: Shape | Model;                  // default "cube"
  texture?: Texture | null;
  textureRegion?: [u0, v0, u1, v1];      // 0..1
  text?: string;                         // needs font
  font?: Font;
  align?: TextAlign;                     // default "center"
  position?: Vec3;
  rotation?: Quat;
  scale?: Vec3 | number;
  color?: Color;                         // alpha below 1 is see-through
  velocity?: Vec3;
  groundVelocity?: [x, z];
  acceleration?: Vec3;
  spin?: Vec3;
  bob?: { amplitude: Vec3; speed: number; phase?: number } | null;
  follow?: { target: Entity; speed: number } | null;
  lifetime?: number | null;
  parent?: Entity | null;
  physics?: BodyType | PhysicsOptions | null;
  impact?: ImpactFeedback | null;
  pickable?: boolean;                    // default true
};

type PhysicsOptions = {
  type: "dynamic" | "kinematic" | "fixed";
  shape?: "ball" | "box" | "cylinder" | "capsule" | "cone";  // default: matches the mesh
  radius?: number;
  height?: number;
  size?: Vec3;
  layer?: number;          // default 1
  mask?: number;           // default all
  sensor?: boolean;
  friction?: number;       // default 0.5
  bounce?: number;         // default 0
  density?: number;        // default 1
  drag?: number;           // default 0
  angularDrag?: number;    // default 0.05
  gravityScale?: number;   // default 1
  upright?: boolean;
  ccd?: boolean;
  planar?: boolean;        // 2D: stays in its XY plane
};

type AnimateTarget = { position?: Vec3; rotation?: Quat; scale?: Vec3 | number; color?: Color };

type AnimateOptions = {
  duration?: number;             // seconds, default 0.3
  delay?: number;                // seconds, default 0
  easing?: Easing;               // default "easeOut"
  repeat?: number | "forever";   // extra runs, default 0
  yoyo?: boolean;                // every other run plays backwards
};

type Easing = "linear" | "easeIn" | "easeOut" | "easeInOut" | "back" | "bounce" | "elastic";

type BurstOptions = {
  position: Vec3;
  count?: number;                  // default 16
  direction?: Vec3;                // default [0, 1, 0]
  spread?: number;                 // radians, default π
  mesh?: Shape | Model;            // default "cube"
  size?: number;                   // default 0.15
  speed?: number;                  // default 5
  lifetime?: number;               // default 0.8
  gravity?: number;                // default -9.81
  color?: Color | Color[];         // up to 4, default white
};`;

export const engineTypesCode = `type Vec3 = readonly [number, number, number];
type Color = readonly [r, g, b] | readonly [r, g, b, a];  // 0..1
type Quat = readonly [x, y, z, w];
type Entity = number;  // opaque handle

// Each 1 unit across before scaling. "none" isn't drawn.
type Shape = "cube" | "sphere" | "plane" | "cylinder" | "cone" | "capsule" | "torus" | "roundedBox" | "none";

function loadModel(source: number | string, options?: { center?: boolean; fit?: number }): Promise<Model>;
type Model = { size: Vec3; id: number };  // pass as mesh; size at scale 1

function loadTexture(source: number | string): Promise<Texture>;  // PNG or JPEG, up to 4096
type Texture = { id: number; width: number; height: number };

function loadFont(source: number | string, options?: FontOptions): Promise<Font>;  // TTF or OTF
type FontOptions = { depth?: number /* default 0.2 */; chars?: string };
type Font = { id: number; capHeight: number; glyphs: ReadonlyMap<string, { mesh: number; advance: number }> };
type TextAlign = "left" | "center" | "right";

type Camera = {
  eye: [x, y, z];
  target: [x, y, z];
  fov: number;              // radians; ignored when ortho is set
  ortho?: number;           // orthographic: half the visible height in world units
  follow?: { target: Entity; offset: Vec3; smoothing?: number /* default 0.15 */ } | null;
  shake?: number;           // world units; fades out by itself
};

type Light = {
  direction: [x, y, z];   // towards the light
  ambient: number;        // 0..1
  shadows?: boolean;      // default true
  shadowExtent?: number;  // default 30
};

type CollisionInfo = { started: boolean; sensor: boolean; speed: number };

type RaycastHit = {
  entity: Entity;
  distance: number;
  normal: [x, y, z];
  point: [x, y, z];
};

type PickHit = {
  entity: Entity;
  point: [x, y, z];   // where the tap ray hit its bounding box
  distance: number;
};

type GameStats = { fps: number; updateMs: number };`;

export const engineMediaApiCode = `const audio: {
  load<K extends string>(sources: Record<K, number | string>): SoundBank<K>;
  play(sound: Sound, options?: PlayOptions): Voice | null;
  stop(voice: Voice | null): void;
  muted: boolean;
  volume: number;          // 0..2
  readonly running: boolean;
};

// Returned by audio.load
type SoundBank<K extends string> = {
  readonly ready: Promise<void>;
  get(name: K): Sound | undefined;
  play(name: K, options?: PlayOptions): Voice | null;
};

const haptics: {
  enabled: boolean;
  readonly supported: boolean;
  impact(intensity?: number, sharpness?: number): void;
  selection(): void;
  notify(type: "success" | "warning" | "error"): void;
  play(taps: { time: number; intensity: number; sharpness: number }[]): void;
};`;

export const engineInputApiCode = `// GameView touch props
onTap?: (x: number, y: number) => void;           // points from the view's top-left
onSwipe?: (direction: SwipeDirection) => void;
onDrag?: (drag: DragEvent) => void;

type SwipeDirection = "left" | "right" | "up" | "down";

type DragEvent = {
  phase: "start" | "move" | "end";
  x: number;    // finger position in the view, in points
  y: number;
  dx: number;   // distance moved since the drag started
  dy: number;
};

type JoystickState = { x: number; y: number }; // each -1..1, y is up

function useJoystick(): JoystickState;  // a state object for the component's lifetime

function Joystick(props: {
  state: JoystickState;
  size?: number;        // diameter in points, default 150
  style?: ViewStyle;
}): JSX.Element;`;
