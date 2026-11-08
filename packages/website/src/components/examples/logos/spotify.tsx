"use client";

import { useEffect, useRef, useState } from "react";
import {
  GameView,
  Path,
  createShape,
  extrude,
  World,
  warmUpEngine,
  type Entity,
  type Model,
} from "@nayan-ui/engine";

type Piece = {
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
    mesh: createShape(extrude(outline, { depth: 0.14, fillRule: "evenodd" })),
    color,
    x: (left + right) / 2,
    y: -(top + bottom) / 2,
    z,
  };
}

function buildLogo(): Piece[] {
  return [
    piece(new Path().addCircle(0, 0, 1.2), "#1DB954"),
    piece(
      Path.fromSVG(
        "M-.82 -.40 Q0 -.78 .82 -.34 Q.94 -.25 .81 -.15 Q0 -.55 -.75 -.21 Q-.9 -.17 -.82 -.40 Z",
      ),
      "#081C12",
      0.16,
    ),
    piece(
      Path.fromSVG(
        "M-.70 -.02 Q0 -.32 .70 .04 Q.80 .14 .66 .21 Q0 -.10 -.64 .16 Q-.78 .18 -.70 -.02 Z",
      ),
      "#081C12",
      0.16,
    ),
    piece(
      Path.fromSVG(
        "M-.58 .34 Q0 .10 .57 .40 Q.65 .48 .53 .55 Q0 .31 -.53 .49 Q-.65 .49 -.58 .34 Z",
      ),
      "#081C12",
      0.16,
    ),
  ];
}

// The green disc opens and sound waves expand from its center, then gently pulse.
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
    const p = progress(index === 0 ? 0 : 0.7 + index * 0.1, index === 0 ? 0.7 : 0.65);
    const pulse = phase > 3.4 && phase < 5.4 ? Math.sin(((phase - 3.4) * Math.PI) / 2) ** 2 : 0;
    if (index === 0) {
      world.set(entity, { position: [part.x, part.y, part.z], scale: Math.max(0.001, p) });
    } else {
      world.set(entity, {
        position: [part.x, part.y + pulse * Math.sin(index * 1.3) * 0.035, part.z],
        scale: [Math.max(0.001, p), Math.max(0.001, p) * (1 + pulse * 0.1 * Math.sin(index)), 1],
      });
    }
  });
}

export default function SpotifyLogoScene({
  playing = true,
  speed = 1,
  replay = 0,
  onReady,
}: {
  playing?: boolean;
  speed?: number;
  replay?: number;
  onReady?: () => void;
} = {}) {
  const [error, setError] = useState(false);
  const group = useRef<{ entities: Entity[]; pieces: Piece[] }>({ entities: [], pieces: [] });
  const elapsed = useRef(0);
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
        camera={{ eye: [0, 0, 6.5], target: [0, 0, 0], fov: 0.8 }}
        background="#0B1020"
        light={{ direction: [0, 0, 1], ambient: 0.8, shadows: false }}
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
            drawLogo(world, entities, pieces, playing ? 0 : 3);
          }
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
    </div>
  );
}
