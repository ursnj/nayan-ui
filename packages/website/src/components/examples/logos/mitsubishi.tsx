"use client";

import { useEffect, useRef, useState } from "react";
import {
  GameView,
  Path,
  createShape,
  extrude,
  smoothNormals,
  quat,
  World,
  warmUpEngine,
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

// Tessellate the exact silhouette into a closed, rounded solid, including any holes.
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
        dy = next[1] - y;
      const length = Math.max(1e-10, Math.hypot(dx, dy));
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
        dy = y - edge.y - t * edge.dy;
      const d = dx * dx + dy * dy;
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
    const d = Math.sqrt(best);
    const length = Math.max(1e-10, Math.hypot(nx, ny));
    return {
      d: d < 1e-6 ? 0 : d,
      nx: d > 1e-6 ? -gx / d : nx / length,
      ny: d > 1e-6 ? -gy / d : ny / length,
    };
  };
  const flat = extrude(outline, { depth: 0, fillRule: "evenodd" });
  const points: Point[] = [],
    faces: number[] = [],
    lookup = new Map<string, number>();
  const vertex = (point: Point) => {
    const key = `${Math.round(point[0] * 1e7)},${Math.round(point[1] * 1e7)}`;
    let index = lookup.get(key);
    if (index === undefined) {
      index = points.length;
      points.push(point);
      lookup.set(key, index);
    }
    return index;
  };
  const length2 = (a: Point, b: Point) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;
  const subdivide = (a: Point, b: Point, c: Point, level = 0) => {
    const lengths = [length2(a, b), length2(b, c), length2(c, a)];
    const longest = Math.max(...lengths);
    if (longest <= 0.12 ** 2 || level >= 18) {
      const ids = [vertex(a), vertex(b), vertex(c)];
      if ((b[0] - a[0]) * (c[1] - a[1]) - (b[1] - a[1]) * (c[0] - a[0]) < 0)
        [ids[1], ids[2]] = [ids[2], ids[1]];
      faces.push(...ids);
      return;
    }
    if (lengths[1] === longest) [a, b, c] = [b, c, a];
    else if (lengths[2] === longest) [a, b, c] = [c, a, b];
    const middle: Point = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    subdivide(a, middle, c, level + 1);
    subdivide(middle, b, c, level + 1);
  };
  for (let i = 0; i < flat.indices.length; i += 3) {
    const triangle = [0, 1, 2].map((j) => {
      const offset = flat.indices[i + j] * 11;
      return [flat.vertices[offset], flat.vertices[offset + 1]] as Point;
    });
    subdivide(triangle[0], triangle[1], triangle[2]);
  }
  const samples = points.map(([x, y]) => distance(x, y));
  const radius = Math.max(
    0.001,
    Math.min(
      0.22,
      samples.reduce((max, sample) => Math.max(max, sample.d), 0),
    ),
  );
  const height = (index: number) => {
    const t = Math.min(1, samples[index].d / radius);
    return (depth / 2) * Math.sqrt(Math.max(0, t * (2 - t)));
  };
  const refined: number[] = [];
  const refine = (a: number, b: number, c: number, level = 0) => {
    const pairs = [
      [a, b],
      [b, c],
      [c, a],
    ];
    const middles = pairs.map(([u, v]) => {
      const point: Point = [(points[u][0] + points[v][0]) / 2, (points[u][1] + points[v][1]) / 2];
      const index = vertex(point);
      samples[index] ??= distance(...point);
      return index;
    });
    const errors = pairs.map(([u, v], i) =>
      Math.abs(height(middles[i]) - (height(u) + height(v)) / 2),
    );
    const worst = Math.max(...errors);
    if (worst < 0.0015 || level >= 14) {
      refined.push(a, b, c);
      return;
    }
    const edge = errors.indexOf(worst),
      middle = middles[edge];
    if (edge === 1) [a, b, c] = [b, c, a];
    else if (edge === 2) [a, b, c] = [c, a, b];
    refine(a, middle, c, level + 1);
    refine(middle, b, c, level + 1);
  };
  for (let i = 0; i < faces.length; i += 3) refine(faces[i], faces[i + 1], faces[i + 2]);
  const vertices: number[] = [],
    indices = [...refined];
  for (const side of [1, -1])
    points.forEach(([x, y], i) => {
      const sample = samples[i],
        t = Math.min(1, sample.d / radius);
      const round = Math.sqrt(Math.max(0, t * (2 - t)));
      const slope = (depth / 2 / radius) * (1 - t);
      const length = Math.max(1e-10, Math.hypot(slope, round));
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
  for (let i = 0; i < refined.length; i += 3)
    indices.push(
      refined[i] + points.length,
      refined[i + 2] + points.length,
      refined[i + 1] + points.length,
    );
  // A narrow side wall separates the two faces at the silhouette and prevents depth fighting.
  const borders = new Map<string, { a: number; b: number; count: number }>();
  for (let i = 0; i < refined.length; i += 3) {
    for (let j = 0; j < 3; j++) {
      const a = refined[i + j],
        b = refined[i + ((j + 1) % 3)];
      const key = a < b ? `${a},${b}` : `${b},${a}`;
      const border = borders.get(key);
      if (border) border.count++;
      else borders.set(key, { a, b, count: 1 });
    }
  }
  for (const { a, b, count } of borders.values()) {
    if (count !== 1 || samples[a].d !== 0 || samples[b].d !== 0) continue;
    indices.push(a, b + points.length, b, a, a + points.length, b + points.length);
  }
  return smoothNormals({ vertices: new Float32Array(vertices), indices: new Uint32Array(indices) });
}

// Rounded front/back faces catch studio highlights even with the camera straight on.
function piece(outline: Path, color: string, z = 0): Piece {
  const [left, top, right, bottom] = outline.bounds()!;
  return {
    mesh: createShape(roundedLogoGeometry(outline, z >= 0.1 ? 0.14 : 0.48), {
      shine: 0.78,
      optimize: true,
    }),
    color,
    x: (left + right) / 2,
    y: -(top + bottom) / 2,
    z: z >= 0.1 ? 0.28 + z * 0.3 : z,
  };
}

export function buildLogo(): Piece[] {
  return [0, 1, 2].map((index) => {
    const angle = (index * Math.PI * 2) / 3;
    const diamond: [number, number][] = [
      [0, 0],
      [-0.36, -0.62],
      [0, -1.25],
      [0.36, -0.62],
    ];
    return piece(
      new Path().addPolygon(
        diamond.map(([x, y]) => [
          x * Math.cos(angle) - y * Math.sin(angle),
          x * Math.sin(angle) + y * Math.cos(angle),
        ]),
      ),
      "#E60012",
    );
  });
}

// Three diamonds follow short circular paths and lock into a shared center.
export function drawLogo(world: World, entities: Entity[], pieces: Piece[], time: number) {
  const phase = time % 8;
  const smooth = (value: number) => {
    const t = Math.max(0, Math.min(1, value));
    return t * t * (3 - 2 * t);
  };
  const progress = (delay: number, duration: number) =>
    smooth((phase - 0.1 - delay) / duration) * (1 - smooth((phase - 6.1 - delay * 0.25) / 0.9));
  entities.forEach((entity, index) => {
    const part = pieces[index];
    const p = progress(index * 0.13, 1.3);
    const angle = ((1 - p) * Math.PI) / 3;
    const radius = 1 + (1 - p) * 0.4;
    world.set(entity, {
      position: [
        (part.x * Math.cos(angle) - part.y * Math.sin(angle)) * radius,
        (part.x * Math.sin(angle) + part.y * Math.cos(angle)) * radius,
        part.z + (1 - p) * 0.7,
      ],
      rotation: quat.z(angle),
      scale: Math.max(0.001, p),
    });
  });
}

export default function MitsubishiLogoScene({
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
  const [world, setWorld] = useState<World | null>(null);
  useEffect(() => {
    let cancelled = false;
    let created: World | null = null;
    void warmUpEngine()
      .then(() => {
        if (cancelled) return;
        const pieces = buildLogo();
        const w = new World(16);
        created = w;
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
        setWorld(w);
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          onReady?.();
        }
      });
    return () => {
      cancelled = true;
      // Let GameView stop its renderer before releasing the world it reads.
      queueMicrotask(() => created?.dispose());
    };
  }, []);

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
