"use client";

import { useRef, useState } from "react";
import {
  GameView,
  type World,
  useWorld,
  quat,
  createShape,
  tube,
  merge,
  shapeGeometry,
  recolor,
  type Model,
  type Entity,
  type Camera,
} from "@nayan-ui/engine";

export type Piece = { mesh: Model; color: string; x: number; y: number; z: number };
type Point = [number, number, number];
type RGB = [number, number, number];

function rgb(hex: string): RGB {
  return [
    parseInt(hex.slice(1, 3), 16) / 255,
    parseInt(hex.slice(3, 5), 16) / 255,
    parseInt(hex.slice(5, 7), 16) / 255,
  ];
}

function gradient(points: Point[], colors: [string, string, string]): Piece {
  const radius = 0.21;
  const geometry = merge([
    { geometry: tube(points, { radius, sides: 32, smoothness: 2, caps: false }) },
    { geometry: shapeGeometry("sphere"), position: points[0], scale: radius * 2 },
    { geometry: shapeGeometry("sphere"), position: points[points.length - 1], scale: radius * 2 },
  ]);
  const stops = colors.map(rgb);
  recolor(geometry, ({ position }) => {
    const t = Math.max(0, Math.min(1, 0.5 - position[1] / 2.35));
    const segment = t < 0.5 ? 0 : 1;
    const blend = t < 0.5 ? t * 2 : (t - 0.5) * 2;
    return [0, 1, 2].map(
      (channel) => stops[segment][channel] * (1 - blend) + stops[segment + 1][channel] * blend,
    ) as RGB;
  });
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;
  for (let offset = 0; offset < geometry.vertices.length; offset += 11) {
    minX = Math.min(minX, geometry.vertices[offset]);
    maxX = Math.max(maxX, geometry.vertices[offset]);
    minY = Math.min(minY, geometry.vertices[offset + 1]);
    maxY = Math.max(maxY, geometry.vertices[offset + 1]);
  }
  return {
    mesh: createShape(geometry, { shine: 0.6 }),
    color: "#FFFFFF",
    x: (minX + maxX) / 2,
    y: (minY + maxY) / 2,
    z: 0,
  };
}

export function buildLogo(): Piece[] {
  // Match the gradient brackets and slash in public/nayan-ui.png (also public/logo.webp).
  const left: Point[] = [];
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    left.push([-0.78 - 0.44 * t, 0.72 - 0.44 * t, 0]);
  }
  for (let i = 1; i <= 16; i++) {
    const t = i / 16,
      u = 1 - t;
    left.push([u * u * -1.22 + 2 * u * t * -1.56 + t * t * -1.22, u * u * 0.28 - t * t * 0.28, 0]);
  }
  for (let i = 1; i <= 8; i++) {
    const t = i / 8;
    left.push([-1.22 + 0.44 * t, -0.28 - 0.44 * t, 0]);
  }
  const slash: Point[] = Array.from({ length: 25 }, (_, i) => [
    0.28 - (i / 24) * 0.56,
    0.96 - (i / 24) * 1.92,
    0,
  ]);
  return [
    gradient(left, ["#00DDED", "#2578FF", "#9600F5"]),
    gradient(slash, ["#00DDEB", "#3157FF", "#9200F5"]),
    gradient(
      left.map(([x, y, z]) => [-x, y, z]),
      ["#FFCC21", "#FF522B", "#EC008F"],
    ),
  ];
}

// Code brackets close around a rising gradient slash to form the site's own mark.
export function drawLogo(world: World, entities: Entity[], pieces: Piece[], time: number) {
  const phase = time % 8;
  const ease = (value: number) => {
    const t = Math.max(0, Math.min(1, value));
    return t * t * t * (t * (t * 6 - 15) + 10);
  };
  entities.forEach((entity, index) => {
    const part = pieces[index],
      delay = index === 1 ? 0.28 : 0;
    const p =
      ease((phase - 0.12 - delay) / 1.1) *
      (1 - ease((phase - 6.3 - Math.max(0, 0.35 - delay * 0.3)) / 0.75));
    const side = index === 0 ? -1 : 1;
    world.set(entity, {
      position: [
        part.x + (index === 1 ? 0 : side * (1 - p) * 0.5),
        part.y - (index === 1 ? (1 - p) * 0.9 : 0),
        part.z + (1 - p) * 0.22,
      ],
      rotation: index === 1 ? quat.z((1 - p) * -0.1) : quat.y(side * (1 - p) * 1.05),
      scale: index === 1 ? [p, p, p] : p,
    });
  });
}

export default function NayanUILogoScene({
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
