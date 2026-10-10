/**
 * The seam between game logic and rendering.
 * `matrices` is `count` column-major mat4s (16 floats each). The renderer only reads it.
 * Today a JS class implements this; the Rust core will fill the same buffer natively.
 */
export interface Simulation {
  readonly count: number;
  readonly matrices: Float32Array<ArrayBuffer>;
  update(dt: number): void;
}
