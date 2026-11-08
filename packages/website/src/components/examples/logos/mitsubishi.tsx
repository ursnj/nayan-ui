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
  type Model,
} from "@nayan-ui/engine";

type Piece = { mesh: Model; color: string; x: number; y: number; z: number };

// Build each outline once during setup. Path uses screen coordinates (Y down).
function piece(outline: Path, color: string, z = 0): Piece {
  const [left, top, right, bottom] = outline.bounds()!;
  return {
    mesh: createShape(extrude(outline, { depth: 0.14, fillRule: "evenodd" })),
    color,
    x: (left + right) / 2,
    y: -(top + bottom) / 2,
    z,
  };
}

function buildLogo(): Piece[] {
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

// Assemble, hold, scatter, and hold again over an eight-second loop.
function drawLogo(world: World, entities: Entity[], pieces: Piece[], time: number) {
  const phase = time % 8;
  const ease = (t: number) => 1 - Math.pow(1 - t, 3);
  const clamp = (t: number) => Math.max(0, Math.min(1, t));
  entities.forEach((entity, index) => {
    const part = pieces[index];
    const arrival = clamp((phase - index * 0.1) / 1.6);
    const departure = clamp((phase - 5.2 - index * 0.08) / 1.4);
    const spread = 1 - ease(arrival) + ease(departure);
    const angle = (index * Math.PI * 2) / pieces.length + Math.PI / 4;
    world.set(entity, {
      position: [part.x + Math.cos(angle) * spread, part.y + Math.sin(angle) * spread, part.z],
      rotation: quat.multiply(quat.y(spread * Math.PI * 2), quat.z((spread * Math.PI) / 2)),
      scale: 1 - spread * 0.35,
    });
  });
}

export default function MitsubishiLogoScene({
  playing = true,
  speed = 1,
  replay = 0,
}: {
  playing?: boolean;
  speed?: number;
  replay?: number;
} = {}) {
  const [error, setError] = useState(false);
  const group = useRef<{ entities: Entity[]; pieces: Piece[] }>({ entities: [], pieces: [] });
  const elapsed = useRef(0);
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
        elapsed.current = 0;
        const pieces = buildLogo();
        const entities = pieces.map((part) => w.spawn({ mesh: part.mesh, color: part.color }));
        group.current = { pieces, entities };
        drawLogo(w, entities, pieces, 3);
        setWorld(w);
      })
      .catch(() => {
        if (!cancelled) setError(true);
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
    <GameView
      source={world}
      camera={{ eye: [0, 0, 6.5], target: [0, 0, 0], fov: 0.8 }}
      background="#0B1020"
      light={{ direction: [0, 0, 1], ambient: 0.8, shadows: false }}
      style={{ width: "100%", height: "100%" }}
      onError={() => setError(true)}
      onUpdate={(dt) => {
        const { entities, pieces } = group.current;
        if (lastReplay.current !== replay) {
          elapsed.current = 0;
          lastReplay.current = replay;
          drawLogo(world, entities, pieces, 0);
        }
        if (playing) {
          elapsed.current += dt * speed;
          drawLogo(world, entities, pieces, elapsed.current);
        }
      }}
    />
  );
}
