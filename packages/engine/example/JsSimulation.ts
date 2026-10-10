import type { RenderSource } from "@nayan-ui/engine";
import { hashColor } from "./hashColor";

/** Benchmark baseline: the same scene as the Rust world, simulated in plain JS. */
export class JsSimulation implements RenderSource {
  readonly matrices: Float32Array;
  readonly colors: Float32Array;
  readonly ranges = new Uint32Array(16);
  readonly capacity: number;
  private time = 0;
  private base: Float32Array; // x, z, phase per instance

  constructor(readonly count: number, spacing = 1.6) {
    this.capacity = count;
    this.matrices = new Float32Array(count * 16);
    this.colors = new Float32Array(count * 4);
    this.ranges[0] = 0; // all cubes (mesh 0)
    this.ranges[1] = count;
    this.base = new Float32Array(count * 3);
    const side = Math.ceil(Math.sqrt(count));
    for (let i = 0; i < count; i++) {
      this.base[i * 3] = ((i % side) - side / 2) * spacing;
      this.base[i * 3 + 1] = (Math.floor(i / side) - side / 2) * spacing;
      this.base[i * 3 + 2] = (i % 97) * 0.1;
      const [r, g, b] = hashColor(i);
      this.colors.set([r, g, b, 1], i * 4);
    }
  }

  update(dt: number) {
    this.time += dt;
    const m = this.matrices;
    for (let i = 0; i < this.count; i++) {
      const x = this.base[i * 3] ?? 0;
      const z = this.base[i * 3 + 1] ?? 0;
      const phase = this.base[i * 3 + 2] ?? 0;
      const a = this.time + phase;
      const c = Math.cos(a);
      const s = Math.sin(a);
      const o = i * 16;
      // Rotation about Y + translation, column-major.
      m[o] = c; m[o + 1] = 0; m[o + 2] = -s; m[o + 3] = 0;
      m[o + 4] = 0; m[o + 5] = 1; m[o + 6] = 0; m[o + 7] = 0;
      m[o + 8] = s; m[o + 9] = 0; m[o + 10] = c; m[o + 11] = 0;
      m[o + 12] = x; m[o + 13] = Math.sin(a * 1.5) * 0.8; m[o + 14] = z; m[o + 15] = 1;
    }
  }
}
