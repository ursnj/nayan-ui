// Everything Car Racing draws: the track (where a distance along the road and an offset across it are
// in the world), the cars, the road with its roadside and horizon, and fire.
import {
  merge,
  tube,
  type Font,
  type Camera,
  type Color,
  type Entity,
  type Model,
  type Quat,
  type Texture,
  type Vec3,
  type World,
  block,
} from "@nayan-ui/engine";

type GeometryPart = Parameters<typeof merge>[0][number];
import { createGameMesh as createShape, cacheGameAsset } from "./cache";

import { CAR_LAMPS } from "./meshes";
import {
  BEHIND,
  LAMP,
  LAMP_LIT,
  LANE_W,
  LINE,
  RAIL,
  ROAD_HALF,
  RS,
  SEG_LEN,
  SEGMENTS,
  type Assets,
} from "./config";

export const rand = (min: number, max: number) => min + Math.random() * (max - min);
export const pick = <T>(items: readonly T[]) => items[Math.floor(Math.random() * items.length)]!;
export const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));

// ── Track ─────────────────────────────────────────────────────────────

/** A straight start, then sweeping bends and rolling hills. */
const fadeIn = (s: number) => Math.min(1, Math.max(0, (s - 60) / 200));
const curvature = (s: number) =>
  (0.0052 * Math.sin(s / 95) + 0.0034 * Math.sin(s / 41 + 1.3)) * fadeIn(s);
const elevation = (s: number) => (7 * Math.sin(s / 150) + 2.5 * Math.sin(s / 57 + 0.7)) * fadeIn(s);

export type Sample = { x: number; y: number; z: number; heading: number; pitch: number };
export const newSample = (): Sample => ({ x: 0, y: 0, z: 0, heading: 0, pitch: 0 });

/** The centre line, integrated a metre at a time as the player drives. */
export class Track {
  private xs = [0];
  private zs = [0];
  private hs = [0];

  private ensure(s: number) {
    for (let i = this.xs.length; i <= s + 1; i++) {
      const h = this.hs[i - 1]! + curvature(i);
      this.hs.push(h);
      this.xs.push(this.xs[i - 1]! + Math.sin(h));
      this.zs.push(this.zs[i - 1]! - Math.cos(h));
    }
  }

  sample(s: number, out: Sample): Sample {
    if (s < 0) {
      // Behind the start line the road runs straight back (the start-screen camera sees it).
      out.x = 0;
      out.y = 0;
      out.z = -s;
      out.heading = 0;
      out.pitch = 0;
      return out;
    }
    const t = s;
    this.ensure(t);
    const i = Math.floor(t);
    const f = t - i;
    out.x = this.xs[i]! + (this.xs[i + 1]! - this.xs[i]!) * f;
    out.z = this.zs[i]! + (this.zs[i + 1]! - this.zs[i]!) * f;
    out.heading = this.hs[i]! + (this.hs[i + 1]! - this.hs[i]!) * f;
    out.y = elevation(t);
    out.pitch = Math.atan(elevation(t + 0.5) - elevation(t - 0.5));
    return out;
  }
}

// Heading 0 drives toward -z with +x on the right; a positive heading bends right.
export const forwardOf = (h: number): Vec3 => [Math.sin(h), 0, -Math.cos(h)];
export const rightOf = (h: number): Vec3 => [Math.cos(h), 0, Math.sin(h)];

/** The world point at a track sample, `d` to the right and `h` above the road. */
export function placeAt(t: Sample, d: number, h: number, out: [number, number, number]) {
  out[0] = t.x + Math.cos(t.heading) * d;
  out[1] = t.y + h;
  out[2] = t.z + Math.sin(t.heading) * d;
  return out;
}

/** Facing along `heading` (turned `yaw` further right), nose up by `pitch`, rolled left by `roll`. */
export function orient(
  heading: number,
  pitch: number,
  yaw = 0,
  roll = 0,
  out: [number, number, number, number] = [0, 0, 0, 1],
): Quat {
  const a = -(heading + yaw) / 2;
  const sy = Math.sin(a),
    cy = Math.cos(a),
    sx = Math.sin(pitch / 2),
    cx = Math.cos(pitch / 2);
  const sz = Math.sin(roll / 2),
    cz = Math.cos(roll / 2);
  const x = cy * sx,
    y = sy * cx,
    z = -sy * sx,
    w = cy * cx;
  out[0] = x * cz + y * sz;
  out[1] = -x * sz + y * cz;
  out[2] = w * sz + z * cz;
  out[3] = w * cz - z * sz;
  return out;
}

// ── Cars ──────────────────────────────────────────────────────────────

/** A car: an invisible root at its middle (the collider's centre once wrecked) with body, glass and trim attached. */
export function spawnCar(world: World, a: Assets, paint: Color, position: Vec3, night: boolean) {
  const model = a.car;
  const root = world.spawn({ mesh: "none", position });
  const lift = -model.size[1] / 2;
  const offset: Vec3 = [0, lift, 0];
  const body = world.spawn({ mesh: model.body, parent: root, position: offset, color: paint });
  const glass = world.spawn({ mesh: model.glass, parent: root, position: offset });
  const trim = world.spawn({ mesh: model.trim, parent: root, position: offset });
  const car = { root, body, glass, trim, lights: [] as Entity[] };
  setCarNight(world, car, night, model.size[1]);
  return car;
}

/** Toggle lamp meshes in place so switching theme preserves every car's pose and physics. */
export function setCarNight(
  world: World,
  car: { root: Entity; lights: Entity[] },
  night: boolean,
  height: number,
) {
  for (const entity of car.lights) world.despawn(entity);
  car.lights.length = 0;
  if (!night || !world.has(car.root)) return;
  const lift = -height / 2;
  for (const [x, y, z] of CAR_LAMPS.headlights)
    car.lights.push(
      world.spawn({
        mesh: "cube",
        parent: car.root,
        position: [x, lift + y, z],
        scale: CAR_LAMPS.headlightSize,
        color: [2, 1.95, 1.7],
        pickable: false,
      }),
    );
  const [x, y, z] = CAR_LAMPS.tail;
  car.lights.push(
    world.spawn({
      mesh: "cube",
      parent: car.root,
      position: [x, lift + y, z],
      scale: CAR_LAMPS.tailSize,
      color: [2, 0.16, 0.1],
      pickable: false,
    }),
  );
}

// ── Road and scenery ──────────────────────────────────────────────────

// Segments that leapfrog ahead, the roadside for each zone, and the mountains on the horizon.

/** A stretch of road; `props` is its scenery, rebuilt for the zone it lands in each time it jumps ahead. */
export type Segment = {
  root: Entity;
  s: number;
  props: Entity[];
  lights: { entity: Entity; day: Color; night: Color }[];
};
/** What the scenery needs from the game. */
export type SceneryContext = { world: World; assets: Assets; night: boolean; track: Track };

const segmentSample = newSample();

/**
 * Road segments: a root carrying the ground collider, with asphalt, curbs, markings, rails and
 * scenery attached. Segments that fall behind jump ahead with everything on them.
 */
export function buildRoad(world: World, a: Assets): Segment[] {
  const segments: Segment[] = [];
  for (let i = 0; i < SEGMENTS; i++) {
    const root = world.spawn({
      mesh: "none",
      physics: { type: "fixed", size: [90, 0.4, SEG_LEN + 0.4], layer: 4, mask: 0, friction: 0.7 },
    });
    const add = (
      mesh: "cube" | "cylinder" | Model,
      position: Vec3,
      scale: Vec3 | number,
      color: Color,
      texture?: Texture,
    ) => world.spawn({ mesh, parent: root, position, scale, color, texture, pickable: false });
    const lift = (i % 2) * 0.004; // overlapping neighbours never z-fight
    const len = SEG_LEN + 0.35;
    add("cube", [0, RS - 0.05 + lift, 0], [ROAD_HALF * 2 + 0.6, 0.1, len], [1, 1, 1], a.asphalt);
    for (const side of [-1, 1]) {
      add(
        "cube",
        [side * (ROAD_HALF + 31), RS - 0.09 + lift, 0],
        [62, 0.1, len],
        i % 2 ? [1, 1, 1] : [0.94, 0.97, 0.92],
        a.grass,
      );
      for (const z of [-SEG_LEN / 4, SEG_LEN / 4]) {
        const red = (i * 2 + (z > 0 ? 1 : 0)) % 2 === 0;
        add(
          "cube",
          [side * (ROAD_HALF + 0.2), RS + 0.01 + lift, z],
          [0.5, 0.08, SEG_LEN / 2],
          red ? [0.85, 0.12, 0.1] : [0.95, 0.95, 0.95],
        );
      }
      add("cube", [side * (ROAD_HALF - 0.12), RS + 0.004 + lift, 0], [0.14, 0.02, len], LINE);
      add("cube", [side * (LANE_W / 2), RS + 0.004 + lift, 0], [0.14, 0.02, 2.6], LINE);
      add("cube", [side * (ROAD_HALF + 1.1), RS + 0.55, 0], [0.1, 0.26, len], RAIL);
      add("cube", [side * (ROAD_HALF + 1.15), RS + 0.3, 0], [0.12, 0.6, 0.12], [0.45, 0.46, 0.5]);
    }
    segments.push({ root, s: (i - BEHIND) * SEG_LEN, props: [], lights: [] });
  }
  return segments;
}

/** Mountains and rolling hills all around (and, at night, a moon and stars), on a root that rides along with the player so they never get closer. */
export function buildHorizon(world: World, night: boolean): Entity {
  const horizon = world.spawn({ mesh: "none" });
  for (let i = 0; i < 26; i++) {
    const angle = (i / 26) * Math.PI * 2 + rand(-0.08, 0.08);
    const r = rand(150, 210);
    const size = rand(40, 75);
    world.spawn({
      mesh: "sphere",
      parent: horizon,
      position: [Math.sin(angle) * r, -size * 0.32, -Math.cos(angle) * r],
      scale: [size * 1.6, size * 0.9, size * 1.6],
      color: [0.3 + rand(0, 0.06), 0.52 + rand(0, 0.08), 0.24],
      pickable: false,
    });
  }
  for (let i = 0; i < 18; i++) {
    const angle = (i / 18) * Math.PI * 2 + rand(-0.1, 0.1);
    const size = rand(45, 80);
    world.spawn({
      mesh: "cone",
      parent: horizon,
      position: [Math.sin(angle) * 330, size * 0.35 - 10, -Math.cos(angle) * 330],
      scale: [size * 1.7, size, size * 1.7],
      color: [0.45 + rand(0, 0.08), 0.55 + rand(0, 0.06), 0.68],
      pickable: false,
    });
  }

  setHorizonNight(world, horizon, night);
  return horizon;
}

const nightSkies = new WeakMap<World, Map<Entity, Entity[]>>();
export function setHorizonNight(world: World, horizon: Entity, night: boolean) {
  let skies = nightSkies.get(world);
  if (!skies) {
    skies = new Map();
    nightSkies.set(world, skies);
  }
  const lights = skies.get(horizon) ?? [];
  for (const entity of lights) world.despawn(entity);
  lights.length = 0;
  if (night) {
    // A moon and stars, riding along with the horizon.
    lights.push(
      world.spawn({
        mesh: "sphere",
        parent: horizon,
        position: [-120, 120, -230],
        scale: 26,
        color: [2, 1.95, 1.8],
        pickable: false,
      }),
    );
    for (let i = 0; i < 70; i++) {
      const angle = rand(0, Math.PI * 2);
      lights.push(
        world.spawn({
          mesh: "sphere",
          parent: horizon,
          position: [Math.sin(angle) * 280, rand(50, 190), -Math.cos(angle) * 280],
          scale: rand(0.6, 1.4),
          color: [2, 2, 2.2],
          pickable: false,
        }),
      );
    }
  }
  skies.set(horizon, lights);
}

/** Puts a segment where its distance along the track is. */
export function placeSegment(g: SceneryContext, seg: Segment) {
  const t = g.track.sample(seg.s, segmentSample);
  g.world.set(seg.root, { position: [t.x, t.y - RS, t.z], rotation: orient(t.heading, t.pitch) });
}

type Zone = "city" | "suburb" | "country";
/** Every 600 m the roadside changes. */
const zoneAt = (s: number): Zone =>
  (["city", "suburb", "country"] as const)[Math.floor(Math.max(0, s + 300) / 600) % 3]!;

const HOUSE_WALLS: Color[] = [
  [0.95, 0.9, 0.78],
  [0.86, 0.9, 0.95],
  [0.95, 0.82, 0.75],
  [0.9, 0.93, 0.82],
];
const ROOFS: Color[] = [
  [0.62, 0.2, 0.15],
  [0.35, 0.25, 0.2],
  [0.3, 0.32, 0.38],
];

/** Fills a segment's roadside for its zone. Positions are in the segment's frame: x across, z along, y up. */
export function spawnProps(g: SceneryContext, seg: Segment) {
  const { world, assets: a } = g;
  const add = (options: Parameters<World["spawn"]>[0] & {}) => {
    const entity = world.spawn({ parent: seg.root, pickable: false, ...options });
    seg.props.push(entity);
    return entity;
  };
  const addLight = (options: Parameters<World["spawn"]>[0], day: Color, night: Color) => {
    const entity = add({ ...options, color: g.night ? night : day });
    seg.lights.push({ entity, day, night });
  };
  const index = Math.round(seg.s / SEG_LEN);
  const zone = zoneAt(seg.s);
  const z = () => rand(-SEG_LEN / 2, SEG_LEN / 2);

  for (const side of [-1, 1]) {
    // Bushes along the rail, everywhere.
    if (Math.random() < 0.55) {
      add({
        mesh: "sphere",
        position: [side * (ROAD_HALF + rand(2.2, 3.4)), RS + 0.25, z()],
        scale: [rand(1, 1.8), rand(0.7, 1.1), rand(1, 1.8)],
        color: [0.18 + rand(0, 0.08), 0.4 + rand(0, 0.12), 0.14],
      });
    }
    if (zone === "city") {
      add({
        mesh: "cube",
        position: [side * (ROAD_HALF + 3.2), RS + 0.05, 0],
        scale: [2.6, 0.12, SEG_LEN + 0.35],
        color: [0.68, 0.68, 0.66],
      }); // sidewalk
      if ((index + (side > 0 ? 1 : 0)) % 2 === 0) {
        const h = rand(14, 42);
        const tone = rand(0.72, 1);
        add({
          mesh: "cube",
          texture: a.facade,
          position: [side * (ROAD_HALF + rand(10, 15)), RS + h / 2, rand(-1, 1)],
          scale: [rand(8, 12), h, rand(8, 11)],
          color: [tone, tone * rand(0.92, 1), tone * rand(0.86, 1)],
        });
        if (Math.random() < 0.5) {
          const h2 = rand(20, 55);
          add({
            mesh: "cube",
            texture: a.facade,
            position: [side * (ROAD_HALF + rand(24, 32)), RS + h2 / 2, rand(-2, 2)],
            scale: [rand(9, 14), h2, rand(9, 12)],
            color: [0.8, 0.82, 0.88],
          });
        }
      }
    } else if (zone === "suburb") {
      if ((index + (side > 0 ? 1 : 0)) % 3 === 0) {
        // A house: walls, a door, two windows, a gable roof (a cube turned 45° under a flattened group), a fence.
        const x = side * (ROAD_HALF + rand(10, 14));
        const wall = pick(HOUSE_WALLS);
        const face = x - side * 2.52; // the wall facing the road
        add({ mesh: "cube", position: [x, RS + 1.6, 0], scale: [5, 3.2, 5.6], color: wall });
        add({
          mesh: "cube",
          position: [face, RS + 0.95, 0.9],
          scale: [0.06, 1.9, 0.9],
          color: [0.35, 0.22, 0.14],
        });
        for (const wz of [-1.4, 2.2])
          add({
            mesh: "cube",
            position: [face, RS + 2, wz],
            scale: [0.06, 0.8, 0.9],
            color: [0.55, 0.7, 0.85],
          });
        const roof = world.spawn({
          mesh: "none",
          parent: seg.root,
          pickable: false,
          position: [x, RS + 3.2, 0],
          scale: [1, 0.55, 1],
        });
        seg.props.push(roof);
        seg.props.push(
          world.spawn({
            mesh: "cube",
            parent: roof,
            pickable: false,
            rotation: [0, 0, Math.sin(Math.PI / 8), Math.cos(Math.PI / 8)],
            scale: [4, 4, 6.2],
            color: pick(ROOFS),
          }),
        );
        add({
          mesh: "cube",
          position: [side * (ROAD_HALF + 6.5), RS + 0.35, 0],
          scale: [0.08, 0.6, SEG_LEN],
          color: [0.95, 0.95, 0.95],
        }); // fence
      } else {
        const x = side * (ROAD_HALF + rand(7, 16));
        const zz = z();
        const h = rand(1.6, 2.6);
        add({
          mesh: "cylinder",
          position: [x, RS + h / 2, zz],
          scale: [0.35, h, 0.35],
          color: [0.42, 0.29, 0.17],
        });
        add({
          mesh: "sphere",
          position: [x, RS + h + 1.1, zz],
          scale: rand(2.6, 3.6),
          color: [0.24 + rand(0, 0.08), 0.5 + rand(0, 0.12), 0.2],
        });
      }
    } else {
      // Countryside: a pine forest, rocks, a wooden fence and the odd power pole.
      for (let t = 0; t < 3; t++)
        add({
          mesh: a.tree,
          position: [side * (ROAD_HALF + rand(5, 28)), RS, z()],
          scale: rand(2.4, 4.2),
          color: [1, 1, 1],
        });
      if (Math.random() < 0.35)
        add({
          mesh: "sphere",
          position: [side * (ROAD_HALF + rand(4, 12)), RS, z()],
          scale: [rand(0.8, 1.8), rand(0.5, 0.9), rand(0.8, 1.6)],
          color: [0.52, 0.5, 0.48],
        });
      for (const y of [0.45, 0.85])
        add({
          mesh: "cube",
          position: [side * (ROAD_HALF + 4.2), RS + y, 0],
          scale: [0.07, 0.1, SEG_LEN + 0.3],
          color: [0.48, 0.34, 0.2],
        });
      add({
        mesh: "cube",
        position: [side * (ROAD_HALF + 4.2), RS + 0.5, 0],
        scale: [0.12, 1, 0.12],
        color: [0.4, 0.28, 0.16],
      });
      if (index % 6 === (side > 0 ? 0 : 3)) {
        add({
          mesh: "cylinder",
          position: [side * (ROAD_HALF + 7), RS + 4.5, 0],
          scale: [0.22, 9, 0.22],
          color: [0.38, 0.27, 0.18],
        });
        add({
          mesh: "cube",
          position: [side * (ROAD_HALF + 7), RS + 8.4, 0],
          scale: [2.2, 0.14, 0.14],
          color: [0.38, 0.27, 0.18],
        });
      }
    }
  }

  // Street lights (closer together in the city) and, now and then, a billboard angled toward traffic.
  const side = index % 2 ? 1 : -1;
  if (index % (zone === "city" ? 2 : 4) === 0) {
    add({
      mesh: "cylinder",
      position: [side * (ROAD_HALF + 1.7), RS + 3.2, 0],
      scale: [0.16, 6.4, 0.16],
      color: [0.35, 0.36, 0.4],
    });
    add({
      mesh: "cube",
      position: [side * (ROAD_HALF + 0.8), RS + 6.35, 0],
      scale: [1.9, 0.1, 0.12],
      color: [0.35, 0.36, 0.4],
    });
    addLight(
      {
        mesh: "cube",
        position: [side * (ROAD_HALF - 0.05), RS + 6.25, 0],
        scale: [0.7, 0.1, 0.32],
      },
      LAMP,
      LAMP_LIT,
    );
  }
  if (index % 11 === 5) {
    const x = -side * (ROAD_HALF + 6);
    for (const px of [-2.2, 2.2])
      add({
        mesh: "cylinder",
        position: [x + px, RS + 2.5, 0],
        scale: [0.25, 5, 0.25],
        color: [0.3, 0.3, 0.34],
      });
    addLight(
      {
        mesh: "cube",
        texture: pick(a.ads),
        position: [x, RS + 6, 0],
        scale: [7.5, 3.6, 0.25],
        rotation: [0, Math.sin((side * 0.35) / 2), 0, Math.cos((side * 0.35) / 2)],
      },
      [1, 1, 1],
      [1.7, 1.7, 1.7],
    ); // lit at night
  }
}

/** Segments left behind jump to the front, with fresh scenery. */
export function recycleRoad(g: SceneryContext, segments: Segment[], s: number) {
  for (const seg of segments) {
    if (seg.s >= s - SEG_LEN * BEHIND) continue;
    seg.s += SEGMENTS * SEG_LEN;
    placeSegment(g, seg);
    for (const e of seg.props) g.world.despawn(e);
    seg.props.length = 0;
    seg.lights.length = 0;
    spawnProps(g, seg);
  }
}

// ── Fire ──────────────────────────────────────────────────────────────

// Flames are "flame" particles: soft sprites facing the camera that add their light to what's behind
// them, so overlapping flames build up to a hot white core and stay bright over smoke and through fog.
// Each one cools over its life (`endColor`: yellow, orange, then a deep red that fades) while shrinking
// (`endSize`), the way a tongue of fire tapers as it rises. Smoke is "puff" particles, painted over the
// scene: dark and dense at first, swelling and thinning as it climbs. Channels above 1 glow (self-lit).

const FLASH: Color = [2, 1.95, 1.7, 0.9];
const FIREBALL: Color[] = [
  [2, 1.7, 0.8, 0.6],
  [2, 1.45, 0.5, 0.6],
  [2, 1.2, 0.35, 0.6],
];
const FLAME_CORE: Color[] = [
  [2, 1.85, 1.1, 0.5],
  [2, 1.7, 0.75, 0.5],
];
const FLAME: Color[] = [
  [2, 1.6, 0.55, 0.42],
  [2, 1.35, 0.38, 0.42],
  [2, 1.1, 0.25, 0.42],
];
const COOLED: Color = [2, 0.35, 0.08, 0]; // a deep red, fading out
const SMOKE: Color[] = [
  [0.1, 0.095, 0.09, 0.5],
  [0.14, 0.13, 0.12, 0.45],
  [0.18, 0.17, 0.16, 0.4],
];
const SMOKE_END: Color = [0.45, 0.44, 0.43, 0];
const EMBER: Color[] = [
  [2, 1.4, 0.5],
  [2, 1, 0.25],
];
const DEBRIS: Color[] = [
  [0.06, 0.06, 0.07],
  [0.18, 0.18, 0.2],
];

/** A wreck on fire: flames and smoke come off it until `until` (game time). */
export type Fire = { root: Entity; until: number; flame: number; smoke: number; ember: number };
export const burning = (root: Entity, until: number): Fire => ({
  root,
  until,
  flame: 0,
  smoke: 0,
  ember: 0,
});

/**
 * A crash: a white-hot flash, a fireball that swells and cools to red, sparks and car bits thrown out,
 * and smoke that billows up and thins.
 */
export function explode(w: World, at: Vec3) {
  const up: Vec3 = [0, 1, 0];
  w.burst({
    position: at,
    mesh: "flame",
    count: 3,
    size: 3.2,
    speed: 0.5,
    lifetime: 0.22,
    gravity: 0,
    color: FLASH,
    endSize: 1.8,
    endColor: [2, 1.4, 0.4, 0],
  });
  w.burst({
    position: at,
    mesh: "flame",
    count: 30,
    size: 1.1,
    speed: 4.5,
    lifetime: 0.85,
    gravity: 3,
    color: FIREBALL,
    endSize: 2.2,
    endColor: COOLED,
  });
  w.burst({
    position: [at[0], at[1] + 0.4, at[2]],
    mesh: "flame",
    count: 14,
    size: 0.9,
    speed: 5.5,
    lifetime: 0.9,
    gravity: 5,
    direction: up,
    spread: 0.55,
    color: FLAME,
    endSize: 1.4,
    endColor: COOLED,
  });
  w.burst({
    position: at,
    mesh: "flame",
    count: 30,
    size: 0.16,
    speed: 14,
    lifetime: 0.7,
    gravity: -9.81,
    color: EMBER,
    endSize: 0.3,
    endColor: [2, 0.3, 0.05, 0],
  }); // sparks fall
  w.burst({
    position: at,
    count: 10,
    size: 0.14,
    speed: 8,
    lifetime: 1.4,
    gravity: -9.81,
    direction: up,
    spread: 1.2,
    color: DEBRIS,
  }); // bits of car
  w.burst({
    position: [at[0], at[1] + 1.4, at[2]],
    mesh: "puff",
    count: 6,
    size: 1,
    speed: 2,
    lifetime: 2,
    gravity: 2,
    direction: up,
    spread: 0.6,
    color: SMOKE,
    endSize: 3,
    endColor: SMOKE_END,
  });
}

/**
 * Burning wrecks, at a steady rate whatever the frame rate: flame tongues licking up from across the
 * car, a hot core low down, embers drifting up, and smoke rolling off the top. They're launched with
 * the wreck's own velocity (plus a rise), so they ride along with it and stream off behind. A wreck that
 * has dropped back to the camera stops emitting, so fire never fills the screen from up close.
 */
const firePosition: [number, number, number] = [0, 0, 0];
const wreckVelocity: [number, number, number] = [0, 0, 0];
const FLAMES_PER_SECOND = 120;
const SMOKE_PER_SECOND = 10;
const EMBERS_PER_SECOND = 14;
const FIRE_MIN_DISTANCE = 5; // metres in front of the camera
type Emit = {
  size: number;
  lifetime: number;
  color: Color[];
  endSize: number;
  endColor: Color;
  spread: number;
  mesh: "flame" | "puff";
};
export function burn(world: World, camera: Camera, fires: Fire[], time: number, dt: number) {
  const { eye, target } = camera;
  const fx = target[0] - eye[0];
  const fy = target[1] - eye[1];
  const fz = target[2] - eye[2];
  const fl = Math.hypot(fx, fy, fz) || 1;
  for (let i = fires.length - 1; i >= 0; i--) {
    const fire = fires[i]!;
    const p = world.worldPosition(fire.root, firePosition);
    if (!p || time > fire.until) {
      fires.splice(i, 1);
      continue;
    }
    const ahead = ((p[0] - eye[0]) * fx + (p[1] - eye[1]) * fy + (p[2] - eye[2]) * fz) / fl;
    if (ahead < FIRE_MIN_DISTANCE) continue;
    const v = world.velocity(fire.root, wreckVelocity) ?? [0, 0, 0];
    const emit = (rise: number, y: number, spreadX: number, spreadZ: number, o: Emit) => {
      const dir: Vec3 = [v[0], v[1] + rise, v[2]];
      const speed = Math.hypot(dir[0], dir[1], dir[2]);
      world.burst({
        position: [p[0] + rand(-spreadX, spreadX), p[1] + y, p[2] + rand(-spreadZ, spreadZ)],
        mesh: o.mesh,
        count: 1,
        size: o.size,
        speed,
        lifetime: o.lifetime,
        gravity: rise * 1.5, // keeps climbing, as hot gas does
        direction: [dir[0] / speed, dir[1] / speed, dir[2] / speed],
        spread: o.spread,
        color: o.color,
        endSize: o.endSize,
        endColor: o.endColor,
      });
    };
    fire.flame += dt * FLAMES_PER_SECOND;
    while (fire.flame >= 1) {
      fire.flame -= 1;
      // Tongues: rising fast, so they stretch into columns that taper and redden toward the tips.
      emit(4.2, 0.8, 0.75, 1.5, {
        mesh: "flame",
        size: rand(0.8, 1.1),
        lifetime: rand(0.45, 0.65),
        color: FLAME,
        endSize: 0.25,
        endColor: COOLED,
        spread: 0.2,
      });
      // Every other one, the white-yellow heart of the fire, low on the car.
      if (Math.random() < 0.5)
        emit(1.5, 0.7, 0.55, 1.2, {
          mesh: "flame",
          size: rand(0.7, 0.95),
          lifetime: rand(0.18, 0.28),
          color: FLAME_CORE,
          endSize: 0.7,
          endColor: [2, 1.4, 0.4, 0],
          spread: 0.2,
        });
    }
    fire.smoke += dt * SMOKE_PER_SECOND;
    while (fire.smoke >= 1) {
      fire.smoke -= 1;
      emit(2.6, 2, 0.5, 1, {
        mesh: "puff",
        size: rand(1, 1.3),
        lifetime: rand(1.6, 2.1),
        color: SMOKE,
        endSize: 3,
        endColor: SMOKE_END,
        spread: 0.35,
      });
    }
    fire.ember += dt * EMBERS_PER_SECOND;
    while (fire.ember >= 1) {
      fire.ember -= 1;
      emit(4.5, 1, 0.6, 1.3, {
        mesh: "flame",
        size: 0.14,
        lifetime: rand(0.8, 1.3),
        color: EMBER,
        endSize: 0.3,
        endColor: [2, 0.3, 0.05, 0],
        spread: 0.6,
      });
    }
  }
}

// ── Start and finish ──────────────────────────────────────────────────

/** Gantry posts stand outside the rails; the banner and its crossbar span the road between them. */
const GANTRY_X = ROAD_HALF + 1.7;
const GANTRY_H = 6.4;
const BANNER_Y = 5.5;
const markerMeshes = new Map<string, Model>();
const markerMesh = (key: string, build: () => Model) => {
  let m = markerMeshes.get(key);
  if (!m) markerMeshes.set(key, (m = cacheGameAsset("car-racing/CarRacingScene:" + key, build)));
  return m;
};

/** Twin posts, a crossbar and a banner across the road, over the finish. */
function gantryParts(frame: Color, banner: Color): GeometryPart[] {
  const parts: GeometryPart[] = [];
  for (const side of [-1, 1]) {
    parts.push({
      geometry: block(0.55, GANTRY_H, 0.55, 6),
      position: [side * GANTRY_X, GANTRY_H / 2, 0],
      color: frame,
    });
    parts.push({
      geometry: block(0.9, 0.3, 0.9, 6),
      position: [side * GANTRY_X, 0.15, 0],
      color: frame,
    }); // footings
  }
  parts.push(
    {
      geometry: block(GANTRY_X * 2 + 0.9, 0.45, 0.6),
      position: [0, GANTRY_H + 0.1, 0],
      color: frame,
    },
    {
      geometry: block(GANTRY_X * 2 - 1.4, 1.25, 0.12),
      position: [0, BANNER_Y, 0.08],
      color: banner,
    },
    {
      geometry: block(GANTRY_X * 2 - 2.2, 0.08, 0.04),
      position: [0, BANNER_Y - 0.5, 0.15],
      color: [1, 0.9, 0.5],
    },
    {
      geometry: block(GANTRY_X * 2 - 2.2, 0.08, 0.04),
      position: [0, BANNER_Y + 0.5, 0.15],
      color: [1, 0.9, 0.5],
    },
  );
  return parts;
}

/** The finish: a checkered band across the road under a golden gantry, a red banner and pennants. */
const finishMesh = () =>
  markerMesh("finish", () => {
    const squares: GeometryPart[] = [];
    const size = 0.7;
    const across = Math.ceil((ROAD_HALF * 2 + 0.6) / size);
    for (let i = 0; i < across; i++)
      for (let j = 0; j < 2; j++)
        squares.push({
          geometry: block(size, 0.03, size, 8),
          position: [(i - (across - 1) / 2) * size, 0.016, (j - 0.5) * size],
          color: (i + j) % 2 ? [0.96, 0.96, 0.94] : [0.08, 0.08, 0.1],
        });
    const pennants: GeometryPart[] = [-4, -2, 0, 2, 4].map((x, i) => ({
      geometry: tube(
        [
          [x, GANTRY_H - 0.15, 0.32],
          [x + 0.06, GANTRY_H - 0.8, 0.33],
        ],
        {
          radius: (t) => 0.2 * (1 - t),
          shape: (a) => 0.2 + 0.8 * Math.abs(Math.cos(a * Math.PI * 2)),
          sides: 6,
        },
      ),
      color: (
        [
          [0.2, 0.5, 0.95],
          [1, 0.8, 0.15],
          [0.2, 0.75, 0.3],
        ] as Color[]
      )[i % 3]!,
    }));
    return createShape(
      merge([...squares, ...gantryParts([0.95, 0.72, 0.2], [0.85, 0.12, 0.14]), ...pennants]),
      { center: false, shine: 0.5 },
    );
  });

/** The start line: a white band across the road. */
const startMesh = () =>
  markerMesh("start", () =>
    createShape(
      merge([
        {
          geometry: block(ROAD_HALF * 2 + 0.4, 0.03, 0.5, 8),
          position: [0, 0.016, 0],
          color: [0.96, 0.96, 0.92],
        },
      ]),
      {
        center: false,
        shine: 0.3,
      },
    ),
  );

const markerSample = newSample();
const markerAt: [number, number, number] = [0, 0, 0];

/**
 * The race's start line (at `startS`) and finish gate (at `finishS`), placed on the road and facing the
 * driver, with FINISH written on the gate's banner once the HUD's font is in.
 */
export function spawnRaceMarkers(
  world: World,
  track: Track,
  startS: number,
  finishS: number,
  font: Font,
) {
  const place = (mesh: Model, s: number, label?: string) => {
    const t = track.sample(s, markerSample);
    placeAt(t, 0, 0, markerAt);
    const root = world.spawn({
      mesh,
      position: [markerAt[0], markerAt[1], markerAt[2]],
      rotation: orient(t.heading, t.pitch),
      pickable: false,
    });
    if (!label) return root;
    world.spawn({
      text: label,
      font,
      parent: root,
      position: [0, BANNER_Y - 0.36, 0.16],
      scale: 0.78,
      color: [1, 1, 1],
      letterSpacing: 0.12,
      pickable: false,
    });
    return root;
  };
  return { start: place(startMesh(), startS), finish: place(finishMesh(), finishS, "FINISH") };
}

/** Reusable assets; the game loader advances one builder per frame. */
export function* warmAssets(): Iterable<() => unknown> {
  yield finishMesh;
  yield startMesh;
}
