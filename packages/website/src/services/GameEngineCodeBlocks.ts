// Code samples for the @nayan-ui/engine docs. Keep them in sync with packages/engine.

// ── Installation ─────────────────────────────────────────────────────────

export const engineInstallCode = `npm install @nayan-ui/engine react-native-webgpu`;

export const engineInstallBunCode = `bun add @nayan-ui/engine react-native-webgpu`;

export const engineExpoBuildCode = `# Native code: build a development client (Expo Go can't load it)
npx expo prebuild
npx expo run:ios`;

export const engineBareIosCode = `cd ios && pod install && cd ..
npx react-native run-ios`;

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
    w.spawn({ mesh: Mesh.Plane, scale: [20, 1, 20], color: [0.2, 0.25, 0.3], body: "fixed" });

    // ...and balls that fall, bounce and roll under real physics.
    for (let i = 0; i < 20; i++) {
      w.spawn({
        mesh: Mesh.Sphere,
        position: [Math.random() * 6 - 3, 4 + i, Math.random() * 6 - 3],
        color: [1, 0.6, 0.2],
        body: "dynamic",
        collider: { restitution: 0.7 },
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

export const engineGameLoopCode = `<GameView
  source={world}
  camera={camera}
  onUpdate={(dt) => {
    // 1. Read input and steer.
    world.setPlanarVelocity(player, stick.x * 8, -stick.y * 8);

    // 2. Step the simulation (physics, chasing, lifetimes) in Rust.
    world.update(dt);

    // 3. React to what happened.
    world.forEachCollision((a, b, { started }) => {
      if (started && (a === coin || b === coin)) collect();
    });

    // 4. Move the camera.
    const p = world.position(player);
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
  angularVelocity: [0, 1, 0],    // spin 1 radian per second around Y
});

world.despawn(crate);            // returns false if it was already gone`;

export const engineTransformCode = `world.setPosition(entity, [0, 1, 0]);          // teleport
world.setRotation(entity, [0, 0.38, 0, 0.92]); // quaternion (x, y, z, w)
world.setScale(entity, [2, 1, 2]);              // visual only
world.setColor(entity, [1, 0.2, 0.2]);

world.setVelocity(entity, [3, 0, 0]);           // units per second
world.setAngularVelocity(entity, [0, 2, 0]);    // radians per second
world.setOscillation(entity, { amplitude: [0, 0.3, 0], frequency: 3 }); // bob up and down
world.setFollow(enemy, player, 2.5);            // chase on the ground plane
world.setBounds(-20, -20, 20, 20);              // keep moving things inside an arena`;

export const engineLifetimeCode = `// Short-lived effects clean themselves up: the entity shrinks away and is despawned.
world.spawn({
  mesh: Mesh.Cube,
  position: [x, y, z],
  scale: 0.2,
  color: [1, 0.8, 0.2],
  velocity: [Math.random() * 4 - 2, 6, Math.random() * 4 - 2],
  body: "dynamic",
  lifetime: 0.8, // seconds
});`;

export const engineAttachCode = `// A character made of parts: children follow the parent exactly, with no lag.
const bird = world.spawn({ mesh: Mesh.Sphere, color: [1, 0.8, 0.2], body: "dynamic" });

world.spawn({ mesh: Mesh.Sphere, parent: bird, position: [0.3, 0.2, 0.4], scale: 0.3, color: [1, 1, 1] }); // eye
const wing = world.spawn({ mesh: Mesh.Cube, parent: bird, position: [-0.1, 0, 0.5], scale: [0.45, 0.1, 0.3] });

// For an attached entity, position and rotation are relative to the parent.
world.setRotation(wing, [Math.sin(angle / 2), 0, 0, Math.cos(angle / 2)]);

// Despawning the parent despawns its children too.
world.despawn(bird);`;

export const engineQueryCode = `const p = world.position(player);  // [x, y, z] or null if it's gone
const v = world.velocity(player);  // [x, y, z] or null
world.count;                       // live entities
world.capacity;                    // the fixed maximum`;

export const engineDisposeCode = `useEffect(() => () => world.dispose(), [world]); // any call after dispose() throws`;

// ── Physics ──────────────────────────────────────────────────────────────

export const engineBodiesCode = `// Never moves: floors, walls, platforms.
world.spawn({ mesh: Mesh.Plane, scale: [40, 1, 40], body: "fixed" });

// Moved by physics: gravity, collisions, impulses.
const ball = world.spawn({ mesh: Mesh.Sphere, position: [0, 5, 0], body: "dynamic" });

// Moved by you, but still pushes dynamic bodies out of the way.
const paddle = world.spawn({ mesh: Mesh.Cube, scale: [3, 0.5, 1], body: "kinematic" });

// Fine-tune a body with the long form.
world.spawn({
  mesh: Mesh.Cube,
  body: { type: "dynamic", lockRotations: true, linearDamping: 0.5, ccd: true },
  collider: { friction: 0.2, restitution: 0.4, density: 2 },
});`;

export const engineLayersCode = `// Give each kind of object a layer bit...
const WORLD = 1, PLAYER = 2, COIN = 4, ENEMY = 8;

const player = world.spawn({
  mesh: Mesh.Sphere,
  body: "dynamic",
  // ...and say which layers it interacts with.
  collider: { layer: PLAYER, mask: WORLD | COIN | ENEMY },
});

// Two colliders interact if either one's mask includes the other's layer,
// so coins don't need their own mask to be picked up by the player.
const coin = world.spawn({
  mesh: Mesh.Sphere,
  scale: 0.6,
  body: "kinematic",
  collider: { layer: COIN, mask: 0, sensor: true }, // a sensor reports touches but doesn't push
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

export const engineMovementCode = `// Steer on the ground but keep falling: sets X/Z velocity, keeps Y.
world.setPlanarVelocity(player, stick.x * 8, -stick.y * 8);

// A one-off push (jump, explosion, knockback). Dynamic bodies only.
world.applyImpulse(player, [0, 5, 0]);

// Change gravity for the whole world (default [0, -9.81, 0]).
world.setGravity([0, -26, 0]);`;

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

export const engineChangePhysicsCode = `// Swap or remove an entity's body later, e.g. a bird that tumbles once it dies.
world.setPhysics(bird, { mesh: Mesh.Sphere, body: "dynamic", collider: { restitution: 0.4 } });
world.setPhysics(bird, null); // no more physics`;

// ── Rendering ────────────────────────────────────────────────────────────

export const engineCameraCode = `const camera = useMemo<Camera>(() => ({ eye: [0, 20, 15], target: [0, 0, 0], fov: Math.PI / 3 }), []);

<GameView
  source={world}
  camera={camera}
  onUpdate={(dt) => {
    world.update(dt);
    // Mutate the camera object every frame: no React re-render needed.
    const p = world.position(player);
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
world.setImpactFeedback(player, {
  sound: sfx.get("bump"),
  minSpeed: 1,
  maxSpeed: 10,
  volume: 1,
  haptic: 0.7,   // vibration strength at full speed (0 = none)
});

// Impact sounds pan left/right relative to this entity.
world.setListener(player);

// Or set it when spawning:
world.spawn({ mesh: Mesh.Cube, body: "dynamic", impact: { sound: sfx.get("bump"), minSpeed: 3 } });`;

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
          world.setPlanarVelocity(player, stick.x * 8, -stick.y * 8);
          world.update(dt);
        }}
      />
      <Joystick state={stick} size={150} style={{ position: "absolute", left: 28, bottom: 56 }} />
    </View>
  );
}`;

export const engineButtonsCode = `import { Pressable, StyleSheet, Text } from "react-native";

// Any React Native touchable works. onPressIn reacts on touch-down: lowest latency.
<Pressable onPressIn={() => world.applyImpulse(player, [0, 6, 0])} style={styles.jump}>
  <Text>JUMP</Text>
</Pressable>

// Tap anywhere: a full-screen Pressable over the GameView.
<Pressable style={StyleSheet.absoluteFill} onPressIn={flap} />`;

// ── API reference ────────────────────────────────────────────────────────

export const engineExportsCode = `import {
  // World
  World, isRustAvailable, Mesh,
  // Rendering
  GameView,
  // Sound and haptics
  audio, haptics, impactStrength, SoundBank,
  // Input
  Joystick, createJoystickState,
} from "@nayan-ui/engine";

import type {
  Entity, SpawnOptions, BodyType, BodyOptions, ColliderOptions, CollisionInfo, RaycastHit,
  ImpactFeedback, Color, Vec3, MeshKind, Camera, Light, RenderSource, GameStats,
  Sound, Voice, PlayOptions, SoundSource, HapticTap, JoystickState,
} from "@nayan-ui/engine";`;

export const engineWorldApiCode = `class World {
  constructor(capacity: number);
  readonly capacity: number;
  readonly count: number;

  // Entities
  spawn(options?: SpawnOptions): Entity;
  despawn(e: Entity): boolean;
  setLifetime(e: Entity, seconds: number): void;
  setParent(e: Entity, parent: Entity | null): boolean;

  // Transform & appearance
  setPosition(e: Entity, position: Vec3): void;
  setRotation(e: Entity, quaternion: [x, y, z, w]): void;
  setScale(e: Entity, scale: Vec3): void;
  setColor(e: Entity, color: Color): void;

  // Motion
  setVelocity(e: Entity, velocity: Vec3): void;
  setPlanarVelocity(e: Entity, x: number, z: number): void;
  setAngularVelocity(e: Entity, velocity: Vec3): void;
  setOscillation(e: Entity, o: { amplitude: Vec3; frequency: number; phase?: number }): void;
  setFollow(e: Entity, target: Entity, speed: number): void;
  setBounds(minX: number, minZ: number, maxX: number, maxZ: number): void;

  // Physics
  setPhysics(e: Entity, options: { body?; collider?; mesh?; scale? } | null): boolean;
  applyImpulse(e: Entity, impulse: Vec3): void;
  setGravity(gravity: Vec3): void;
  raycast(origin: Vec3, direction: Vec3, maxDistance: number, mask?: number): RaycastHit | null;
  setImpactFeedback(e: Entity, feedback: ImpactFeedback | null): void;
  setListener(e: Entity | null): void;

  // Queries
  position(e: Entity): [number, number, number] | null;
  velocity(e: Entity): [number, number, number] | null;

  // Simulation
  update(dt: number): void;
  forEachCollision(fn: (a: Entity, b: Entity, info: CollisionInfo) => void): void;
  dispose(): void;
}`;

export const engineTypesCode = `type Vec3 = readonly [number, number, number];
type Color = readonly [r, g, b] | readonly [r, g, b, a];  // 0..1
type Entity = number;  // opaque handle

const Mesh = { Cube: 0, Sphere: 1, Plane: 2 };

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
