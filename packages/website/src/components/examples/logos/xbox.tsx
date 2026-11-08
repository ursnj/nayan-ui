"use client";

import { useEffect, useRef, useState } from "react";
import {
  GameView,
  Path,
  createShape,
  extrude,
  quat,
  World,
  warmUpEngine,
  type Entity,
  type Camera,
  type Model,
} from "@nayan-ui/engine";

export type Piece = {
  mesh: Model;
  color: string;
  x: number;
  y: number;
  z: number;
};

// Build each outline once during setup. Path uses screen coordinates (Y down).
function piece(outline: Path, color: string, z = 0): Piece {
  const [left, top, right, bottom] = outline.bounds()!;
  return {
    mesh: createShape(extrude(outline, { depth: z >= 0.1 ? 0.12 : 0.42, fillRule: "evenodd" }), {
      shine: 0.3,
    }),
    color,
    x: (left + right) / 2,
    y: -(top + bottom) / 2,
    z: z >= 0.1 ? 0.28 + z * 0.3 : z,
  };
}

function circle(cx: number, cy: number, radiusX: number, radiusY = radiusX): [number, number][] {
  return Array.from({ length: 192 }, (_, index) => {
    const angle = (index / 192) * Math.PI * 2;
    return [cx + Math.cos(angle) * radiusX, cy + Math.sin(angle) * radiusY];
  });
}

// Round the ends to meet the disc without protruding beyond its silhouette.
function crossBand(angle: number): Path {
  const radius = 1.16;
  const halfAngle = Math.asin(0.14 / radius);
  const points: [number, number][] = [];
  for (const center of [angle, angle + Math.PI]) {
    for (let step = 0; step <= 32; step++) {
      const t = center - halfAngle + (step / 32) * halfAngle * 2;
      points.push([Math.cos(t) * radius, Math.sin(t) * radius]);
    }
  }
  return new Path().addPolygon(points);
}

export function buildLogo(): Piece[] {
  return [
    piece(new Path().addPolygon(circle(0, 0, 1.2)), "#107C10"),
    piece(crossBand(Math.PI / 4), "#FFFFFF", 0.16),
    piece(crossBand(-Math.PI / 4), "#FFFFFF", 0.18),
  ];
}

// A green disc turns forward as two white blades cross into the Xbox mark.
export function drawLogo(world: World, entities: Entity[], pieces: Piece[], time: number) {
  const phase = time % 8;
  const ease = (value: number) => {
    const t = Math.max(0, Math.min(1, value));
    return t * t * t * (t * (t * 6 - 15) + 10);
  };
  const progress = (delay: number, duration: number) =>
    ease((phase - 0.12 - delay) / duration) *
    (1 - ease((phase - 6.3 - Math.max(0, 0.35 - delay * 0.3)) / 0.75));
  entities.forEach((entity, index) => {
    const part = pieces[index];
    const p = progress(index === 0 ? 0 : 0.42 + index * 0.08, 1);
    if (index === 0) {
      world.set(entity, {
        position: [part.x, part.y, part.z + (1 - p) * 0.4],
        rotation: quat.y((1 - p) * 0.6),
        scale: 1,
      });
    } else {
      const side = index === 1 ? -1 : 1;
      world.set(entity, {
        position: [part.x + side * (1 - p) * 0.45, part.y + (1 - p) * 0.2, part.z + (1 - p) * 0.16],
        rotation: quat.z(side * (1 - p) * 0.18),
        scale: Math.max(0.001, p),
      });
    }
  });
}

export default function XboxLogoScene({
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
        const pieces = buildLogo();
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
