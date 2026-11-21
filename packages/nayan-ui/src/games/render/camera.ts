// Camera helpers: follow an entity, and shake the camera on impacts.
import type { Camera, RenderSource } from '../types';
import type { Entity } from '../world/types';

type WithPosition = RenderSource & { worldPosition(e: Entity, out: [number, number, number]): unknown };

/** `camera.follow`: ease the target toward the entity (where it was last drawn) and keep the eye at the offset. */
export function follow(camera: Camera, source: RenderSource, out: [number, number, number], dt: number) {
  const f = camera.follow;
  if (!f || !('worldPosition' in source) || !(source as WithPosition).worldPosition(f.target, out)) return;
  const smoothing = f.smoothing ?? 0.15;
  const k = smoothing > 0 ? 1 - Math.exp(-dt / smoothing) : 1;
  for (let i = 0; i < 3; i++) {
    camera.target[i] = camera.target[i]! + (out[i]! - camera.target[i]!) * k;
    camera.eye[i] = camera.target[i]! + f.offset[i]!;
  }
}

/** `camera.shake`: a jittered copy of the camera; the strength fades by itself. */
export function shake(camera: Camera, out: Camera, dt: number): Camera {
  const strength = camera.shake ?? 0;
  if (strength <= 0.001) {
    if (strength) camera.shake = 0;
    return camera;
  }
  camera.shake = strength * Math.exp(-dt * 8);
  out.fov = camera.fov;
  out.ortho = camera.ortho;
  for (let i = 0; i < 3; i++) {
    const jitter = (Math.random() * 2 - 1) * strength;
    out.eye[i] = camera.eye[i]! + jitter;
    out.target[i] = camera.target[i]! + jitter;
  }
  return out;
}
