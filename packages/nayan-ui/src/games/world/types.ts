import type { Sound } from '../../audio/audio';
import type { Font, TextAlign } from '../assets/font';
// Entity, animation, physics, collision and query types used by World and its consumers.
import type { Model } from '../assets/model';
import type { Texture } from '../assets/texture';
import type { Vec3 } from '../types';
import type { ColorInput } from './color';

/** Opaque entity handle. Handles of despawned entities are safely ignored. */
export type Entity = number & { readonly __entity: unique symbol };

export type Color = readonly [number, number, number] | readonly [number, number, number, number];
export type Quat = readonly [number, number, number, number];

/** Playback for one entity using a skeletal animation embedded in a loaded model. */
export interface ClipOptions {
  /** Repeat the clip. Default true. */
  loop?: boolean;
  /** Playback rate; zero holds a pose. Default 1. */
  speed?: number;
  /** Crossfade from the current pose, in seconds. Default 0.15. */
  fade?: number;
  /** Seek to this time in seconds. Omit to retain playback when reselecting a clip. */
  time?: number;
}

/** Plane used by screenToWorld; defaults to the ground through the origin. */
export interface ScreenPlane {
  point?: Vec3;
  normal?: Vec3;
}

/**
 * - `dynamic`: moved by physics (gravity, collisions, impulses).
 * - `kinematic`: moved by you; pushes dynamic bodies out of the way.
 * - `fixed`: never moves (floors, walls).
 */
export type BodyType = 'dynamic' | 'kinematic' | 'fixed';

export type PhysicsOptions = {
  type: BodyType;
  /** Default: matches the mesh (spheres get a ball, cylinders a cylinder, ...; anything else a box). */
  shape?: 'ball' | 'box' | 'cylinder' | 'capsule' | 'cone';
  /** Ball, cylinder, capsule or cone radius. Default: from the entity's size. */
  radius?: number;
  /** Cylinder, capsule or cone height (total). Default: from the entity's size. */
  height?: number;
  /** Box size (full width, height, depth). Default: the entity's size. */
  size?: Vec3;
  /** Layer bits this collider is on. Default 1. */
  layer?: number;
  /** Layers it interacts with. Either side's mask is enough. Default: all. */
  mask?: number;
  /** Reports touches but doesn't push: pickups, trigger zones. */
  sensor?: boolean;
  /** How grippy, default 0.5. */
  friction?: number;
  /** Bounciness 0..1, default 0. */
  bounce?: number;
  /** Mass per volume, default 1. */
  density?: number;
  /** Slows movement over time (air resistance), default 0. */
  drag?: number;
  /** Slows spinning over time, default 0.05. */
  angularDrag?: number;
  /** Multiplier on world gravity, default 1. */
  gravityScale?: number;
  /** Stays upright: never tumbles. */
  upright?: boolean;
  /** Stops fast, small bodies passing through walls. */
  ccd?: boolean;
  /** 2D games: stays in its XY plane (moves in x/y, spins only around z). Keep the camera looking down -z. */
  planar?: boolean;
};

/** Sound/haptic the core plays by itself when the entity hits something solid. */
export type ImpactFeedback = {
  /** A loaded sound, e.g. `sfx.get("bump")`. Omit for haptics only. */
  sound?: Sound;
  /** Slower impacts are silent. Default 1. */
  minSpeed?: number;
  /** Full volume and strength at this speed. Default 10. */
  maxSpeed?: number;
  /** Volume at full strength, 0..2. Default 1. */
  volume?: number;
  /** Vibration at full strength, 0..1. Default 0 (none). */
  haptic?: number;
};

/**
 * Everything about an entity. `spawn` and `set` take the same options; in `set`, only what you
 * pass changes, and `null` removes something (physics, parent, follow, bob, lifetime, impact).
 */
export type EntityOptions = {
  /** A built-in shape or a model from `loadModel`. Default "cube". */
  mesh?: Shape | Model;
  /** An image from `loadTexture`, drawn on the mesh (`null` = none). In `set`, pass `mesh` with it. */
  texture?: Texture | null;
  /** Part of the texture to show, [u0, v0, u1, v1] from 0..1 (sprite sheets, card atlases). */
  textureRegion?: readonly [number, number, number, number];
  /** 3D text instead of a mesh (needs `font`). Letters are 1 unit tall at scale 1. */
  text?: string;
  /** A font from `loadFont`, for `text`. */
  font?: Font;
  /** Text alignment around `position`. Default "center". */
  align?: TextAlign;
  /** Extra space between letters, in ems. Default 0. */
  letterSpacing?: number;
  /** Digits all as wide as the widest, so changing scores and timers don't shift. Default false. */
  tabular?: boolean;
  /** Relative to the parent when attached. */
  position?: Vec3;
  rotation?: Quat;
  /** A number scales uniformly. Children scale with their parent. Visual only after the body exists. */
  scale?: Vec3 | number;
  /**
   * A CSS color (`'#FF4757'`, `'rgba(…)'`) or a 0..1 tuple. Alpha below 1 makes it see-through. Tuple
   * channels above 1 glow: at 2 it's self-lit, ignoring light and shadow (fire, lamps).
   */
  color?: ColorInput;
  /** Units per second. */
  velocity?: Vec3;
  /** Sets horizontal speed [x, z] and keeps the vertical one: steer a body and it still falls. */
  groundVelocity?: readonly [number, number];
  /** Units per second², for entities without a dynamic body (falling debris, thrown items). */
  acceleration?: Vec3;
  /** Radians per second around each axis. */
  spin?: Vec3;
  /** Visual bob: the drawn position moves by amplitude * sin(phase), phase advancing at `speed`. */
  bob?: { amplitude: Vec3; speed: number; phase?: number } | null;
  /** Chase `target` along the ground at `speed`. */
  follow?: { target: Entity; speed: number } | null;
  /** Seconds until it shrinks away and is despawned. */
  lifetime?: number | null;
  /** Attach to another entity: it moves, turns and scales with the parent and is despawned with it. Visual only. */
  parent?: Entity | null;
  physics?: BodyType | PhysicsOptions | null;
  impact?: ImpactFeedback | null;
  /** Whether `pick` can hit it. Default true. */
  pickable?: boolean;
  /**
   * Scenery that never moves (a board's background, a sky): drawn with the world's other still
   * entities into one cached image behind everything else (`World.backdrop`), redrawn only when one
   * of them changes, the camera moves or the light changes, instead of every frame. Spawn-only. The
   * returned entity takes `set` and `despawn` (and goes with the world); it can't be attached, have
   * physics or text, be animated or be picked, and everything live draws in front of it.
   */
  still?: boolean;
};

export type Easing = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut' | 'back' | 'bounce' | 'elastic';

/** What `animate` changes. Anything left out stays as it is (and keeps any animation it already has). */
export type AnimateTarget = {
  position?: Vec3;
  rotation?: Quat;
  scale?: Vec3 | number;
  /** A CSS color or a 0..1 tuple. */
  color?: ColorInput;
  /** Move by this offset from where the animation starts (instead of to a `position`). */
  moveBy?: Vec3;
  /** Turn by these angles (radians around x, y, z) from the starting rotation. 2π spins once; more spins more. */
  turn?: Vec3;
  /** Shake by up to this distance, fading out. Only the drawn position shakes (hits, wrong moves). */
  shake?: number;
};

/** A step of a keyframed animation: values to pass through, and when (0..1 of the duration; default evenly spaced). */
export type Keyframe = AnimateTarget & { at?: number };

export type SpringOptions = {
  /** How strongly it pulls toward the target. Default 170. */
  stiffness?: number;
  /** How quickly it calms down. Lower bounces more. Default 26 (no overshoot). */
  damping?: number;
  /** Heavier moves slower and swings further. Default 1. */
  mass?: number;
};

export type AnimateOptions = {
  /** Seconds (ignored by springs). Default 0.3. */
  duration?: number;
  /** Seconds before it starts. Default 0. */
  delay?: number;
  /** Default "easeOut". "back" overshoots, "bounce" bounces, "elastic" springs. */
  easing?: Easing;
  /** Extra runs after the first, or "forever". Default 0. */
  repeat?: number | 'forever';
  /** Every other run plays backwards (pulses, ping-pong). */
  yoyo?: boolean;
  /** With several entities: extra delay for each next one, in seconds (waves, board reveals). */
  stagger?: number;
  /** "smooth" moves along a curve through the keyframes (arcs, hops) instead of straight lines. */
  path?: 'linear' | 'smooth';
  /**
   * Physically simulated motion instead of a fixed duration: true (smooth), "bouncy", or your own
   * settings. Interrupting a spring with another keeps its speed, so it never jerks.
   */
  spring?: boolean | 'bouncy' | SpringOptions;
};

export type BurstOptions = {
  position: Vec3;
  /** How many particles. Default 16. */
  count?: number;
  /** Main direction. Default up. */
  direction?: Vec3;
  /** Half-angle of the cone around `direction`, in radians. Default π (every direction). */
  spread?: number;
  /** Default "cube". */
  mesh?: Shape | Model;
  /** Particle size. Default 0.15. */
  size?: number;
  /** Top speed. Default 5. */
  speed?: number;
  /** Seconds. Default 0.8. */
  lifetime?: number;
  /** Vertical acceleration. Default -9.81 (falls); 0 floats. */
  gravity?: number;
  /** One color (CSS string or tuple), or up to 4 to pick from at random. Default white. */
  color?: ColorInput | readonly ColorInput[];
  /** Size at the end of each particle's life, as a multiple of its start size: above 1 grows (smoke), below shrinks (embers). Default 1. */
  endSize?: number;
  /** Color every particle shifts to over its life, e.g. flame to dark red; an alpha below 1 fades it out. Default: keeps its color. */
  endColor?: ColorInput;
};

export type CollisionInfo = {
  /** True when the touch started; false when it ended. */
  started: boolean;
  /** A sensor was involved. */
  sensor: boolean;
  /** Impact speed (0 when a touch ends). */
  speed: number;
};

export type RaycastHit = {
  entity: Entity;
  distance: number;
  normal: [number, number, number];
  point: [number, number, number];
};

export type PickHit = {
  entity: Entity;
  /** Where the tap ray hit the entity's bounding box, in world space. */
  point: [number, number, number];
  distance: number;
};

export type Bounds = readonly [minX: number, minZ: number, maxX: number, maxZ: number];

// Re-export Shape from the shared types (used in EntityOptions and BurstOptions).
import type { Shape } from '../types';
export type { Shape };
