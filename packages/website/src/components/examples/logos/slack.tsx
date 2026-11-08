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

type Piece = {
  mesh: Model;
  color: string;
  x: number;
  y: number;
  z: number;
};

// Sample each corner densely so small capsules retain a clean outline.
function roundedRect(x: number, y: number, width: number, height: number, radius: number): Path {
  const r = Math.min(radius, width / 2, height / 2);
  const corners = [
    [x + width - r, y + r],
    [x + width - r, y + height - r],
    [x + r, y + height - r],
    [x + r, y + r],
  ];
  const points: [number, number][] = [];
  corners.forEach(([cx, cy], corner) => {
    for (let step = 0; step <= 32; step++) {
      const angle = -Math.PI / 2 + (corner * Math.PI) / 2 + ((step / 32) * Math.PI) / 2;
      points.push([cx + Math.cos(angle) * r, cy + Math.sin(angle) * r]);
    }
  });
  return new Path().addPolygon(points);
}

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

function buildLogo(): Piece[] {
  {
    const bar = (x: number, y: number, w: number, h: number, color: string) =>
      piece(
        roundedRect(x, y, w, h, Math.min(w, h) / 2).transform(0.025, 0.025, -1.25, -1.25),
        color,
      );
    return [
      bar(28, 0, 20, 48, "#36C5F0"),
      bar(0, 28, 20, 20, "#36C5F0"),
      bar(52, 28, 48, 20, "#2EB67D"),
      bar(52, 0, 20, 20, "#2EB67D"),
      bar(52, 52, 20, 48, "#ECB22E"),
      bar(80, 52, 20, 20, "#ECB22E"),
      bar(0, 52, 48, 20, "#E01E5A"),
      bar(28, 80, 20, 20, "#E01E5A"),
    ];
  }
}

// Capsules slide along their axes while dots pop into the gaps.
function drawLogo(world: World, entities: Entity[], pieces: Piece[], time: number) {
  const phase = time % 8;
  const smooth = (value: number) => {
    const t = Math.max(0, Math.min(1, value));
    return t * t * (3 - 2 * t);
  };
  const progress = (delay: number, duration: number) =>
    smooth((phase - 0.1 - delay) / duration) * (1 - smooth((phase - 6.1 - delay * 0.25) / 0.9));
  entities.forEach((entity, index) => {
    const part = pieces[index];
    const p = progress(index * 0.065, 0.9);
    const directions = [
      [0, 1],
      [1, 0],
      [0, -1],
      [-1, 0],
    ];
    const direction = directions[(Math.floor(index / 2) + (index % 2 ? 3 : 0)) % 4];
    const horizontal = part.mesh.size[0] > part.mesh.size[1];
    const dot = index % 2 === 1;
    const grow = Math.max(0.001, p);
    world.set(entity, {
      position: [
        part.x + direction[0] * (1 - p) * 0.65,
        part.y + direction[1] * (1 - p) * 0.65,
        part.z + (1 - p) * 0.5,
      ],
      scale: dot ? grow : horizontal ? [grow, 1, 1] : [1, grow, 1],
    });
  });
}

export default function SlackLogoScene({
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
