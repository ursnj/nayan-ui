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

export const engineCheckCode = `import { isRustAvailable } from "@nayan-ui/engine";

if (!isRustAvailable) {
  // Expo Go, or a platform the native core doesn't support yet.
  console.warn("The game engine's native core isn't linked into this build.");
}`;

// ── Quick start ──────────────────────────────────────────────────────────

export const engineQuickStartCode = `import { useEffect, useMemo } from "react";
import { GameView, Mesh, World, type Camera } from "@nayan-ui/engine";

export default function BouncingBalls() {
  // 1. A world holds every object in the game. Capacity is fixed up front.
  const world = useMemo(() => {
    const w = new World(200);

    // A floor that never moves...
    w.spawn({ mesh: Mesh.Plane, scale: [20, 1, 20], color: [0.2, 0.25, 0.3], physics: "fixed" });

    // ...and balls that fall, bounce and roll under real physics.
    for (let i = 0; i < 20; i++) {
      w.spawn({
        mesh: Mesh.Sphere,
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

export const engineSpawnCode = `import { Mesh, World } from "@nayan-ui/engine";

const world = new World(500);

const crate = world.spawn({
  mesh: Mesh.Cube,
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
  mesh: Mesh.Cube,
  position: [x, y, z],
  scale: 0.2,
  color: [1, 0.8, 0.2],
  velocity: [Math.random() * 4 - 2, 6, Math.random() * 4 - 2],
  physics: "dynamic",
  lifetime: 0.8, // seconds
});`;

export const engineAttachCode = `// A character made of parts: children follow the parent exactly, with no lag.
const bird = world.spawn({ mesh: Mesh.Sphere, color: [1, 0.8, 0.2], physics: "dynamic" });

world.spawn({ mesh: Mesh.Sphere, parent: bird, position: [0.3, 0.2, 0.4], scale: 0.3, color: [1, 1, 1] }); // eye
const wing = world.spawn({ mesh: Mesh.Cube, parent: bird, position: [-0.1, 0, 0.5], scale: [0.45, 0.1, 0.3] });

// For an attached entity, position and rotation are relative to the parent.
world.set(wing, { rotation: [Math.sin(angle / 2), 0, 0, Math.cos(angle / 2)] });

// Despawning the parent despawns its children too.
world.despawn(bird);`;

export const engineQueryCode = `const p = world.position(player);       // [x, y, z] or null if it's gone
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
world.spawn({ mesh: Mesh.Plane, scale: [40, 1, 40], physics: "fixed" });

// Moved by physics: gravity, collisions, impulses.
const ball = world.spawn({ mesh: Mesh.Sphere, position: [0, 5, 0], physics: "dynamic" });

// Moved by you, but still pushes dynamic bodies out of the way.
const paddle = world.spawn({ mesh: Mesh.Cube, scale: [3, 0.5, 1], physics: "kinematic" });

// Fine-tune with the long form. The collider is sized from the mesh and scale unless you say otherwise.
world.spawn({
  mesh: Mesh.Cube,
  physics: { type: "dynamic", upright: true, drag: 0.5, ccd: true, friction: 0.2, bounce: 0.4, density: 2 },
});`;

export const engineLayersCode = `// Give each kind of object a layer bit...
const WORLD = 1, PLAYER = 2, COIN = 4, ENEMY = 8;

const player = world.spawn({
  mesh: Mesh.Sphere,
  // ...and say which layers it interacts with.
  physics: { type: "dynamic", layer: PLAYER, mask: WORLD | COIN | ENEMY },
});

// Two colliders interact if either one's mask includes the other's layer,
// so coins don't need their own mask to be picked up by the player.
const coin = world.spawn({
  mesh: Mesh.Sphere,
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
  mesh: tree.mesh,
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
    world.spawn({ mesh: Mesh.Plane, scale: [60, 1, 60], color: [0.35, 0.55, 0.3], physics: "fixed" });
    for (let i = 0; i < 100; i++) {
      world.spawn({ mesh: tree.mesh, position: [(i % 10) * 4 - 18, 1, Math.floor(i / 10) * 4 - 18] });
    }
    return world;
  }, [tree]);
  useEffect(() => () => world?.dispose(), [world]);

  return world ? <GameView source={world} /> : <Text>Loading…</Text>;
}`;

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
world.spawn({ mesh: Mesh.Cube, physics: "dynamic", impact: { sound: sfx.get("bump"), minSpeed: 3 } });`;

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

export const engineImpactStrengthCode = `import { impactStrength } from "@nayan-ui/engine";

world.forEachCollision((a, b, { started, speed }) => {
  if (!started) return;
  const strength = impactStrength(speed, 2, 12); // 0 below 2, 1 at 12 and above
  if (strength > 0) sfx.play("hit", { volume: strength });
});`;

// ── Input ────────────────────────────────────────────────────────────────

export const engineJoystickCode = `import { useMemo } from "react";
import { View } from "react-native";
import { createJoystickState, GameView, Joystick } from "@nayan-ui/engine";

function Game() {
  const stick = useMemo(createJoystickState, []); // { x, y }, each -1..1, y is up

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

export const engineButtonsCode = `import { Pressable, StyleSheet, Text } from "react-native";

// Any React Native touchable works. onPressIn reacts on touch-down: lowest latency.
<Pressable onPressIn={() => world.impulse(player, [0, 6, 0])} style={styles.jump}>
  <Text>JUMP</Text>
</Pressable>

// Tap anywhere: a full-screen Pressable over the GameView.
<Pressable style={StyleSheet.absoluteFill} onPressIn={flap} />`;

// ── API reference ────────────────────────────────────────────────────────

export const engineExportsCode = `import {
  // World
  World, isRustAvailable, Mesh,
  // Rendering and models
  GameView, loadModel,
  // Sound and haptics
  audio, haptics, impactStrength, SoundBank,
  // Input
  Joystick, createJoystickState,
} from "@nayan-ui/engine";

import type {
  Entity, EntityOptions, PhysicsOptions, BodyType, ImpactFeedback, CollisionInfo, RaycastHit, Bounds,
  Color, Quat, Vec3, MeshKind, Model, ModelOptions, Camera, Light, RenderSource, GameStats,
  Sound, Voice, PlayOptions, SoundSource, HapticTap, JoystickState,
} from "@nayan-ui/engine";`;

export const engineWorldApiCode = `class World {
  constructor(capacity: number);
  readonly capacity: number;
  readonly count: number;

  // Entities: one call each
  spawn(options?: EntityOptions): Entity;
  set(e: Entity, options: EntityOptions): boolean;  // only what you pass changes; null removes
  despawn(e: Entity): boolean;
  impulse(e: Entity, impulse: Vec3): void;

  // Queries (pass \`out\` to reuse an array)
  position(e: Entity, out?: [x, y, z]): [x, y, z] | null;
  velocity(e: Entity, out?: [x, y, z]): [x, y, z] | null;
  has(e: Entity): boolean;
  raycast(origin: Vec3, direction: Vec3, maxDistance: number, mask?: number): RaycastHit | null;

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
  mesh?: MeshKind;
  position?: Vec3;
  rotation?: Quat;
  scale?: Vec3 | number;
  color?: Color;
  velocity?: Vec3;
  groundVelocity?: [x, z];
  spin?: Vec3;
  bob?: { amplitude: Vec3; speed: number; phase?: number } | null;
  follow?: { target: Entity; speed: number } | null;
  lifetime?: number | null;
  parent?: Entity | null;
  physics?: "dynamic" | "kinematic" | "fixed" | PhysicsOptions | null;
  impact?: ImpactFeedback | null;
};`;

export const engineTypesCode = `type Vec3 = readonly [number, number, number];
type Color = readonly [r, g, b] | readonly [r, g, b, a];  // 0..1
type Entity = number;  // opaque handle

const Mesh = { Cube: 0, Sphere: 1, Plane: 2 };
type MeshKind = number;  // a Mesh value or a loaded model's mesh

function loadModel(source: number | string, options?: { center?: boolean; fit?: number }): Promise<Model>;
type Model = { mesh: MeshKind; size: Vec3 };  // size at scale 1

type Camera = { eye: [x, y, z]; target: [x, y, z]; fov: number /* radians */ };

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

type GameStats = { fps: number; updateMs: number };`;

export const engineMediaApiCode = `const audio: {
  load<K extends string>(sources: Record<K, number | string>): SoundBank<K>;
  play(sound: Sound, options?: PlayOptions): Voice | null;
  stop(voice: Voice | null): void;
  muted: boolean;
  volume: number;          // 0..2
  readonly running: boolean;
};

class SoundBank<K extends string> {
  readonly ready: Promise<void>;
  get(name: K): Sound | undefined;
  play(name: K, options?: PlayOptions): Voice | null;
}

const haptics: {
  enabled: boolean;
  readonly supported: boolean;
  impact(intensity?: number, sharpness?: number): void;
  selection(): void;
  notify(type: "success" | "warning" | "error"): void;
  play(taps: { time: number; intensity: number; sharpness: number }[]): void;
};

function impactStrength(speed: number, min?: number, max?: number): number; // 0..1`;

export const engineInputApiCode = `type JoystickState = { x: number; y: number }; // each -1..1, y is up

function createJoystickState(): JoystickState;

function Joystick(props: {
  state: JoystickState;
  size?: number;        // diameter in points, default 150
  style?: ViewStyle;
}): JSX.Element;`;
