// Ready-made particle effects and the cleared-piece pop, built from `world.burst` and `world.animate`.
//
// A single burst gives every particle 50..100% of one top speed, so on its own it flies out as a
// hollow shell of same-sized bits that pop out of existence. These effects mix a few bursts instead:
// slow big pieces that fill the middle and fast small ones at the edge, an additive glow that flashes
// at the source (visible on dark scenes, harmless on light ones), and soft puffs that linger and fade.
// Every particle takes a world slot, out of the capacity shared with the game's own entities, so the
// counts stay close to what was passed in. Effects run entirely in the Rust core after one call each.
import type { Vec3 } from '../types';
import { type ColorInput, resolveColor, resolveColors } from './color';
import type { BurstOptions, Color, Entity } from './types';
import type { World } from './World';

/** Shared options of the layered effects (confetti, sparkle, shatter, splash, sparks, explosion). */
export type EffectOptions = {
  position: Vec3;
  /** One color (CSS string or tuple), or several to pick from at random. */
  colors: ColorInput | readonly ColorInput[];
  /** Typical particle size. */
  size: number;
  /** Top speed. */
  speed: number;
  /** About how many particles (a few extra go to the flash and puffs). */
  count: number;
  /** Seconds. */
  lifetime: number;
  /** Vertical acceleration (negative falls). Default 0. */
  gravity?: number;
  /** Main direction. Default up. */
  direction?: Vec3;
  /** Half-angle of the cone around `direction`. Default π (every direction). */
  spread?: number;
  /** A brief glow at the source. Default true. */
  flash?: boolean;
};

/** A soft cloud of puffs that swell and fade: landing dust, kicked-up sand, sawdust, steam, muzzle smoke. */
export type DustOptions = {
  position: Vec3;
  /** Start color (alpha is how thick it looks), or several to pick from. */
  color: ColorInput | readonly ColorInput[];
  /** Puff size at the start. */
  size: number;
  /** Top speed. */
  speed: number;
  count: number;
  /** Seconds. */
  lifetime: number;
  /** Default up. */
  direction?: Vec3;
  /** Half-angle around `direction`. Default π. */
  spread?: number;
  /** Default 0 (dust hangs; positive rises like smoke). */
  gravity?: number;
  /** How much each puff grows by the end. Default 2. */
  endSize?: number;
  /** Color at the end. Default: a single `color` faded to transparent; several colors keep theirs. */
  endColor?: ColorInput;
  /** Default "puff" (blended); "flame" adds light instead. */
  mesh?: BurstOptions['mesh'];
};

/** One glow that swells and fades at a point: a hit, a strike, a muzzle flash. */
export type FlashOptions = {
  position: Vec3;
  /** Use channels above 1 to glow (see `effects.hot`). */
  color: ColorInput;
  size: number;
  /** Seconds. Default 0.22. */
  lifetime?: number;
  /** How much it grows by the end. Default 2.2. */
  endSize?: number;
  /** Default: `color` faded to transparent. */
  endColor?: ColorInput;
  /** Default "flame" (adds light); "sphere" or "puff" for a solid or soft flash. */
  mesh?: BurstOptions['mesh'];
  /** Glows drawn at once (slightly scattered when `speed` > 0). Default 1. */
  count?: number;
  /** Default 0. */
  speed?: number;
};

/** The cleared-piece pop: swell, flash white, settle, shrink away. */
export type PopOptions = {
  /** Its scale at rest (what it has now): one number, or per axis. */
  scale: number | Vec3;
  /** Its color at rest, to return to after the white flash. Omit to flash `flash` only (or nothing). */
  color?: ColorInput;
  /** Parts to flash white as well (a group's visible children, whose rest color is white). */
  flash?: readonly Entity[];
  /** Seconds before it starts. Default 0. */
  delay?: number;
  /** Seconds it takes. Default `effects.POP_TIME`. */
  duration?: number;
};

type Rgba = [number, number, number, number];

const rgba = (input: ColorInput): Rgba => {
  const c = resolveColor(input);
  return [c[0], c[1], c[2], c[3] ?? 1];
};
const list = (colors: ColorInput | readonly ColorInput[]): Rgba[] => resolveColors(colors).map(rgba);
const part = (count: number, share: number) => Math.max(1, Math.round(count * share));
const fade = (input: ColorInput): Rgba => {
  const c = resolveColor(input);
  return [c[0], c[1], c[2], 0];
};

/** The colors' average. */
function mean(colors: Rgba[]): Rgba {
  const sum: Rgba = [0, 0, 0, 0];
  for (const c of colors) for (let i = 0; i < 4; i++) sum[i]! += c[i]!;
  return sum.map((v) => v / colors.length) as Rgba;
}

/** The same hue, self-lit: its brightest channel lifted to `peak` (above 1 glows, through light, shadow and fog). */
function hot(input: ColorInput, peak = 2.2, alpha?: number): Rgba {
  const c = resolveColor(input);
  alpha ??= c[3] ?? 1;
  const k = peak / Math.max(c[0], c[1], c[2], 0.25);
  return [c[0] * k, c[1] * k, c[2] * k, alpha];
}

/** Part way (`t`, 0..1) to white, with `alpha`. */
function pale(input: ColorInput, t: number, alpha?: number): Rgba {
  const c = resolveColor(input);
  alpha ??= c[3] ?? 1;
  return [c[0] + (1 - c[0]) * t, c[1] + (1 - c[1]) * t, c[2] + (1 - c[2]) * t, alpha];
}

function aim(e: Pick<EffectOptions, 'position' | 'direction' | 'spread'>): Pick<BurstOptions, 'position' | 'direction' | 'spread'> {
  return { position: e.position, direction: e.direction ?? [0, 1, 0], spread: e.spread ?? Math.PI };
}

function flash(world: World, o: FlashOptions): number {
  return world.burst({
    position: o.position,
    count: o.count ?? 1,
    mesh: o.mesh ?? 'flame',
    size: o.size,
    speed: o.speed ?? 0,
    lifetime: o.lifetime ?? 0.22,
    gravity: 0,
    color: o.color,
    endSize: o.endSize ?? 2.2,
    endColor: o.endColor ?? fade(o.color)
  });
}

/** A glow that swells and fades at the source, in the effect's own hue. */
function glowFlash(world: World, e: EffectOptions, colors: Rgba[], size: number) {
  flash(world, { position: e.position, color: hot(mean(colors), 2, 0.85), size });
}

function dust(world: World, o: DustOptions): number {
  const colors = resolveColors(o.color);
  return world.burst({
    position: o.position,
    count: o.count,
    mesh: o.mesh ?? 'puff',
    size: o.size,
    speed: o.speed,
    lifetime: o.lifetime,
    gravity: o.gravity ?? 0,
    direction: o.direction,
    spread: o.spread,
    color: colors.length === 1 ? colors[0] : colors,
    endSize: o.endSize ?? 2,
    endColor: o.endColor ?? (colors.length === 1 ? fade(colors[0]!) : undefined)
  });
}

/** Celebration confetti: tumbling paper in two layers, a few glinting sparkles, and a pop of light. */
function confetti(world: World, e: EffectOptions) {
  const colors = list(e.colors);
  const g = (e.gravity ?? 0) * 0.65; // paper drifts down rather than dropping
  const base = { ...aim(e), mesh: 'cube' as const, gravity: g, color: colors, endSize: 0.3 };
  world.burst({ ...base, count: part(e.count, 0.55), size: e.size, speed: e.speed, lifetime: e.lifetime * 1.15 });
  world.burst({ ...base, count: part(e.count, 0.3), size: e.size * 0.7, speed: e.speed * 0.5, lifetime: e.lifetime });
  const glint = colors.slice(0, 4).map((c) => hot(pale(c, 0.5, 1), 2.4));
  world.burst({
    ...aim(e),
    count: part(e.count, 0.15),
    mesh: 'flame',
    size: e.size * 1.1,
    speed: e.speed * 0.8,
    lifetime: e.lifetime * 0.8,
    gravity: g * 0.5,
    color: glint,
    endSize: 0
  });
  if (e.flash !== false) glowFlash(world, e, [[1, 0.95, 0.8, 1]], e.size * 7);
}

/** Glitter for a reward: solid bright beads (seen on any background) with additive glints around them. */
function sparkle(world: World, e: EffectOptions) {
  const colors = list(e.colors);
  const bright = colors.map((c) => hot(c, 1.4));
  const base = { ...aim(e), gravity: e.gravity ?? 0, endSize: 0 };
  world.burst({ ...base, count: part(e.count, 0.35), mesh: 'sphere', size: e.size, speed: e.speed, lifetime: e.lifetime, color: bright });
  world.burst({
    ...base,
    count: part(e.count, 0.25),
    mesh: 'sphere',
    size: e.size * 1.3,
    speed: e.speed * 0.45,
    lifetime: e.lifetime * 0.85,
    color: bright
  });
  world.burst({
    ...base,
    count: part(e.count, 0.4),
    mesh: 'flame',
    size: e.size * 1.6,
    speed: e.speed * 0.8,
    lifetime: e.lifetime * 0.9,
    color: colors.map((c) => hot(pale(c, 0.35, 1), 2.4))
  });
  if (e.flash !== false) glowFlash(world, e, colors, e.size * 6);
}

/**
 * Something breaking apart: big slow chunks, small fast crumbs, a glow at the break and a puff of
 * its dust. `mesh` is the chunks' shape.
 */
function shatter(world: World, e: EffectOptions & { mesh?: BurstOptions['mesh']; dust?: boolean }) {
  const colors = list(e.colors);
  const mesh = e.mesh ?? 'cube';
  const base = { ...aim(e), gravity: e.gravity ?? 0, color: colors };
  world.burst({ ...base, count: part(e.count, 0.55), mesh, size: e.size * 1.1, speed: e.speed * 0.65, lifetime: e.lifetime, endSize: 0.2 });
  world.burst({ ...base, count: part(e.count, 0.6), mesh, size: e.size * 0.5, speed: e.speed * 1.1, lifetime: e.lifetime * 0.85, endSize: 0 });
  if (e.flash !== false) glowFlash(world, e, colors, e.size * 3);
  if (e.dust !== false) {
    const c = pale(mean(colors), 0.45, 0.5);
    world.burst({
      ...aim(e),
      count: 2,
      mesh: 'puff',
      size: e.size * 2,
      speed: e.speed * 0.2,
      lifetime: e.lifetime * 0.9,
      gravity: 0,
      color: c,
      endSize: 2.4,
      endColor: fade(c)
    });
  }
}

/** Liquid: droplets in two sizes thrown out of a fine mist of the same color. */
function splash(world: World, e: EffectOptions) {
  const colors = list(e.colors);
  const base = { ...aim(e), mesh: 'sphere' as const, gravity: e.gravity ?? 0, color: colors };
  world.burst({ ...base, count: part(e.count, 0.6), size: e.size, speed: e.speed, lifetime: e.lifetime, endSize: 0.3 });
  world.burst({ ...base, count: part(e.count, 0.4), size: e.size * 1.5, speed: e.speed * 0.45, lifetime: e.lifetime * 0.8, endSize: 0.2 });
  const mist = pale(mean(colors), 0.2, 0.55);
  world.burst({
    ...aim(e),
    count: 3,
    mesh: 'puff',
    size: e.size * 3,
    speed: e.speed * 0.25,
    lifetime: e.lifetime * 0.7,
    gravity: 0,
    color: mist,
    endSize: 2.2,
    endColor: fade(mist)
  });
  if (e.flash !== false) glowFlash(world, e, colors, e.size * 4);
}

/** Hot metal sparks: additive streaks that burn out, with a few solid beads and a flash where they strike. */
function sparks(world: World, e: EffectOptions) {
  const colors = list(e.colors).map((c) => hot(c, 2.6));
  const base = { ...aim(e), gravity: e.gravity ?? 0, color: colors, endSize: 0 };
  world.burst({ ...base, count: part(e.count, 0.7), mesh: 'flame', size: e.size * 1.6, speed: e.speed, lifetime: e.lifetime });
  world.burst({ ...base, count: part(e.count, 0.3), mesh: 'sphere', size: e.size * 0.6, speed: e.speed * 1.1, lifetime: e.lifetime * 0.8 });
  if (e.flash !== false) glowFlash(world, e, colors, e.size * 5);
}

const FIRE: readonly Color[] = [
  [2.6, 2.4, 1.8, 1],
  [2.4, 1.5, 0.45, 0.95],
  [2.2, 0.8, 0.2, 0.85]
];
const EMBERS: readonly Color[] = [
  [2.8, 2.2, 1, 1],
  [2.6, 1.3, 0.3, 1]
];

/**
 * A fiery blast: a white-hot flash, a fireball that cools into smoke, embers thrown out and, given
 * `debris` colors, chunks of whatever blew up. `size` is the fireball's puff size; `colors` its fire.
 * The fire and smoke swell every way; `direction`, `spread` and `gravity` aim the embers and debris.
 */
function explosion(
  world: World,
  e: Omit<EffectOptions, 'colors'> & { colors?: EffectOptions['colors']; debris?: readonly ColorInput[]; smoke?: ColorInput }
) {
  const fire = list(e.colors ?? FIRE);
  const smoke = rgba(e.smoke ?? [0.28, 0.25, 0.24, 0.6]);
  const g = e.gravity ?? 0;
  const around = { position: e.position, spread: Math.PI, gravity: 0 };
  if (e.flash !== false) {
    flash(world, { position: e.position, color: [3, 2.7, 2.1, 1], size: e.size * 1.6, lifetime: 0.2, endSize: 2, endColor: [2.4, 0.9, 0.2, 0] });
  }
  world.burst({
    ...around,
    count: part(e.count, 0.5),
    mesh: 'puff',
    size: e.size,
    speed: e.speed,
    lifetime: e.lifetime,
    color: fire,
    endSize: 2.2,
    endColor: [smoke[0], smoke[1], smoke[2], 0]
  });
  world.burst({
    ...around,
    count: part(e.count, 0.2),
    mesh: 'flame',
    size: e.size * 0.8,
    speed: e.speed * 0.5,
    lifetime: e.lifetime * 0.6,
    color: fire,
    endSize: 1.8,
    endColor: [2, 0.5, 0.1, 0]
  });
  world.burst({
    ...around,
    count: part(e.count, 0.25),
    mesh: 'puff',
    size: e.size * 0.9,
    speed: e.speed * 0.6,
    lifetime: e.lifetime * 1.7,
    color: smoke,
    endSize: 2.8,
    endColor: fade(smoke)
  });
  world.burst({
    ...aim(e),
    count: part(e.count, 0.4),
    mesh: 'flame',
    size: e.size * 0.12,
    speed: e.speed * 2.4,
    lifetime: e.lifetime * 0.9,
    gravity: g,
    color: EMBERS,
    endSize: 0
  });
  if (e.debris) {
    world.burst({
      ...aim(e),
      count: part(e.count, 0.5),
      mesh: 'cube',
      size: e.size * 0.16,
      speed: e.speed * 1.8,
      lifetime: e.lifetime * 1.2,
      gravity: g,
      color: e.debris,
      endSize: 0.3
    });
  }
}

const WHITE_HOT: Color = [2, 2, 2, 1]; // above 1 glows
const WHITE: Color = [1, 1, 1, 1];
const POP_TIME = 0.5;

const times = (scale: number | Vec3, k: number): number | Vec3 =>
  typeof scale === 'number' ? scale * k : [scale[0] * k, scale[1] * k, scale[2] * k];

/** The piece swells, flashes white, settles and shrinks away. Resolves when it's gone (despawning it is the caller's). */
function pop(world: World, entity: Entity, o: PopOptions): Promise<void> {
  const delay = o.delay ?? 0;
  const duration = o.duration ?? POP_TIME;
  const flashFor = { duration: duration * 0.3, delay };
  world.stopAnimation(entity); // whatever it was doing (landing, falling, wobbling) gives way
  if (o.color) world.animate(entity, [{ color: WHITE_HOT, at: 0.33 }, { color: o.color }], flashFor);
  if (o.flash?.length) world.animate(o.flash, [{ color: WHITE_HOT, at: 0.33 }, { color: WHITE }], flashFor);
  const s = o.scale;
  return world.animate(
    entity,
    [{ scale: times(s, 1.35), at: 0.15 }, { scale: times(s, 0.9), at: 0.25 }, { scale: times(s, 1), at: 0.35 }, { scale: times(s, 0) }],
    { duration, delay }
  );
}

/**
 * Ready-made effects. Each is one call; particles then live, fall, shrink and recolor in Rust.
 *
 * ```ts
 * effects.confetti(world, { position, colors: [RED, GOLD], size: 0.12, speed: 6, count: 40, lifetime: 1.2, gravity: -6 });
 * effects.dust(world, { position: feet, color: [0.8, 0.75, 0.65, 0.6], size: 0.3, speed: 1.5, count: 6, lifetime: 0.5 });
 * effects.flash(world, { position: hit, color: effects.hot(ORANGE), size: 0.8 });
 * await effects.pop(world, candy, { scale: 1, color: RED });
 * world.despawn(candy);
 * ```
 */
export const effects = {
  /** Celebration: tumbling paper, glints and a pop of light (wins, level-ups). */
  confetti,
  /** Reward glitter: bright beads and glints (pickups, perfect moves). */
  sparkle,
  /** Breaking apart: chunks, crumbs, a glow and dust (bricks, crates, glass). `mesh` shapes the chunks. */
  shatter,
  /** Liquid: droplets and mist (water, juice, paint). */
  splash,
  /** Hot metal: additive streaks and beads (scrapes, strikes, electricity). */
  sparks,
  /** Fiery blast: flash, fireball cooling to smoke, embers and optional debris. */
  explosion,
  /** Soft swelling puffs: dust, sand, sawdust, steam, smoke. */
  dust,
  /** One swelling glow: hits, strikes, muzzle flashes. */
  flash,
  /** The cleared-piece animation: swell, flash white, settle, shrink to nothing. */
  pop,
  /** Default `pop` duration in seconds. */
  POP_TIME,
  /** The same hue made self-lit (brightest channel lifted to `peak`), for glows. */
  hot,
  /** Part way (`t`, 0..1) to white. */
  pale
};
