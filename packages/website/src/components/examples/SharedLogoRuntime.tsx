"use client";

import { useEffect, useRef, useState } from "react";
import { GameView, World, warmUpEngine, type Camera, type Entity } from "@nayan-ui/engine";
import { LOGOS, type LogoId } from "./logos";
import * as microsoft from "./logos/microsoft";
import * as google from "./logos/google";
import * as slack from "./logos/slack";
import * as netflix from "./logos/netflix";
import * as spotify from "./logos/spotify";
import * as cisco from "./logos/cisco";
import * as adidas from "./logos/adidas";
import * as audi from "./logos/audi";
import * as mastercard from "./logos/mastercard";
import * as target from "./logos/target";
import * as mitsubishi from "./logos/mitsubishi";
import * as youtube from "./logos/youtube";
import * as figma from "./logos/figma";
import * as dropbox from "./logos/dropbox";
import * as linkedin from "./logos/linkedin";
import * as nike from "./logos/nike";
import * as mercedes from "./logos/mercedes";
import * as bmw from "./logos/bmw";
import * as telegram from "./logos/telegram";
import * as zoom from "./logos/zoom";
import * as twitch from "./logos/twitch";
import * as opera from "./logos/opera";
import * as xbox from "./logos/xbox";
import * as stackoverflow from "./logos/stackoverflow";
import * as nayanUI from "./logos/nayan-ui";

type LogoModule = {
  buildLogo: () => microsoft.Piece[];
  drawLogo: (
    world: World,
    entities: Entity[],
    pieces: microsoft.Piece[],
    time: number,
    surface?: HTMLDivElement | null,
  ) => void;
};
const MODULES: Record<LogoId, LogoModule> = {
  microsoft,
  google,
  slack,
  netflix,
  spotify,
  cisco,
  adidas,
  audi,
  mastercard,
  target,
  mitsubishi,
  youtube,
  figma,
  dropbox,
  linkedin,
  nike,
  mercedes,
  bmw,
  telegram,
  zoom,
  twitch,
  opera,
  xbox,
  stackoverflow,
  "nayan-ui": nayanUI,
};
type Group = { pieces: microsoft.Piece[]; entities: Entity[] };
type Session = {
  world: World;
  assets: Map<LogoId, microsoft.Piece[]>;
  active: Group | null;
  selected: LogoId | null;
};
let startup: Promise<Session> | undefined;

// Owned by this playground's browser session, rather than by the selected logo.
function startEngine(): Promise<Session> {
  return (startup ??= warmUpEngine().then(() => {
    // Prepare all meshes before allocating the world's native transform buffers.
    const prepared = LOGOS.map((logo) => ({ id: logo.id, pieces: MODULES[logo.id].buildLogo() }));
    const world = new World(Math.max(16, ...prepared.map((group) => group.pieces.length + 1)));
    const assets = new Map(prepared.map(({ id, pieces }) => [id, pieces]));
    return { world, assets, active: null, selected: null };
  }));
}

type Props = {
  logo: LogoId;
  background: string;
  playing: boolean;
  rendering: boolean;
  speed: number;
  replay: number;
  rotateView: boolean;
  viewReset: number;
  captureTime?: number;
  onFrame: (time: number) => void;
  onReady: () => void;
  onError: () => void;
};

export default function SharedLogoRuntime({
  logo,
  background,
  playing,
  rendering,
  speed,
  replay,
  rotateView,
  viewReset,
  captureTime,
  onFrame,
  onReady,
  onError,
}: Props) {
  const [session, setSession] = useState<Session | null>(null);
  const surface = useRef<HTMLDivElement>(null);
  const elapsed = useRef(0);
  const displayTime = useRef(3);
  const lastReplay = useRef(replay);
  const presented = useRef(false);
  const capturePass = useRef({ time: -1, frames: 0 });
  const camera = useRef<Camera>({ eye: [0, 0, 6.5], target: [0, 0, 0], fov: 0.8 }).current;
  const orbit = useRef({ yaw: 0, pitch: 0 });
  const dragStart = useRef({ yaw: 0, pitch: 0 });
  const errorCallback = useRef(onError);
  errorCallback.current = onError;

  useEffect(() => {
    orbit.current = { yaw: 0, pitch: 0 };
    camera.eye = [0, 0, 6.5];
  }, [logo, rotateView, viewReset, camera]);

  useEffect(() => {
    let active = true;
    void startEngine()
      .then((value) => {
        if (active) setSession(value);
      })
      .catch(() => {
        if (active) errorCallback.current();
      });
    return () => {
      active = false;
    };
  }, []);

  if (!session) return null;
  const { world, assets } = session;
  return (
    <div style={{ width: "100%", height: "100%", backgroundColor: background }}>
      <div
        ref={surface}
        role={rotateView ? "group" : undefined}
        aria-label={
          rotateView ? "Rotate logo: drag or use arrow keys; Home returns to front view" : undefined
        }
        tabIndex={rotateView ? 0 : -1}
        style={{ width: "100%", height: "100%", cursor: rotateView ? "grab" : "default" }}
        onKeyDown={(event) => {
          if (!rotateView || captureTime !== undefined) return;
          const angle = orbit.current;
          if (event.key === "Home") orbit.current = { yaw: 0, pitch: 0 };
          else if (event.key === "ArrowLeft") angle.yaw -= 0.12;
          else if (event.key === "ArrowRight") angle.yaw += 0.12;
          else if (event.key === "ArrowUp") angle.pitch = Math.min(1.25, angle.pitch + 0.12);
          else if (event.key === "ArrowDown") angle.pitch = Math.max(-1.25, angle.pitch - 0.12);
          else return;
          event.preventDefault();
        }}
      >
        <GameView
          source={world}
          camera={camera}
          quality="high"
          adaptQuality={false}
          paused={!rendering}
          background={background}
          light={{ direction: [-3, 5, 7], ambient: 0.42, shadows: false }}
          style={{ width: "100%", height: "100%" }}
          onError={onError}
          onDrag={
            rotateView
              ? (event) => {
                  if (captureTime !== undefined) return;
                  if (event.phase === "start") dragStart.current = { ...orbit.current };
                  if (event.phase === "move") {
                    orbit.current = {
                      yaw: dragStart.current.yaw - event.dx * 0.009,
                      pitch: Math.max(
                        -1.25,
                        Math.min(1.25, dragStart.current.pitch + event.dy * 0.009),
                      ),
                    };
                  }
                }
              : undefined
          }
          onUpdate={(dt) => {
            const { yaw, pitch } = orbit.current;
            camera.eye = [
              6.5 * Math.sin(yaw) * Math.cos(pitch),
              6.5 * Math.sin(pitch),
              6.5 * Math.cos(yaw) * Math.cos(pitch),
            ];
            if (session.selected !== logo) {
              session.active?.entities.forEach((entity) => world.despawn(entity));
              const pieces = assets.get(logo)!;
              const entities = pieces.map((piece) =>
                world.spawn({ mesh: piece.mesh, color: piece.color }),
              );
              session.active = { pieces, entities };
              session.selected = logo;
              elapsed.current = 0;
              displayTime.current = playing ? 0 : 3;
              lastReplay.current = replay;
              if (surface.current) {
                surface.current.style.clipPath = "none";
                delete surface.current.dataset.revealWidth;
              }
            }
            const group = session.active!;
            if (lastReplay.current !== replay) {
              elapsed.current = 0;
              displayTime.current = 0;
              lastReplay.current = replay;
            }
            if (captureTime === undefined && playing) {
              elapsed.current += dt * speed;
              displayTime.current = elapsed.current;
            }
            MODULES[logo].drawLogo(
              world,
              group.entities,
              group.pieces,
              captureTime ?? displayTime.current,
              surface.current,
            );
            if (captureTime !== undefined) {
              const time = captureTime;
              if (capturePass.current.time !== time) capturePass.current = { time, frames: 0 };
              // Present the deterministic pose twice before reading a high-quality GPU frame.
              if (++capturePass.current.frames >= 2) queueMicrotask(() => onFrame(time));
            }
            if (!presented.current && dt > 0) {
              presented.current = true;
              onReady();
            }
          }}
        />
      </div>
    </div>
  );
}
