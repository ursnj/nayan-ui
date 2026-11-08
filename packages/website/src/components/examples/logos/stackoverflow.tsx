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

function bar(cx: number, cy: number, angle: number): Path {
  const c = Math.cos(angle),
    s = Math.sin(angle);
  return new Path().addPolygon(
    [
      [-0.57, -0.1],
      [0.57, -0.1],
      [0.57, 0.1],
      [-0.57, 0.1],
    ].map(([x, y]) => [cx + x * c - y * s, cy + x * s + y * c]),
  );
}

export function buildLogo(): Piece[] {
  return [
    piece(
      new Path().addPolygon([
        [-0.92, 0.56],
        [-0.7, 0.56],
        [-0.7, 1.04],
        [0.7, 1.04],
        [0.7, 0.56],
        [0.92, 0.56],
        [0.92, 1.26],
        [-0.92, 1.26],
      ]),
      "#BBC0C4",
    ),
    ...[0, 1, 2, 3, 4].map((index) =>
      piece(bar(index * 0.08, 0.77 - index * 0.37, (-index * 12 * Math.PI) / 180), "#F48024"),
    ),
  ];
}

// Five orange bars fan upward from a stack while a gray bracket anchors the mark.
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
    const p = progress(index === 0 ? 0 : (index - 1) * 0.12 + 0.15, 1.05);
    if (index === 0) {
      world.set(entity, {
        position: [part.x, part.y - (1 - p) * 0.2, part.z],
        scale: [1, Math.max(0.001, p), 1],
      });
    } else {
      const angle = ((index - 1) * 12 * Math.PI) / 180;
      world.set(entity, {
        position: [part.x * p, -0.77 + (part.y + 0.77) * p, part.z + (1 - p) * 0.12],
        rotation: quat.z(-angle * (1 - p)),
        scale: 0.96 + p * 0.04,
      });
    }
  });
}

export default function StackOverflowLogoScene({
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
