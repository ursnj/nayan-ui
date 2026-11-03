import { block, createShape, ellipsoid, merge, quat, shapeGeometry, type Model } from '@nayan-ui/engine';

/**
 * Procedural models, built once per app (after warm-up) and shared by every run: mesh ids are never
 * freed, so never build one per spawn. Vertex colors are 0..1 tuples; the white body takes each
 * entity's color, while glass and tyres keep their own.
 */
let meshes: { car: Model; tree: Model } | undefined;

export function racingMeshes() {
  meshes ??= {
    car: createShape(
      merge([
        { geometry: block(1.9, 0.55, 4.2, 6), position: [0, 0.55, 0] },
        { geometry: block(1.5, 0.5, 2, 4, [0.12, 0.14, 0.18]), position: [0, 1.05, 0.25] },
        ...[-0.95, 0.95].flatMap((x) =>
          [-1.35, 1.35].map((z) => ({
            geometry: shapeGeometry('cylinder', { color: [0.08, 0.08, 0.09] }),
            position: [x, 0.38, z] as [number, number, number],
            rotation: quat.z(Math.PI / 2),
            scale: [0.76, 0.3, 0.76] as [number, number, number]
          }))
        )
      ]),
      { shine: 0.6 }
    ),
    tree: createShape(
      merge([
        { geometry: shapeGeometry('cylinder', { color: [0.42, 0.28, 0.16] }), position: [0, 1, 0], scale: [0.35, 2, 0.35] },
        { geometry: ellipsoid([1.6, 2, 1.6], [0.2, 0.55, 0.22]), position: [0, 3.2, 0] }
      ])
    )
  };
  return meshes;
}
