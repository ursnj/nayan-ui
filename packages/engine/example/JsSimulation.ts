import type { Simulation } from "@nayan-ui/engine";

/** Demo: a grid of spinning, bobbing cubes. Stands in for the Rust core. */
export class JsSimulation implements Simulation {
  readonly matrices: Float32Array<ArrayBuffer>;
  private time = 0;
  private base: Float32Array; // x, z, phase per instance

  constructor(readonly count: number, spacing = 1.6) {
    this.matrices = new Float32Array(count * 16);
    this.base = new Float32Array(count * 3);
    const side = Math.ceil(Math.sqrt(count));
    for (let i = 0; i < count; i++) {
      this.base[i * 3] = ((i % side) - side / 2) * spacing;
      this.base[i * 3 + 1] = (Math.floor(i / side) - side / 2) * spacing;
      this.base[i * 3 + 2] = (i % 97) * 0.1;
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
