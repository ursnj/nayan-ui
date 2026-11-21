import { type ColorInput, resolveColor } from './color';
import type { Entity, EntityOptions } from './types';

export type TransformOptions = Pick<EntityOptions, 'position' | 'rotation' | 'scale' | 'color'>;
export const TRANSFORM_STRIDE = 16;

/**
 * Explicit draw-only updates, applied in one native call by `flush()`. `world.update` flushes
 * `world.transforms` before stepping; flush yourself before reading positions or animating. Records and scratch storage are reused; values are
 * copied when queued, never retained by reference. The scalar methods (`position`, `rotation`,
 * `scale`, `color`, `transform`) allocate nothing; consecutive calls for the same entity share one
 * record.
 *
 * ```ts
 * const batch = world.transforms;
 * for (const p of pieces) batch.transform(p.entity, p.x, 0, p.z, 0, p.qy, 0, p.qw);
 * batch.flush();
 * ```
 */
export class TransformBatch {
  private data = new Float64Array(TRANSFORM_STRIDE * 32);
  private count = 0;
  constructor(private readonly commit: (data: Float64Array, count: number) => number) {}

  private record(entity: Entity, flags: number): number {
    // Merge into the previous record when it updates the same entity (the layout is fixed per field).
    if (this.count > 0) {
      const last = (this.count - 1) * TRANSFORM_STRIDE;
      if (this.data[last] === entity) {
        this.data[last + 1] = this.data[last + 1]! | flags;
        return last;
      }
    }
    const offset = this.count * TRANSFORM_STRIDE;
    if (offset + TRANSFORM_STRIDE > this.data.length) {
      const grown = new Float64Array(this.data.length * 2);
      grown.set(this.data);
      this.data = grown;
    }
    this.count++;
    this.data[offset] = entity;
    this.data[offset + 1] = flags;
    return offset;
  }

  position(entity: Entity, x: number, y: number, z: number): void {
    const offset = this.record(entity, 2);
    this.data[offset + 2] = x;
    this.data[offset + 3] = y;
    this.data[offset + 4] = z;
  }

  /** Rotation quaternion [x, y, z, w]. */
  rotation(entity: Entity, x: number, y: number, z: number, w: number): void {
    const offset = this.record(entity, 4);
    this.data[offset + 5] = x;
    this.data[offset + 6] = y;
    this.data[offset + 7] = z;
    this.data[offset + 8] = w;
  }

  /** Uniform scale, or per axis. */
  scale(entity: Entity, x: number, y = x, z = x): void {
    const offset = this.record(entity, 8);
    this.data[offset + 9] = x;
    this.data[offset + 10] = y;
    this.data[offset + 11] = z;
  }

  /** RGBA color; alpha defaults to 1. */
  color(entity: Entity, r: number, g: number, b: number, a = 1): void {
    const offset = this.record(entity, 16);
    this.data[offset + 12] = r;
    this.data[offset + 13] = g;
    this.data[offset + 14] = b;
    this.data[offset + 15] = a;
  }

  /** Position and rotation together (the common per-frame update for a moving piece). */
  transform(entity: Entity, x: number, y: number, z: number, qx: number, qy: number, qz: number, qw: number): void {
    const offset = this.record(entity, 6);
    this.data[offset + 2] = x;
    this.data[offset + 3] = y;
    this.data[offset + 4] = z;
    this.data[offset + 5] = qx;
    this.data[offset + 6] = qy;
    this.data[offset + 7] = qz;
    this.data[offset + 8] = qw;
  }

  /** Queued records (merged per entity). */
  get size(): number {
    return this.count;
  }

  set(entity: Entity, options: TransformOptions): void {
    const { position, rotation, scale, color } = options;
    const flags = (position ? 2 : 0) | (rotation ? 4 : 0) | (scale !== undefined ? 8 : 0) | (color ? 16 : 0);
    if (!flags) return;
    const offset = this.record(entity, flags);
    if (position) this.data.set(position, offset + 2);
    if (rotation) this.data.set(rotation, offset + 5);
    if (typeof scale === 'number') this.data.fill(scale, offset + 9, offset + 12);
    else if (scale) this.data.set(scale, offset + 9);
    if (color) this.writeColor(offset, color);
  }

  private writeColor(offset: number, input: ColorInput) {
    const color = resolveColor(input);
    this.data[offset + 12] = color[0];
    this.data[offset + 13] = color[1];
    this.data[offset + 14] = color[2];
    this.data[offset + 15] = color[3] ?? 1;
  }

  flush(): number {
    if (!this.count) return 0;
    try {
      return this.commit(this.data, this.count);
    } finally {
      this.count = 0;
    }
  }

  clear(): void {
    this.count = 0;
  }
}
