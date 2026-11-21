// Vehicle footprints for the racing games: each vehicle's outline seen from above, so traffic collides
// with the body itself (a car's tapered nose and waist, a bike's narrow tyres and wider bars) rather
// than with a box the width of its lane.

/** A vehicle's outline from above: its length, and its half width at each point along it (model z, front at -length / 2). */
export type Footprint = { length: number; halfWidth: (z: number) => number };

/**
 * How far two footprints overlap sideways (> 0 when they touch): `b` is `ahead` metres in front of
 * `a` along the road and `gap` across it, both facing down the road. Sampled along the stretch where
 * they overlap lengthways; -Infinity when they don't.
 */
export function overlapAcross(a: Footprint, b: Footprint, ahead: number, gap: number, samples = 9): number {
  const lo = Math.max(-a.length / 2, ahead - b.length / 2);
  const hi = Math.min(a.length / 2, ahead + b.length / 2);
  if (hi <= lo) return -Infinity;
  let deepest = -Infinity;
  for (let i = 0; i < samples; i++) {
    const s = lo + ((hi - lo) * i) / (samples - 1);
    // A point `s` ahead of a vehicle's middle is at model z = -s (models face -z).
    deepest = Math.max(deepest, a.halfWidth(-s) + b.halfWidth(-(s - ahead)) - Math.abs(gap));
  }
  return deepest;
}

/**
 * Whether a contact that just began was nose to tail (a front hit) rather than side by side: they were
 * still (almost) clear lengthways a frame ago. `wasAhead` and `ahead` are the gap along the road then
 * and now. Allows for how far they closed in the frame and for tapered noses and tails.
 */
export function frontHit(a: Footprint, b: Footprint, wasAhead: number, ahead: number, taper = 0.5): boolean {
  const overlapBefore = (a.length + b.length) / 2 - Math.abs(wasAhead);
  const closed = Math.max(0, Math.abs(wasAhead) - Math.abs(ahead));
  return overlapBefore < taper + closed;
}
