// Encodes entity options into the flat layout the Rust core decodes (core/include/engine_core.h,
// core/src/world/desc.rs). One reusable Float64Array per world: spawning or changing an entity is
// a single native call, and doubles keep entity ids and layer bits exact.
import type { EntityOptions, PhysicsOptions } from "./World";

export const DESC_LEN = 55;

const FLAG = {
  MESH: 1 << 0,
  POSITION: 1 << 1,
  ROTATION: 1 << 2,
  SCALE: 1 << 3,
  COLOR: 1 << 4,
  VELOCITY: 1 << 5,
  GROUND_VELOCITY: 1 << 6,
  SPIN: 1 << 7,
  BOB: 1 << 8,
  FOLLOW: 1 << 9,
  LIFETIME: 1 << 10,
  PARENT: 1 << 11,
  PHYSICS: 1 << 12,
  IMPACT: 1 << 13,
} as const;

const SLOT = {
  FLAGS: 0,
  MESH: 1,
  POSITION: 2,
  ROTATION: 5,
  SCALE: 9,
  COLOR: 12,
  VELOCITY: 16,
  GROUND_VELOCITY: 19,
  SPIN: 21,
  BOB: 24,
  FOLLOW: 29,
  LIFETIME: 31,
  PARENT: 32,
  PHYSICS: 33,
  IMPACT: 49,
} as const;

const BODY_KIND = { dynamic: 1, kinematic: 2, fixed: 3 } as const;
const SHAPE = { ball: 0, box: 1, fromMesh: 2 } as const;

function encodePhysics(d: Float64Array, physics: PhysicsOptions) {
  const p = SLOT.PHYSICS;
  const shape =
    physics.shape === "ball" || (physics.shape === undefined && physics.radius !== undefined)
      ? SHAPE.ball
      : physics.shape === "box" || physics.size !== undefined
        ? SHAPE.box
        : SHAPE.fromMesh;
  // Sizes <= 0 tell the core to size the collider from the entity's mesh and scale.
  const [sx, sy, sz] =
    shape === SHAPE.ball
      ? [physics.radius ?? 0, 0, 0]
      : physics.size
        ? [physics.size[0] / 2, physics.size[1] / 2, physics.size[2] / 2]
        : [0, 0, 0];
  d[p] = BODY_KIND[physics.type];
  d[p + 1] = shape;
  d[p + 2] = sx;
  d[p + 3] = sy;
  d[p + 4] = sz;
  d[p + 5] = physics.layer ?? 1;
  d[p + 6] = physics.mask ?? -1; // all layers
  d[p + 7] = physics.sensor ? 1 : 0;
  d[p + 8] = physics.friction ?? 0.5;
  d[p + 9] = physics.bounce ?? 0;
  d[p + 10] = physics.density ?? 1;
  d[p + 11] = physics.drag ?? 0;
  d[p + 12] = physics.angularDrag ?? 0.05;
  d[p + 13] = physics.gravityScale ?? 1;
  d[p + 14] = physics.upright ? 1 : 0;
  d[p + 15] = physics.ccd ? 1 : 0;
}

/** Writes `options` into `d`. Only the fields present are flagged; the rest are ignored. */
export function encode(d: Float64Array, o: EntityOptions) {
  let flags = 0;
  if (o.mesh !== undefined) {
    flags |= FLAG.MESH;
    d[SLOT.MESH] = o.mesh;
  }
  if (o.position) {
    flags |= FLAG.POSITION;
    d.set(o.position, SLOT.POSITION);
  }
  if (o.rotation) {
    flags |= FLAG.ROTATION;
    d.set(o.rotation, SLOT.ROTATION);
  }
  if (o.scale !== undefined) {
    flags |= FLAG.SCALE;
    if (typeof o.scale === "number") d.fill(o.scale, SLOT.SCALE, SLOT.SCALE + 3);
    else d.set(o.scale, SLOT.SCALE);
  }
  if (o.color) {
    flags |= FLAG.COLOR;
    d[SLOT.COLOR] = o.color[0];
    d[SLOT.COLOR + 1] = o.color[1];
    d[SLOT.COLOR + 2] = o.color[2];
    d[SLOT.COLOR + 3] = o.color[3] ?? 1;
  }
  if (o.velocity) {
    flags |= FLAG.VELOCITY;
    d.set(o.velocity, SLOT.VELOCITY);
  }
  if (o.groundVelocity) {
    flags |= FLAG.GROUND_VELOCITY;
    d.set(o.groundVelocity, SLOT.GROUND_VELOCITY);
  }
  if (o.spin) {
    flags |= FLAG.SPIN;
    d.set(o.spin, SLOT.SPIN);
  }
  if (o.bob !== undefined) {
    flags |= FLAG.BOB;
    d.set(o.bob?.amplitude ?? [0, 0, 0], SLOT.BOB);
    d[SLOT.BOB + 3] = o.bob?.speed ?? 0;
    d[SLOT.BOB + 4] = o.bob?.phase ?? 0;
  }
  if (o.follow !== undefined) {
    flags |= FLAG.FOLLOW;
    d[SLOT.FOLLOW] = o.follow?.target ?? -1;
    d[SLOT.FOLLOW + 1] = o.follow?.speed ?? 0;
  }
  if (o.lifetime !== undefined) {
    flags |= FLAG.LIFETIME;
    d[SLOT.LIFETIME] = o.lifetime ?? 0;
  }
  if (o.parent !== undefined) {
    flags |= FLAG.PARENT;
    d[SLOT.PARENT] = o.parent ?? -1;
  }
  if (o.physics !== undefined) {
    flags |= FLAG.PHYSICS;
    if (o.physics === null) d[SLOT.PHYSICS] = 0;
    else encodePhysics(d, typeof o.physics === "string" ? { type: o.physics } : o.physics);
  }
  if (o.impact !== undefined) {
    flags |= FLAG.IMPACT;
    const i = SLOT.IMPACT;
    d[i] = o.impact ? 1 : 0;
    d[i + 1] = o.impact?.sound ?? -1;
    d[i + 2] = o.impact?.minSpeed ?? 1;
    d[i + 3] = o.impact?.maxSpeed ?? 10;
    d[i + 4] = o.impact?.volume ?? 1;
    d[i + 5] = o.impact?.haptic ?? 0;
  }
  d[SLOT.FLAGS] = flags;
}
