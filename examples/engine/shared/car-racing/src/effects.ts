import type { BurstOptions, Color, Vec3, World } from "@nayan-ui/engine";
export type Effect = {
  position: Vec3;
  /** One color, or several to pick from at random. */
  colors: Color | readonly Color[];
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

type Rgba = [number, number, number, number];

const rgba = (c: Color): Rgba => [c[0], c[1], c[2], c[3] ?? 1];
const list = (colors: Effect["colors"]): Rgba[] =>
  typeof colors[0] === "number" ? [rgba(colors as Color)] : (colors as readonly Color[]).map(rgba);
const part = (count: number, share: number) => Math.max(1, Math.round(count * share));

/** The colors' average. */
function mean(colors: Rgba[]): Rgba {
  const sum: Rgba = [0, 0, 0, 0];
  for (const c of colors) for (let i = 0; i < 4; i++) sum[i]! += c[i]!;
  return sum.map((v) => v / colors.length) as Rgba;
}

/** The same hue, self-lit: its brightest channel lifted to `peak` (above 1 glows, through light, shadow and fog). */
export function hot(c: Color, peak = 2.2, alpha = c[3] ?? 1): Rgba {
  const k = peak / Math.max(c[0], c[1], c[2], 0.25);
  return [c[0] * k, c[1] * k, c[2] * k, alpha];
}

/** GeometryPart way to white. */
const pale = (c: Rgba, t: number, alpha: number): Rgba => [
  c[0] + (1 - c[0]) * t,
  c[1] + (1 - c[1]) * t,
  c[2] + (1 - c[2]) * t,
  alpha,
];

const fade = (c: Rgba): Rgba => [c[0], c[1], c[2], 0];

function aim(
  e: Pick<Effect, "position" | "direction" | "spread">,
): Pick<BurstOptions, "position" | "direction" | "spread"> {
  return { position: e.position, direction: e.direction ?? [0, 1, 0], spread: e.spread ?? Math.PI };
}

/** A glow that swells and fades at the source, in the effect's own hue. */
function glowFlash(world: World, e: Effect, colors: Rgba[], size: number) {
  const c = hot(mean(colors), 2, 0.85);
  world.burst({
    position: e.position,
    count: 1,
    mesh: "flame",
    size,
    speed: 0,
    lifetime: 0.22,
    gravity: 0,
    color: c,
    endSize: 2.2,
    endColor: fade(c),
  });
}

export function sparks(world: World, e: Effect) {
  const colors = list(e.colors).map((c) => hot(c, 2.6));
  const base = { ...aim(e), gravity: e.gravity ?? 0, color: colors, endSize: 0 };
  world.burst({
    ...base,
    count: part(e.count, 0.7),
    mesh: "flame",
    size: e.size * 1.6,
    speed: e.speed,
    lifetime: e.lifetime,
  });
  world.burst({
    ...base,
    count: part(e.count, 0.3),
    mesh: "sphere",
    size: e.size * 0.6,
    speed: e.speed * 1.1,
    lifetime: e.lifetime * 0.8,
  });
  if (e.flash !== false) glowFlash(world, e, colors, e.size * 5);
}
