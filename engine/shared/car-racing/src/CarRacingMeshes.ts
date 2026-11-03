import { createShape, ellipsoid, merge, type Model, shapeGeometry } from '@nayan-ui/engine';

/**
 * The roadside tree, built once per app (after warm-up) and shared by every run: mesh ids are never
 * freed, so never build one per spawn. Vertex colors are 0..1 tuples.
 */
let tree: Model | undefined;

export function treeMesh() {
  tree ??= createShape(
    merge([
      { geometry: shapeGeometry('cylinder', { color: [0.42, 0.28, 0.16] }), position: [0, 1, 0], scale: [0.35, 2, 0.35] },
      { geometry: ellipsoid([1.6, 2, 1.6], [0.2, 0.55, 0.22]), position: [0, 3.2, 0] }
    ])
  );
  return tree;
}
