// Pure rules, with no engine import, so they test anywhere.
export const CAR = { width: 2.3, length: 4.4 }; // the car model's footprint, mirrors included

/** True when two cars at these centres touch. */
export const touching = (ax: number, az: number, bx: number, bz: number) =>
  Math.abs(ax - bx) < CAR.width * 0.9 && Math.abs(az - bz) < CAR.length * 0.9;

/** Metres left to the finish from z (forward is -z), in steps of 10 so the HUD updates rarely. */
export const metresLeft = (trackLength: number, z: number) => Math.max(0, Math.ceil((trackLength + z) / 10) * 10);
