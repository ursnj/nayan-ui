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

export function buildLogo(): Piece[] {
  return [
    piece(
      Path.fromSVG(
        "M-1.35 -.15 C-1.65 .7 -1.08 .72 -.54 .48 L1.5 -.55 L-.58 .06 C-1 .2 -1.25 .15 -1.35 -.15 Z",
      ),
      "#FFFFFF",
    ),
  ];
}

// The swoosh draws across the screen from its heel to its tip.
export function drawLogo(
  world: World,
  entities: Entity[],
  pieces: Piece[],
  time: number,
  surface?: HTMLDivElement | null,
) {
  const phase = time % 8;
  const smooth = (value: number) => {
    const t = Math.max(0, Math.min(1, value));
    return t * t * (3 - 2 * t);
  };
  const progress = (delay: number, duration: number) =>
    smooth((phase - 0.1 - delay) / duration) * (1 - smooth((phase - 6.1 - delay * 0.25) / 0.9));
  entities.forEach((entity, index) => {
    const part = pieces[index];
    const p = progress(0.1, 1.5);
    if (surface) {
      // Reveal the actual silhouette without stretching its proportions.
      const frontDepth = part.z + (1 - p) * 0.35 + 0.21;
      const pixelsPerUnit = surface.clientHeight / (2 * (6.5 - frontDepth) * Math.tan(0.8 / 2));
      const edge = (0.5 - p) * (part.mesh.size[0] + 0.04) * pixelsPerUnit;
      surface.dataset.revealWidth = String(
        p === 1 ? surface.clientWidth : surface.clientWidth / 2 - edge,
      );
      surface.style.clipPath = p === 1 ? "none" : `inset(0 calc(50% + ${edge}px) 0 0)`;
    }
    world.set(entity, {
      position: [part.x, part.y, part.z + (1 - p) * 0.35],
      scale: 1,
    });
  });
}

export default function NikeLogoScene({
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
  const surface = useRef<HTMLDivElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const backgroundSampled = useRef(false);
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
    <div ref={backdrop} style={{ width: "100%", height: "100%", backgroundColor: "#11192c" }}>
      <div ref={surface} style={{ width: "100%", height: "100%" }}>
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
            if (!backgroundSampled.current && dt > 0) {
              queueMicrotask(() => {
                // Preserve the rendered stage color outside the swoosh's reveal mask.
                try {
                  const canvas = surface.current?.querySelector("canvas");
                  const sample = document.createElement("canvas");
                  sample.width = sample.height = 1;
                  const context = sample.getContext("2d");
                  if (!canvas || !context || !backdrop.current) return;
                  context.drawImage(canvas, 0, 0, 1, 1, 0, 0, 1, 1);
                  const [r, g, b, alpha] = context.getImageData(0, 0, 1, 1).data;
                  if (alpha !== 255) return;
                  backdrop.current.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
                  backgroundSampled.current = true;
                } catch {
                  /* Keep the solid fallback if readback is unavailable. */
                }
              });
            }
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
            drawLogo(world, entities, pieces, captureTime ?? displayTime.current, surface.current);
            if (captureTime !== undefined) {
              const renderedTime = captureTime;
              queueMicrotask(() => onFrame?.(renderedTime));
            }
          }}
        />
      </div>
    </div>
  );
}
