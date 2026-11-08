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

// Dense contours keep circular silhouettes smooth at high pixel densities.
function circle(cx: number, cy: number, radius: number): [number, number][] {
  return Array.from({ length: 192 }, (_, index) => {
    const angle = (index / 192) * Math.PI * 2;
    return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius];
  });
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
    const lens: [number, number][] = [];
    const angle = Math.acos(0.48);
    for (let i = 0; i <= 48; i++) {
      const theta = -angle + (i / 48) * 2 * angle;
      lens.push([-0.48 + Math.cos(theta), Math.sin(theta)]);
    }
    for (let i = 0; i <= 48; i++) {
      const theta = Math.PI - angle + (i / 48) * 2 * angle;
      lens.push([0.48 + Math.cos(theta), Math.sin(theta)]);
    }
    return [
      piece(new Path().addPolygon(circle(-0.48, 0, 1)), "#EB001B"),
      piece(new Path().addPolygon(circle(0.48, 0, 1)), "#F79E1B", 0.01),
      piece(new Path().addPolygon(lens), "#FF5F00", 0.16),
    ];
  }
}

// Two circles slide together and their orange intersection opens between them.
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
    const p = progress(index === 2 ? 0.75 : 0, 1.15);
    if (index < 2) {
      world.set(entity, {
        position: [
          part.x + (index === 0 ? -1 : 1) * (1 - p) * 1.3,
          part.y,
          part.z + (1 - p) * 0.55,
        ],
        scale: 0.75 + 0.25 * p,
      });
    } else {
      world.set(entity, {
        position: [part.x, part.y, part.z + (1 - p) * 0.55],
        scale: Math.max(0.001, p),
      });
    }
  });
}

export default function MastercardLogoScene({
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
