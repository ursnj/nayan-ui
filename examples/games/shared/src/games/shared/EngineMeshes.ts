// The engine owns mesh hashing, preparation, registration and persistent storage in Rust.
// Factory caches additionally skip JS model construction. Ratio 1 preserves the
// authored surfaces, normals, colours and UV seams while welding and improving GPU cache reuse.
import { createShape, type Geometry, type Model, type ShapeOptions } from '@nayan-ui/engine';
import { cacheGameAsset, peekGameAsset } from './EngineMeshCache';

export function createGameMesh(geometry: Geometry, options: ShapeOptions = {}): Model {
  return createShape(geometry, { ...options, optimize: options.optimize ?? true });
}

/**
 * One module's mesh cache: each recipe is built once per install (kept in memory for the session and
 * on disk across launches), so meshes are never rebuilt per spawn, reset or theme change.
 *
 * ```ts
 * const cached = meshCache('stack-tower/StackTowerScene:');
 * const blockMesh = (w: number) => cached(`block:${w}`, () => createGameMesh(blockGeometry(w)));
 * ```
 */
export function meshCache(prefix: string) {
  return <T = Model>(key: string, build: () => T): T => cacheGameAsset(prefix + key, build);
}

export { cacheGameAsset, peekGameAsset };
