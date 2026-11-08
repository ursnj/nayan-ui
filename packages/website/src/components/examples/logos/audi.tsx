"use client";

import { useEffect, useRef, useState } from "react";
import {
  GameView,
  createShape,
  tube,
  merge,
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

// Dense contours keep circular silhouettes smooth at high pixel densities.
function circle(cx: number, cy: number, radius: number): [number, number][] {
  return Array.from({ length: 192 }, (_, index) => {
    const angle = (index / 192) * Math.PI * 2;
    return [cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius];
  });
}

// Closed circular sweeps keep the silhouette and reflections smooth at every angle.
export function buildLogo(): Piece[] {
  const mesh = createShape(
    merge([
      {
        geometry: tube(
          circle(0, 0, 0.44).map(([x, y]) => [x, y, 0] as [number, number, number]),
          {
            radius: 0.04,
            sides: 64,
            smoothness: 2,
            closed: true,
          },
        ),
        scale: [1, 1, 2.2],
      },
    ]),
    { shine: 0.8, optimize: true },
  );
  return [-0.96, -0.32, 0.32, 0.96].map((x) => ({ mesh, color: "#E6E8ED", x, y: 0, z: 0 }));
}

// Silver rings glide in from alternating sides and interlock.
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
    const p = progress(index * 0.12, 1.4);
    const side = index % 2 === 0 ? -1 : 1;
    world.set(entity, {
      position: [part.x + side * (1 - p) * 3, part.y, part.z + (1 - p) * 0.5],
      scale: 0.85 + 0.15 * p,
    });
  });
}

export default function AudiLogoScene({
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
