import { createShape, ProceduralCache, type Geometry, type ShapeOptions } from "@nayan-ui/engine";
let cache: ProceduralCache | undefined;
export function cacheGameAsset<T>(key: string, build: () => T): T {
  cache ??= new ProceduralCache("car-racing-games-v1");
  return cache.get(key, build);
}
export function createGameMesh(geometry: Geometry, options: ShapeOptions = {}) {
  return createShape(geometry, { ...options, optimize: options.optimize ?? true });
}
