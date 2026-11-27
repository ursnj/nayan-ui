import type { Quat } from './types';

/** A writable quaternion; pass one as `out` to reuse it instead of allocating. */
export type MutableQuat = [number, number, number, number];

const result = (out: MutableQuat | undefined, x: number, y: number, z: number, w: number): MutableQuat => {
  if (!out) return [x, y, z, w];
  out[0] = x;
  out[1] = y;
  out[2] = z;
  out[3] = w;
  return out;
};

/**
 * Quaternion helpers for `rotation` options, keyframes and geometry parts ([x, y, z, w]). Every
 * function takes an optional `out` so per-frame code can reuse one array instead of allocating.
 *
 * ```ts
 * world.set(car, { rotation: quat.y(heading) });
 * const spin = quat.multiply(quat.y(yaw), quat.x(pitch), scratch); // pitch first, then yaw
 * ```
 */
export const quat = {
  /** No rotation. */
  identity: Object.freeze([0, 0, 0, 1]) as Quat,

  /** Rotation by `angle` radians around the unit axis (x, y, z). */
  axisAngle(x: number, y: number, z: number, angle: number, out?: MutableQuat): MutableQuat {
    const s = Math.sin(angle / 2);
    return result(out, x * s, y * s, z * s, Math.cos(angle / 2));
  },

  /** Rotation around the x axis (pitch). */
  x(angle: number, out?: MutableQuat): MutableQuat {
    return result(out, Math.sin(angle / 2), 0, 0, Math.cos(angle / 2));
  },

  /** Rotation around the y axis (yaw, heading). */
  y(angle: number, out?: MutableQuat): MutableQuat {
    return result(out, 0, Math.sin(angle / 2), 0, Math.cos(angle / 2));
  },

  /** Rotation around the z axis (roll; spin for 2D games looking down -z). */
  z(angle: number, out?: MutableQuat): MutableQuat {
    return result(out, 0, 0, Math.sin(angle / 2), Math.cos(angle / 2));
  },

  /** `a` after `b`: `b` turns first. `out` may be `a` or `b`. */
  multiply(a: Quat, b: Quat, out?: MutableQuat): MutableQuat {
    const [ax, ay, az, aw] = a;
    const [bx, by, bz, bw] = b;
    return result(
      out,
      aw * bx + ax * bw + ay * bz - az * by,
      aw * by - ax * bz + ay * bw + az * bx,
      aw * bz + ax * by - ay * bx + az * bw,
      aw * bw - ax * bx - ay * by - az * bz
    );
  },

  /** Turns around x, then y, then z (radians): the same as `multiply(z(z), multiply(y(y), x(x)))`. */
  fromEuler(x: number, y: number, z: number, out?: MutableQuat): MutableQuat {
    const sx = Math.sin(x / 2);
    const cx = Math.cos(x / 2);
    const sy = Math.sin(y / 2);
    const cy = Math.cos(y / 2);
    const sz = Math.sin(z / 2);
    const cz = Math.cos(z / 2);
    return result(out, sx * cy * cz - cx * sy * sz, cx * sy * cz + sx * cy * sz, cx * cy * sz - sx * sy * cz, cx * cy * cz + sx * sy * sz);
  },

  /** Shortest-path interpolation from `a` (t = 0) to `b` (t = 1). */
  slerp(a: Quat, b: Quat, t: number, out?: MutableQuat): MutableQuat {
    let [bx, by, bz, bw] = b;
    let cos = a[0] * bx + a[1] * by + a[2] * bz + a[3] * bw;
    if (cos < 0) {
      cos = -cos;
      bx = -bx;
      by = -by;
      bz = -bz;
      bw = -bw;
    }
    let k0 = 1 - t;
    let k1 = t;
    if (cos < 0.9995) {
      const angle = Math.acos(cos);
      const sin = Math.sin(angle);
      k0 = Math.sin(k0 * angle) / sin;
      k1 = Math.sin(k1 * angle) / sin;
    }
    const x = k0 * a[0] + k1 * bx;
    const y = k0 * a[1] + k1 * by;
    const z = k0 * a[2] + k1 * bz;
    const w = k0 * a[3] + k1 * bw;
    const length = Math.hypot(x, y, z, w) || 1;
    return result(out, x / length, y / length, z / length, w / length);
  }
};
