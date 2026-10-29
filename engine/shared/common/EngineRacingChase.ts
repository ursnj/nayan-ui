import type { Camera, Vec3 } from '@nayan-ui/engine';

type Vector = [number, number, number];
export const createChase = () => ({
  eye: [6, 3, 6] as Vector,
  target: [0, 0.2, 0] as Vector,
  initialized: false
});
export type Chase = ReturnType<typeof createChase>;

/** Filter camera offsets only: translation stays locked to the exact displayed car pose. */
export function updateChase(chase: Chase, camera: Camera, anchor: Vec3, eye: Vec3, target: Vec3, dt: number) {
  const k = chase.initialized ? 1 - Math.exp(-Math.max(0, dt) * 7) : 1;
  for (let axis = 0; axis < 3; axis++) {
    chase.eye[axis] += (eye[axis]! - chase.eye[axis]!) * k;
    chase.target[axis] += (target[axis]! - chase.target[axis]!) * k;
    camera.eye[axis] = anchor[axis]! + chase.eye[axis]!;
    camera.target[axis] = anchor[axis]! + chase.target[axis]!;
  }
  chase.initialized = true;
}
