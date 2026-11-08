"use client";

import { useRef, useState } from "react";
import {
  GameView,
  Path,
  createShape,
  extrude,
  parametricSurface,
  tube,
  merge,
  smoothNormals,
  quat,
  type World,
  useWorld,
  type Entity,
  type Camera,
  type Model,
  type Geometry,
} from "@nayan-ui/engine";

export type Piece = {
  mesh: Model;
  color: string;
  x: number;
  y: number;
  z: number;
};

// Dense contours keep circular silhouettes smooth at high pixel densities.
function circle(cx: number, cy: number, radius: number): [number, number][] {
  return Array.from({ length: 192 }, (_, index) => {
    const angle = (index / 192) * Math.PI * 2;
    return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius];
  });
}

// Closed, continuous surfaces keep glossy highlights free of triangulation seams.
function roundedLogoGeometry(outline: Path, depth: number): Geometry {
  type Point = [number, number];
  const contours = outline
    .toContours()
    .map((contour) => {
      const points = contour.map(([x, y]) => [x, -y] as Point);
      if (
        points.length > 1 &&
        Math.hypot(points[0][0] - points.at(-1)![0], points[0][1] - points.at(-1)![1]) < 1e-7
      )
        points.pop();
      return points;
    })
    .filter((points) => points.length >= 3);
  const ellipse = (points: Point[]) => {
    const xs = points.map(([x]) => x),
      ys = points.map(([, y]) => y);
    const left = Math.min(...xs),
      right = Math.max(...xs),
      bottom = Math.min(...ys),
      top = Math.max(...ys);
    const x = (left + right) / 2,
      y = (bottom + top) / 2,
      rx = (right - left) / 2,
      ry = (top - bottom) / 2;
    if (points.length < 24 || rx < 1e-5 || ry < 1e-5) return null;
    return points.every(
      ([px, py]) => Math.abs(((px - x) / rx) ** 2 + ((py - y) / ry) ** 2 - 1) < 0.002,
    )
      ? { x, y, rx, ry }
      : null;
  };
  const rounded = contours.map(ellipse);
  if (rounded.length === 1 && rounded[0]) {
    const { x, y, rx, ry } = rounded[0];
    return parametricSurface(
      (u, v) => {
        const around = u * Math.PI * 2,
          latitude = v * Math.PI;
        return [
          x + rx * Math.sin(latitude) * Math.cos(around),
          y + ry * Math.cos(latitude),
          (depth / 2) * Math.sin(latitude) * Math.sin(around),
        ];
      },
      { uSegments: 192, vSegments: 96, wrapU: true },
    );
  }
  if (rounded.length === 2 && rounded[0] && rounded[1]) {
    const [outer, inner] = [...rounded].sort((a, b) => b!.rx - a!.rx) as NonNullable<
      ReturnType<typeof ellipse>
    >[];
    if (
      Math.hypot(outer.x - inner.x, outer.y - inner.y) < 1e-5 &&
      outer.rx > inner.rx &&
      outer.ry > inner.ry
    ) {
      return parametricSurface(
        (u, v) => {
          const around = u * Math.PI * 2,
            section = v * Math.PI * 2;
          return [
            outer.x +
              ((outer.rx + inner.rx) / 2 + ((outer.rx - inner.rx) / 2) * Math.cos(section)) *
                Math.cos(around),
            outer.y +
              ((outer.ry + inner.ry) / 2 + ((outer.ry - inner.ry) / 2) * Math.cos(section)) *
                Math.sin(around),
            (depth / 2) * Math.sin(section),
          ];
        },
        { uSegments: 256, vSegments: 64, wrapU: true, wrapV: true },
      );
    }
  }
  const contains = (points: Point[], x: number, y: number) => {
    let inside = false;
    for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
      const [ax, ay] = points[i],
        [bx, by] = points[j];
      if (ay > y !== by > y && x < ((bx - ax) * (y - ay)) / (by - ay) + ax) inside = !inside;
    }
    return inside;
  };
  const edges = contours.flatMap((points, contourIndex) => {
    const area = points.reduce((sum, [x, y], i) => {
      const next = points[(i + 1) % points.length];
      return sum + x * next[1] - next[0] * y;
    }, 0);
    const nesting = contours.filter(
      (other, i) => i !== contourIndex && contains(other, ...points[0]),
    ).length;
    const direction = (area > 0 ? 1 : -1) * (nesting % 2 ? -1 : 1);
    return points.map(([x, y], i) => {
      const next = points[(i + 1) % points.length],
        dx = next[0] - x,
        dy = next[1] - y,
        length = Math.max(1e-10, Math.hypot(dx, dy));
      return {
        x,
        y,
        dx,
        dy,
        length2: length * length,
        nx: (direction * dy) / length,
        ny: (-direction * dx) / length,
      };
    });
  });
  const distance = (x: number, y: number) => {
    let best = Infinity,
      gx = 0,
      gy = 0,
      nx = 0,
      ny = 0;
    for (const edge of edges) {
      const t = Math.max(
        0,
        Math.min(1, ((x - edge.x) * edge.dx + (y - edge.y) * edge.dy) / edge.length2),
      );
      const dx = x - edge.x - t * edge.dx,
        dy = y - edge.y - t * edge.dy,
        d = dx * dx + dy * dy;
      if (d < best - 1e-12) {
        best = d;
        gx = dx;
        gy = dy;
        nx = edge.nx;
        ny = edge.ny;
      } else if (Math.abs(d - best) < 1e-12) {
        nx += edge.nx;
        ny += edge.ny;
      }
    }
    const d = Math.sqrt(best),
      length = Math.max(1e-10, Math.hypot(nx, ny));
    return {
      d: d < 1e-6 ? 0 : d,
      nx: d > 1e-6 ? -gx / d : nx / length,
      ny: d > 1e-6 ? -gy / d : ny / length,
    };
  };
  const flat = extrude(outline, { depth: 0, fillRule: "evenodd" });
  const points: Point[] = [],
    samples: ReturnType<typeof distance>[] = [],
    lookup = new Map<string, number>();
  const vertex = (x: number, y: number) => {
    const key = `${Math.round(x * 1e7)},${Math.round(y * 1e7)}`;
    let index = lookup.get(key);
    if (index === undefined) {
      index = points.length;
      points.push([x, y]);
      samples.push(distance(x, y));
      lookup.set(key, index);
    }
    return index;
  };
  let faces: number[] = [];
  const uniqueFaces = new Set<string>();
  for (let i = 0; i < flat.indices.length; i += 3) {
    const ids = [0, 1, 2].map((j) => {
      const offset = flat.indices[i + j] * 11;
      return vertex(flat.vertices[offset], flat.vertices[offset + 1]);
    });
    const key = [...ids].sort((a, b) => a - b).join(",");
    if (uniqueFaces.has(key)) continue;
    uniqueFaces.add(key);
    const [a, b, c] = ids.map((id) => points[id]);
    if ((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]) < 0)
      [ids[1], ids[2]] = [ids[2], ids[1]];
    faces.push(...ids);
  }
  const [left, top, right, bottom] = outline.bounds()!;
  let clearance = 0;
  for (let ix = 0; ix < 40; ix++)
    for (let iy = 0; iy < 40; iy++) {
      const x = left + ((right - left) * (ix + 0.5)) / 40,
        y = -bottom + ((bottom - top) * (iy + 0.5)) / 40;
      if (contours.reduce((count, contour) => count + Number(contains(contour, x, y)), 0) % 2)
        clearance = Math.max(clearance, distance(x, y).d);
    }
  const radius = Math.max(0.001, Math.min(0.22, clearance));
  const height = (index: number) => {
    const t = Math.min(1, samples[index].d / radius);
    return (depth / 2) * Math.sqrt(Math.max(0, t * (2 - t)));
  };
  const edgeKey = (a: number, b: number) => (a < b ? `${a},${b}` : `${b},${a}`);
  // Split an edge on every adjoining triangle together, so no T-junction can crack the surface.
  for (let pass = 0; pass < 18; pass++) {
    const split = new Map<string, number>(),
      visited = new Set<string>();
    for (let i = 0; i < faces.length; i += 3)
      for (let j = 0; j < 3; j++) {
        const a = faces[i + j],
          b = faces[i + ((j + 1) % 3)],
          key = edgeKey(a, b);
        if (visited.has(key)) continue;
        visited.add(key);
        const [ax, ay] = points[a],
          [bx, by] = points[b],
          middle = vertex((ax + bx) / 2, (ay + by) / 2);
        if (
          (ax - bx) ** 2 + (ay - by) ** 2 > 0.08 ** 2 ||
          Math.abs(height(middle) - (height(a) + height(b)) / 2) > 0.0008
        )
          split.set(key, middle);
      }
    if (!split.size) break;
    const next: number[] = [];
    for (let i = 0; i < faces.length; i += 3) {
      let a = faces[i],
        b = faces[i + 1],
        c = faces[i + 2];
      const ab = split.get(edgeKey(a, b)),
        bc = split.get(edgeKey(b, c)),
        ca = split.get(edgeKey(c, a));
      const mask =
        Number(ab !== undefined) + Number(bc !== undefined) * 2 + Number(ca !== undefined) * 4;
      if (mask === 0) next.push(a, b, c);
      else if (mask === 7) next.push(a, ab!, ca!, ab!, b, bc!, ca!, bc!, c, ab!, bc!, ca!);
      else if (mask === 1 || mask === 2 || mask === 4) {
        const middle = mask === 1 ? ab! : mask === 2 ? bc! : ca!;
        if (mask === 2) [a, b, c] = [b, c, a];
        else if (mask === 4) [a, b, c] = [c, a, b];
        next.push(a, middle, c, middle, b, c);
      } else {
        let first = ab!,
          second = bc!;
        if (mask === 6) {
          [a, b, c] = [b, c, a];
          first = bc!;
          second = ca!;
        } else if (mask === 5) {
          [a, b, c] = [c, a, b];
          first = ca!;
          second = ab!;
        }
        next.push(a, first, c, first, second, c, first, b, second);
      }
    }
    faces = next;
  }
  const vertices: number[] = [],
    indices = [...faces];
  for (const side of [1, -1])
    points.forEach(([x, y], i) => {
      const sample = samples[i],
        t = Math.min(1, sample.d / radius),
        round = Math.sqrt(Math.max(0, t * (2 - t))),
        slope = (depth / 2 / radius) * (1 - t),
        length = Math.max(1e-10, Math.hypot(slope, round));
      vertices.push(
        x,
        y,
        side * (0.015 + (depth / 2) * round),
        (sample.nx * slope) / length,
        (sample.ny * slope) / length,
        (side * round) / length,
        1,
        1,
        1,
        x,
        y,
      );
    });
  for (let i = 0; i < faces.length; i += 3)
    indices.push(
      faces[i] + points.length,
      faces[i + 2] + points.length,
      faces[i + 1] + points.length,
    );
  const borders = new Map<string, { a: number; b: number; count: number }>();
  for (let i = 0; i < faces.length; i += 3)
    for (let j = 0; j < 3; j++) {
      const a = faces[i + j],
        b = faces[i + ((j + 1) % 3)],
        key = edgeKey(a, b),
        border = borders.get(key);
      if (border) border.count++;
      else borders.set(key, { a, b, count: 1 });
    }
  for (const { a, b, count } of borders.values())
    if (count === 1) indices.push(a, b + points.length, b, a, a + points.length, b + points.length);
  return smoothNormals({ vertices: new Float32Array(vertices), indices: new Uint32Array(indices) });
}

// Rounded front/back faces catch studio highlights even with the camera straight on.
function piece(outline: Path, color: string, z = 0): Piece {
  const [left, top, right, bottom] = outline.bounds()!;
  return {
    mesh: createShape(roundedLogoGeometry(outline, z >= 0.1 ? 0.14 : 0.48), {
      shine: 0.88,
      optimize: true,
    }),
    color,
    x: (left + right) / 2,
    y: -(top + bottom) / 2,
    z: z >= 0.1 ? 0.28 + z * 0.3 : z,
  };
}

export function buildLogo(): Piece[] {
  return [
    {
      mesh: createShape(
        merge([
          {
            geometry: tube(
              circle(0, 0, 1.15).map(([x, y]) => [x, y, 0] as [number, number, number]),
              {
                radius: 0.05,
                sides: 64,
                smoothness: 2,
                closed: true,
              },
            ),
            scale: [1, 1, 2.2],
          },
        ]),
        { shine: 0.8, optimize: true },
      ),
      color: "#DDE2E8",
      x: 0,
      y: 0,
      z: 0,
    },
    piece(
      new Path().addPolygon([
        [0, -1.12],
        [-0.15, 0.08],
        [-0.97, 0.56],
        [0, 0.18],
        [0.97, 0.56],
        [0.15, 0.08],
      ]),
      "#DDE2E8",
      0.08,
    ),
  ];
}

// A silver ring turns toward the viewer as the star rotates into alignment.
export function drawLogo(world: World, entities: Entity[], pieces: Piece[], time: number) {
  const phase = time % 8;
  const smooth = (value: number) => {
    const t = Math.max(0, Math.min(1, value));
    return t * t * (3 - 2 * t);
  };
  const progress = (delay: number, duration: number) =>
    smooth((phase - 0.1 - delay) / duration) *
    (1 - smooth((phase - 6.1 - Math.max(0, 0.35 - delay * 0.3)) / 0.9));
  entities.forEach((entity, index) => {
    const part = pieces[index];
    const p = progress(index * 0.25, index === 0 ? 1 : 1.4);
    world.set(entity, {
      position: [part.x, part.y, part.z + (1 - p) * 0.65],
      rotation: index === 0 ? quat.y(((1 - p) * Math.PI) / 2) : quat.z(((1 - p) * Math.PI * 2) / 3),
      scale: index === 0 ? 0.9 + p * 0.1 : Math.max(0.001, p),
    });
  });
}

export default function MercedesLogoScene({
  playing = true,
  rendering = true,
  speed = 1,
  replay = 0,
  onReady,
  captureTime,
  onFrame,
}: {
  playing?: boolean;
  rendering?: boolean;
  speed?: number;
  replay?: number;
  onReady?: () => void;
  captureTime?: number;
  onFrame?: (time: number) => void;
} = {}) {
  const [error, setError] = useState(false);
  const group = useRef<{ entities: Entity[]; pieces: Piece[] }>({ entities: [], pieces: [] });
  const elapsed = useRef(0);
  const displayTime = useRef(3);
  const camera = useRef<Camera>({ eye: [0, 0, 6.5], target: [0, 0, 0], fov: 0.8 }).current;
  const started = useRef(false);
  const presented = useRef(false);
  const lastReplay = useRef(replay);
  const world = useWorld(
    16,
    (w) => {
      const pieces = buildLogo();
      // Keep a neutral backdrop behind the solid logo pieces.
      w.spawn({
        mesh: "plane",
        position: [0, 0, -0.5],
        rotation: quat.x(Math.PI / 2),
        scale: [100, 1, 100],
        color: "#162038",
        pickable: false,
      });
      elapsed.current = 0;
      const entities = pieces.map((part) => w.spawn({ mesh: part.mesh, color: part.color }));
      group.current = { pieces, entities };
      drawLogo(w, entities, pieces, 3);
    },
    [],
    () => {
      setError(true);
      onReady?.();
    },
  );

  if (error)
    return (
      <div
        role="alert"
        className="flex h-full items-center justify-center px-6 text-center text-sm text-slate-300"
      >
        The 3D preview could not start. Try a browser with WebGPU or WebGL2 enabled.
      </div>
    );
  if (!world)
    return (
      <div role="status" className="flex h-full items-center justify-center text-sm text-slate-300">
        Loading Nayan Game Engine…
      </div>
    );

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <GameView
        source={world}
        paused={!rendering}
        quality="high"
        adaptQuality={false}
        camera={camera}
        background="#0B1020"
        light={{ direction: [-3, 5, 7], ambient: 0.42, shadows: false }}
        style={{ width: "100%", height: "100%" }}
        onError={() => {
          setError(true);
          onReady?.();
        }}
        onUpdate={(dt) => {
          const { entities, pieces } = group.current;
          if (!presented.current && dt > 0) {
            presented.current = true;
            onReady?.();
          }
          if (!started.current) {
            started.current = true;
            displayTime.current = playing ? 0 : 3;
          }
          if (lastReplay.current !== replay) {
            elapsed.current = 0;
            displayTime.current = 0;
            lastReplay.current = replay;
          }
          if (captureTime === undefined && playing) {
            elapsed.current += dt * speed;
            displayTime.current = elapsed.current;
          }
          drawLogo(world, entities, pieces, captureTime ?? displayTime.current);
          if (captureTime !== undefined) {
            const renderedTime = captureTime;
            queueMicrotask(() => onFrame?.(renderedTime));
          }
        }}
      />
    </div>
  );
}
