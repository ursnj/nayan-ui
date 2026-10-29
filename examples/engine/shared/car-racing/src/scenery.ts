// Small reusable detail meshes layered onto the original scenery. Model registration is done
// during asset loading; recycling road segments only instances these cached meshes.
import {
  ellipsoid,
  merge,
  type Color,
  type Geometry,
  type Model,
  type Vec3,
} from "@nayan-ui/engine";
import { createGameMesh, cacheGameAsset } from "./cache";

type Vector = [number, number, number];
class Details {
  private vertices: number[] = [];
  private indices: number[] = [];
  quad(
    a: Vec3,
    b: Vec3,
    c: Vec3,
    d: Vec3,
    normal: Vec3,
    color: Color,
    uv: [number, number] = [1, 1],
  ) {
    const first = this.vertices.length / 11;
    for (const [p, tex] of [
      [a, [0, 0]],
      [b, [uv[0], 0]],
      [c, uv],
      [d, [0, uv[1]]],
    ] as [Vec3, number[]][]) {
      this.vertices.push(...p, ...normal, color[0], color[1], color[2], tex[0]!, tex[1]!);
    }
    const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]],
      ac = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const facing =
      (ab[1]! * ac[2]! - ab[2]! * ac[1]!) * normal[0] +
      (ab[2]! * ac[0]! - ab[0]! * ac[2]!) * normal[1] +
      (ab[0]! * ac[1]! - ab[1]! * ac[0]!) * normal[2];
    this.indices.push(
      ...(facing >= 0 ? [0, 1, 2, 0, 2, 3] : [0, 2, 1, 0, 3, 2]).map((i) => first + i),
    );
  }
  box(size: Vec3, at: Vec3, color: Color) {
    const [x, y, z] = at,
      [w, h, d] = size.map((v) => v / 2) as Vector;
    this.quad(
      [x - w, y - h, z + d],
      [x + w, y - h, z + d],
      [x + w, y + h, z + d],
      [x - w, y + h, z + d],
      [0, 0, 1],
      color,
    );
    this.quad(
      [x + w, y - h, z - d],
      [x - w, y - h, z - d],
      [x - w, y + h, z - d],
      [x + w, y + h, z - d],
      [0, 0, -1],
      color,
    );
    this.quad(
      [x + w, y - h, z + d],
      [x + w, y - h, z - d],
      [x + w, y + h, z - d],
      [x + w, y + h, z + d],
      [1, 0, 0],
      color,
    );
    this.quad(
      [x - w, y - h, z - d],
      [x - w, y - h, z + d],
      [x - w, y + h, z + d],
      [x - w, y + h, z - d],
      [-1, 0, 0],
      color,
    );
    this.quad(
      [x - w, y + h, z + d],
      [x + w, y + h, z + d],
      [x + w, y + h, z - d],
      [x - w, y + h, z - d],
      [0, 1, 0],
      color,
    );
    this.quad(
      [x - w, y - h, z - d],
      [x + w, y - h, z - d],
      [x + w, y - h, z + d],
      [x - w, y - h, z + d],
      [0, -1, 0],
      color,
    );
  }
  geometry(): Geometry {
    return { vertices: new Float32Array(this.vertices), indices: new Uint32Array(this.indices) };
  }
}
const STONE: Color = [0.57, 0.57, 0.53],
  METAL: Color = [0.2, 0.24, 0.23],
  WOOD: Color = [0.43, 0.31, 0.2];
function detail(key: string, build: (mesh: Details) => void, shine = 0.1): Model {
  return cacheGameAsset(`car-racing/scenery-details-v1/${key}`, () => {
    const mesh = new Details();
    build(mesh);
    return createGameMesh(mesh.geometry(), { center: false, shine });
  });
}
function podium(): Model {
  return detail(
    "podium",
    (m) => {
      m.box([1.025, 0.32, 1.025], [0, 0.16, 0], STONE);
      m.box([1.012, 2.6, 1.012], [0, 1.5, 0], [0.2, 0.28, 0.3]);
      m.box([1.055, 0.18, 1.055], [0, 2.9, 0], [0.49, 0.48, 0.43]);
      for (const side of [-1, 1]) {
        for (const t of [-0.48, -0.24, 0, 0.24, 0.48]) {
          m.box([0.025, 2.5, 0.035], [side * 0.514, 1.5, t], [0.39, 0.41, 0.39]);
          m.box([0.035, 2.5, 0.025], [t, 1.5, side * 0.514], [0.39, 0.41, 0.39]);
        }
        m.box([0.095, 0.12, 0.66], [side * 0.55, 2.55, 0], [0.31, 0.36, 0.31]);
        m.box([0.025, 0.08, 0.015], [side * 0.534, 1.28, 0.065], [0.72, 0.73, 0.69]);
      }
    },
    0.25,
  );
}
function roof(style: number): Model {
  return detail(`roof-${style}`, (m) => {
    m.box([1.045, 0.25, 1.045], [0, 0.03, 0], [0.57, 0.56, 0.52]);
    for (const side of [-1, 1]) {
      m.box([1.03, 0.55, 0.018], [0, 0.36, side * 0.507], [0.46, 0.47, 0.44]);
      m.box([0.018, 0.55, 1.03], [side * 0.507, 0.36, 0], [0.46, 0.47, 0.44]);
    }
    m.box([0.25, 0.8, 0.25], [-0.17, 0.52, 0.16], [0.49, 0.53, 0.53]);
    for (let slat = 0; slat < 4; slat++)
      m.box([0.255, 0.035, 0.025], [-0.17, 0.96, 0.07 + slat * 0.055], METAL);
    m.box([0.12, style ? 1.5 : 0.65, 0.15], [0.24, style ? 0.95 : 0.52, -0.18], [0.52, 0.43, 0.35]);
    if (style) m.box([0.18, 0.1, 0.21], [0.24, 1.72, -0.18], [0.63, 0.61, 0.56]);
  });
}
function facade(style: number): Model {
  return detail(`trim-${style}`, (m) => {
    const trim: Color = style === 1 ? [0.58, 0.61, 0.61] : [0.72, 0.7, 0.64];
    for (const side of [-1, 1]) {
      for (const corner of [-1, 1])
        m.box([0.025, 0.985, 0.025], [side * 0.496, 0, corner * 0.496], trim);
      if (style === 0)
        for (const x of [-0.25, 0.25]) {
          m.box([0.013, 0.98, 0.012], [x, 0, side * 0.504], trim);
          m.box([0.012, 0.98, 0.013], [side * 0.504, 0, x], trim);
        }
    }
    for (const y of style === 2 ? [-0.25, 0, 0.25, 0.49] : [0.49])
      m.box([1.025, 0.009, 1.025], [0, y, 0], trim);
  });
}
function windows(): Model {
  return detail(
    "night-windows",
    (m) => {
      for (let row = 0; row < 16; row++)
        for (let col = 0; col < 8; col++) {
          if ((row * 7 + col * 3) % 13 > 1) continue;
          const x = (col + 0.5) / 8 - 0.5,
            y = (row + 0.5) / 16 - 0.5,
            w = 0.033,
            h = 0.021;
          const color: Color = (col + row) % 3 ? [1.55, 1.28, 0.72] : [1.2, 1.37, 1.48];
          for (const side of [-1, 1]) {
            m.quad(
              [x - w, y - h, side * 0.501],
              [x + w, y - h, side * 0.501],
              [x + w, y + h, side * 0.501],
              [x - w, y + h, side * 0.501],
              [0, 0, side],
              color,
            );
            m.quad(
              [side * 0.501, y - h, x - w],
              [side * 0.501, y - h, x + w],
              [side * 0.501, y + h, x + w],
              [side * 0.501, y + h, x - w],
              [side, 0, 0],
              color,
            );
          }
        }
    },
    0,
  );
}
function bench(): Model {
  return detail("bench", (m) => {
    for (const z of [-0.2, -0.07, 0.06, 0.19]) m.box([1.7, 0.07, 0.1], [0, 0.52, z], WOOD);
    for (const y of [0.77, 0.91, 1.05]) m.box([1.7, 0.1, 0.07], [0, y, -0.24], WOOD);
    for (const x of [-0.59, 0.59]) {
      m.box([0.08, 0.52, 0.45], [x, 0.26, 0], METAL);
      m.box([0.065, 1.06, 0.065], [x, 0.53, -0.23], METAL);
      m.box([0.07, 0.07, 0.45], [x, 0.72, 0], METAL);
    }
  });
}
function planter(): Model {
  return detail("planter", (m) => {
    m.box([1.5, 0.48, 1.8], [0, 0.24, 0], [0.43, 0.44, 0.39]);
    m.box([1.6, 0.08, 1.9], [0, 0.5, 0], [0.65, 0.64, 0.58]);
    m.box([1.32, 0.035, 1.62], [0, 0.55, 0], [0.21, 0.18, 0.12]);
  });
}
function bin(): Model {
  return detail("bin", (m) => {
    m.box([0.5, 0.85, 0.5], [0, 0.43, 0], [0.23, 0.29, 0.25]);
    m.box([0.56, 0.08, 0.56], [0, 0.9, 0], [0.39, 0.41, 0.35]);
    m.box([0.36, 0.15, 0.02], [0, 0.76, 0.257], [0.055, 0.07, 0.06]);
    for (const x of [-0.18, -0.06, 0.06, 0.18])
      m.box([0.012, 0.63, 0.025], [x, 0.4, 0.26], [0.12, 0.18, 0.15]);
  });
}
function shelter(): Model {
  return detail("shelter", (m) => {
    m.box([2.15, 0.16, 4.4], [0, 3.0, 0], [0.39, 0.42, 0.4]);
    m.box([2.3, 0.08, 4.6], [0, 3.13, 0], [0.58, 0.61, 0.57]);
    for (const z of [-1.9, 1.9])
      for (const x of [-0.85, 0.85]) m.box([0.08, 2.95, 0.08], [x, 1.5, z], METAL);
    m.box([0.035, 2.25, 3.6], [0.88, 1.65, 0], [0.34, 0.48, 0.51]);
    m.box([1.7, 0.06, 0.5], [0, 0.62, 0], WOOD);
    for (const z of [-1.1, 1.1]) m.box([0.5, 0.58, 0.08], [0, 0.29, z], METAL);
    m.box([0.06, 0.95, 0.65], [-0.86, 1.8, 1.4], [0.85, 0.86, 0.79]);
    for (let line = 0; line < 5; line++)
      m.box([0.07, 0.035, 0.42], [-0.9, 2.1 - line * 0.12, 1.4], [0.21, 0.35, 0.3]);
  });
}
function grass(): Model {
  return detail("grass", (m) => {
    for (let blade = 0; blade < 14; blade++) {
      const angle = blade * 2.39996,
        x = Math.cos(angle) * (0.15 + (blade % 3) * 0.08),
        z = Math.sin(angle) * (0.15 + (blade % 3) * 0.08);
      const h = 0.22 + (blade % 4) * 0.07,
        dx = Math.cos(angle) * 0.13,
        dz = Math.sin(angle) * 0.13;
      const normal: Vec3 = [Math.cos(angle), 0, Math.sin(angle)];
      const side: Vec3 = [-normal[2] * 0.025, 0, normal[0] * 0.025];
      const color: Color = [0.22 + (blade % 3) * 0.035, 0.34 + (blade % 4) * 0.025, 0.12];
      const points: Vec3[] = [
        [x + side[0], 0, z + side[2]],
        [x - side[0], 0, z - side[2]],
        [x + dx, h, z + dz],
        [x + dx, h, z + dz],
      ];
      m.quad(points[0]!, points[1]!, points[2]!, points[3]!, normal, color);
      m.quad(points[3]!, points[2]!, points[1]!, points[0]!, [-normal[0], 0, -normal[2]], color);
    }
  });
}
function flowers(): Model {
  return detail("flowers", (m) => {
    for (let i = 0; i < 9; i++) {
      const x = Math.cos(i * 2.4) * 0.44,
        z = Math.sin(i * 2.4) * 0.5,
        h = 0.3 + (i % 3) * 0.09;
      m.box([0.018, h, 0.018], [x, h / 2, z], [0.19, 0.32, 0.12]);
      const petal: Color = i % 3 ? [0.9, 0.78, 0.32] : [0.86, 0.86, 0.79];
      m.box([0.17, 0.035, 0.055], [x, h, z], petal);
      m.box([0.055, 0.04, 0.17], [x, h, z], petal);
      m.box([0.045, 0.048, 0.045], [x, h + 0.01, z], [0.59, 0.38, 0.1]);
    }
  });
}
function pavement(): Model {
  return detail("pavement", (m) => {
    m.box([2.6, 0.12, 6.35], [0, 0, 0], [0.65, 0.65, 0.61]);
    for (let row = 0; row < 6; row++)
      m.box([2.6, 0.006, 0.015], [0, 0.063, -2.5 + row], [0.5, 0.51, 0.47]);
    for (const x of [-0.43, 0.43]) m.box([0.015, 0.006, 6.3], [x, 0.063, 0], [0.5, 0.51, 0.47]);
    for (const x of [-1.27, 1.27]) m.box([0.065, 0.06, 6.35], [x, 0.08, 0], [0.74, 0.73, 0.67]);
  });
}
function drain(): Model {
  return detail("drain", (m) => {
    m.box([0.31, 0.014, 0.65], [0, 0, 0], [0.29, 0.3, 0.27]);
    for (let i = 0; i < 7; i++)
      m.box([0.23, 0.006, 0.035], [0, 0.009, -0.25 + i * 0.08], [0.085, 0.1, 0.09]);
  });
}
function houseDetails(): Model {
  return detail("house-details", (m) => {
    m.box([5.2, 0.16, 5.8], [0, 3.14, 0], [0.64, 0.62, 0.53]);
    m.box([0.55, 1.4, 0.55], [1.3, 4.0, -0.9], [0.49, 0.35, 0.28]);
    m.box([0.68, 0.12, 0.68], [1.3, 4.73, -0.9], [0.58, 0.56, 0.51]);
    for (const x of [-2.55, 2.55]) {
      m.box([0.07, 1.2, 1.2], [x, 0.64, 0.9], [0.31, 0.35, 0.29]);
      m.box([0.9, 0.1, 1.45], [x, 1.35, 0.9], [0.5, 0.36, 0.24]);
    }
  });
}
function routeSign(): Model {
  return detail("route-sign", (m) => {
    m.box([4.2, 1.5, 0.12], [0, 0, 0], [0.16, 0.29, 0.22]);
    for (const side of [-1, 1]) {
      m.box([4.12, 0.035, 0.015], [0, side * 0.69, 0.072], [0.79, 0.83, 0.73]);
      m.box([0.035, 1.36, 0.015], [side * 2.03, 0, 0.072], [0.79, 0.83, 0.73]);
    }
    m.box([0.7, 0.12, 0.02], [1.25, -0.05, 0.08], [0.94, 0.95, 0.86]);
    m.quad(
      [1.42, -0.31, 0.094],
      [1.8, -0.05, 0.094],
      [1.42, 0.21, 0.094],
      [1.42, 0.21, 0.094],
      [0, 0, 1],
      [0.94, 0.95, 0.86],
    );
  });
}

function grassGround(): Model {
  return detail("grass-ground-v2", (m) =>
    m.quad(
      [-0.5, 0, -0.5],
      [0.5, 0, -0.5],
      [0.5, 0, 0.5],
      [-0.5, 0, 0.5],
      [0, 1, 0],
      [1, 1, 1],
      [1, 1],
    ),
  );
}
function cloud(): Model {
  return cacheGameAsset("car-racing/scenery-details-v1/cloud", () =>
    createGameMesh(
      merge([
        { geometry: ellipsoid([14, 2.4, 6], [1, 1, 1], 10) },
        { geometry: ellipsoid([8, 3.8, 5], [1, 1, 1], 10), position: [-4, 1.1, 0] },
        { geometry: ellipsoid([7, 2.8, 5], [1, 1, 1], 10), position: [8, 0.4, 1] },
      ]),
      { center: false, shine: 0 },
    ),
  );
}

let scenery: ReturnType<typeof buildScenery> | undefined;
function buildScenery() {
  return {
    podium: podium(),
    roofs: [roof(0), roof(1)],
    facades: [facade(0), facade(1), facade(2)],
    windows: windows(),
    bench: bench(),
    planter: planter(),
    bin: bin(),
    shelter: shelter(),
    grass: grass(),
    flowers: flowers(),
    pavement: pavement(),
    drain: drain(),
    house: houseDetails(),
    grassGround: grassGround(),
    routeSign: routeSign(),
    cloud: cloud(),
  };
}
export type SceneryMeshes = ReturnType<typeof buildScenery>;
export function sceneryMeshes(): SceneryMeshes {
  return (scenery ??= buildScenery());
}
