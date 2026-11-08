"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import type { LogoId } from "./logos";

const loading = () => null;
const SCENES = {
  mercedes: dynamic(() => import("./logos/mercedes"), { ssr: false, loading }),
  cisco: dynamic(() => import("./logos/cisco"), { ssr: false, loading }),
  spotify: dynamic(() => import("./logos/spotify"), { ssr: false, loading }),
  microsoft: dynamic(() => import("./logos/microsoft"), { ssr: false, loading }),
  dropbox: dynamic(() => import("./logos/dropbox"), { ssr: false, loading }),
  figma: dynamic(() => import("./logos/figma"), { ssr: false, loading }),
  target: dynamic(() => import("./logos/target"), { ssr: false, loading }),
  nike: dynamic(() => import("./logos/nike"), { ssr: false, loading }),
  linkedin: dynamic(() => import("./logos/linkedin"), { ssr: false, loading }),
  slack: dynamic(() => import("./logos/slack"), { ssr: false, loading }),
  mitsubishi: dynamic(() => import("./logos/mitsubishi"), { ssr: false, loading }),
  netflix: dynamic(() => import("./logos/netflix"), { ssr: false, loading }),
  audi: dynamic(() => import("./logos/audi"), { ssr: false, loading }),
  adidas: dynamic(() => import("./logos/adidas"), { ssr: false, loading }),
  youtube: dynamic(() => import("./logos/youtube"), { ssr: false, loading }),
  bmw: dynamic(() => import("./logos/bmw"), { ssr: false, loading }),
  google: dynamic(() => import("./logos/google"), { ssr: false, loading }),
  mastercard: dynamic(() => import("./logos/mastercard"), { ssr: false, loading }),
};

type Controls = { playing: boolean; rendering: boolean; speed: number; replay: number };
type ExportJob = {
  index: number;
  pending: boolean;
  frames: Blob[];
  canvas: HTMLCanvasElement;
  context: CanvasRenderingContext2D;
};
const FPS = 15;
const FRAME_COUNT = 8 * FPS;

export default function LogoPreview({ logo }: { logo: LogoId }) {
  const [controls, setControls] = useState<Controls | null>(null);
  const [captureTime, setCaptureTime] = useState<number>();
  const job = useRef<ExportJob | null>(null);
  const abort = useRef<AbortController | null>(null);
  const send = (message: object, transfer: Transferable[] = []) =>
    window.parent.postMessage(message, window.location.origin, transfer);

  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.source !== window.parent || event.origin !== window.location.origin) return;
      if (event.data?.type === "logo-controls") {
        const { playing, speed, replay } = event.data;
        if (
          typeof playing === "boolean" &&
          [0.5, 1, 1.5, 2].includes(speed) &&
          Number.isSafeInteger(replay)
        )
          setControls({ playing, speed, replay, rendering: event.data.rendering !== false });
      }
      if (event.data?.type === "logo-export" && !job.current) {
        const source = document.querySelector("canvas");
        if (!source || source.clientWidth <= 0 || source.clientHeight <= 0) {
          send({ type: "logo-export-error", message: "Open the preview before exporting." });
          return;
        }
        const canvas = document.createElement("canvas");
        const factor = Math.min(640 / source.clientWidth, 360 / source.clientHeight);
        canvas.width = Math.max(1, Math.round(source.clientWidth * factor));
        canvas.height = Math.max(1, Math.round(source.clientHeight * factor));
        const context = canvas.getContext("2d");
        if (!context) {
          send({
            type: "logo-export-error",
            message: "This browser could not capture the animation.",
          });
          return;
        }
        context.imageSmoothingQuality = "high";
        job.current = { index: 0, pending: false, frames: [], canvas, context };
        setCaptureTime(0);
      }
    };
    window.addEventListener("message", receive);
    send({ type: "logo-ready" });
    return () => {
      window.removeEventListener("message", receive);
      abort.current?.abort();
    };
  }, []);

  const captureFrame = (time: number) => {
    const current = job.current;
    const source = document.querySelector("canvas");
    if (
      !current ||
      current.pending ||
      time !== current.index / FPS ||
      !source ||
      source.width === 0
    )
      return;
    current.pending = true;
    const { canvas, context } = current;
    try {
      // Called after the engine's render pass, before the browser clears its drawing buffer.
      context.drawImage(source, 0, 0, 1, 1, 0, 0, canvas.width, canvas.height);
      context.save();
      const reveal = document.querySelector<HTMLElement>("[data-reveal-width]");
      if (reveal) {
        context.beginPath();
        context.rect(
          0,
          0,
          (canvas.width * Math.max(0, Number(reveal.dataset.revealWidth))) / source.clientWidth,
          canvas.height,
        );
        context.clip();
      }
      context.drawImage(
        source,
        0,
        0,
        source.width,
        source.height,
        0,
        0,
        canvas.width,
        canvas.height,
      );
      context.restore();
      canvas.toBlob(async (blob) => {
        if (job.current !== current) return;
        try {
          if (!blob) throw new Error("The animation frame could not be captured.");
          current.frames.push(blob);
          current.index++;
          send({
            type: "logo-export-progress",
            progress: Math.round((current.index / FRAME_COUNT) * 100),
          });
          if (current.index < FRAME_COUNT) {
            current.pending = false;
            setCaptureTime(current.index / FPS);
            return;
          }
          setCaptureTime(undefined);
          const form = new FormData();
          current.frames.forEach((frame, index) => form.append("frames", frame, `${index}.png`));
          form.append("fps", String(FPS));
          abort.current = new AbortController();
          const response = await fetch("/api/examples/logo-webp", {
            method: "POST",
            body: form,
            signal: abort.current.signal,
          });
          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "WebP export failed.");
          }
          const data = await response.arrayBuffer();
          send({ type: "logo-export-complete", data }, [data]);
          job.current = null;
        } catch (error) {
          fail(error);
        }
      }, "image/png");
    } catch (error) {
      fail(error);
    }
  };

  const fail = (error: unknown) => {
    job.current = null;
    setCaptureTime(undefined);
    send({
      type: "logo-export-error",
      message: error instanceof Error ? error.message : "WebP export failed.",
    });
  };
  const Scene = SCENES[logo];
  return (
    <div className="h-dvh bg-[#0B1020]">
      {controls ? (
        <Scene
          {...controls}
          rendering={captureTime !== undefined || controls.rendering}
          captureTime={captureTime}
          onFrame={captureFrame}
          onReady={() => send({ type: "logo-rendered" })}
        />
      ) : null}
    </div>
  );
}
