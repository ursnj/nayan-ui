// The car, loaded from glTF files, and the roadside tree, built in code. The car is Khronos' "Car
// Concept" sample (CC-BY 4.0, from a public-domain model by Unity Fan), converted by the Nayan Game Engine
// example's scripts/import-car.py into three models: the body (white, so each car paints its own
// color), the glass, and the trim (tyres, rims, lights, black panels, mirrors, plate) in its own
// colors. Model units are metres: it sits on y = 0 facing -z, about 2.5 wide (mirrors) by 1.15 tall
// by 4.36 long.
import { type Color, lathe, loadModel, merge, type Model, type Vec3 } from '@nayan-ui/engine';

type GeometryPart = Parameters<typeof merge>[0][number];
import type { Footprint } from '../shared/EngineFootprint';
import { cacheGameAsset, createGameMesh as createShape } from '../shared/EngineMeshes';

// ── The car ───────────────────────────────────────────────────────────

export type CarMeshes = { body: Model; glass: Model; trim: Model };

let car: Promise<CarMeshes> | undefined;
/** Loads the car's three models once per app (decoded on native background threads). */
export function loadCarMeshes(): Promise<CarMeshes> {
  car ??= Promise.all([
    loadModel(require('../../assets/models/car/car_body.glb'), { center: false, shine: 0.85 }),
    loadModel(require('../../assets/models/car/car_glass.glb'), { center: false, shine: 0.95 }),
    loadModel(require('../../assets/models/car/car_trim.glb'), { center: false, shine: 0.25 })
  ]).then(([body, glass, trim]) => ({ body, glass, trim }));
  car.catch(() => (car = undefined)); // a failed load is retried next time
  return car;
}

// The body's half width every 0.218 m from nose (z = -2.18) to tail (z = 2.18), measured from its mesh.
const HALF_WIDTHS = [
  0.681, 0.927, 1.087, 1.103, 1.106, 1.107, 1.107, 1.097, 1.106, 1.136, 1.169, 1.108, 1.105, 1.106, 1.106, 1.115, 1.117, 1.118, 1.118, 1.116,
  1.032
];
const NOSE = -2.18;
const STEP = 0.218;

/**
 * The car's outline from above, for collisions: the body's own half widths along its length (the
 * mirrors fold in on contact, so they don't count), a couple of centimetres inside the paint.
 */
export const CAR_FOOTPRINT: Footprint = {
  length: 4.36,
  halfWidth: (z) => {
    const at = (z - NOSE) / STEP;
    if (at < 0 || at > HALF_WIDTHS.length - 1) return 0;
    const i = Math.min(HALF_WIDTHS.length - 2, Math.floor(at));
    const t = at - i;
    return Math.max(0, HALF_WIDTHS[i]! * (1 - t) + HALF_WIDTHS[i + 1]! * t - 0.03);
  }
};

/** Where the car's lamps are (for the night glow over them): the headlights' centres and the tail-light bar. */
export const CAR_LAMPS = {
  headlights: [-0.6, 0.6].map((x): Vec3 => [x, 0.66, -2.04]),
  headlightSize: [0.42, 0.06, 0.05] as Vec3,
  tail: [0, 0.96, 1.87] as Vec3,
  tailSize: [1.2, 0.045, 0.04] as Vec3
};

// ── The roadside tree ─────────────────────────────────────────────────

const BARK: Color = [0.45, 0.3, 0.18];
const NEEDLES_DARK: Color = [0.25, 0.6, 0.3];
const NEEDLES: Color = [0.32, 0.7, 0.35];

let tree: Model | null = null;
/** A low-poly pine about 1.2 tall and 1.5 across, its base at the origin: a trunk under three tiers. */
export function treeMesh(): Model {
  return cacheGameAsset('car-racing/CarMeshes:treeMesh', () => treeMeshUncached());
}

function treeMeshUncached(): Model {
  if (tree) return tree;
  const trunk = lathe(
    [
      [0.001, 0.4],
      [0.07, 0.4],
      [0.09, 0],
      [0.001, 0]
    ],
    { segments: 8, color: BARK }
  );
  const tier = (bottom: number, top: number, radius: number, color: Color): GeometryPart => ({
    geometry: lathe(
      [
        [0.001, top],
        [radius, bottom],
        [0.001, bottom]
      ],
      { segments: 7, color }
    )
  });
  tree = createShape(
    merge([{ geometry: trunk }, tier(0.22, 0.72, 0.75, NEEDLES_DARK), tier(0.5, 0.98, 0.56, NEEDLES), tier(0.76, 1.2, 0.36, NEEDLES_DARK)]),
    {
      center: false
    }
  );
  return tree;
}
