import { useEffect, useRef } from "react";
import { PixelRatio, StyleSheet, type ViewStyle } from "react-native";
import { Canvas, useCanvasRef, type CanvasRef } from "react-native-webgpu";
import { defaultCamera, defaultLight, Renderer } from "./Renderer";
import type { Camera, Light, RenderSource } from "./types";

export type GameStats = {
  fps: number;
  /** Mean time spent in `onUpdate` per frame, in milliseconds. */
  updateMs: number;
};

type Props = {
  /** What to draw (usually a `World`). Fixed for the lifetime of the view. */
  source: RenderSource;
  /**
   * Your game loop, called once per frame before drawing, with the elapsed seconds (capped at 0.1).
   * Step your simulation here, e.g. `world.update(dt)`, then read input, spawn, move the camera.
   */
  onUpdate?: (dt: number) => void;
  /** Mutate this object (e.g. `camera.eye`) from `onUpdate`; it is read every frame. */
  camera?: Camera;
  light?: Light;
  style?: ViewStyle;
  /** Called once a second. */
  onStats?: (stats: GameStats) => void;
  /** GPU setup failures and WebGPU validation errors. Defaults to console.error. */
  onError?: (error: Error) => void;
};

export function GameView({ source, onUpdate, camera, light, style, onStats, onError }: Props) {
  const ref = useCanvasRef();
  // Latest props, read from the frame loop without restarting it.
  const live = useRef({
    onUpdate,
    onStats,
    onError,
    camera: camera ?? defaultCamera(),
    light: light ?? defaultLight(),
  });
  live.current.onUpdate = onUpdate;
  live.current.onStats = onStats;
  live.current.onError = onError;
  if (camera) live.current.camera = camera;
  if (light) live.current.light = light;

  useEffect(() => {
    let alive = true;
    let raf = 0;
    let device: GPUDevice | undefined;
    const report = (error: unknown) => {
      const e = error instanceof Error ? error : new Error(String(error));
      (live.current.onError ?? ((x: Error) => console.error(`GameView: ${x.message}`)))(e);
    };

    (async () => {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter || !alive) return;
      device = await adapter.requestDevice();
      if (!alive) {
        device.destroy(); // unmounted while we were waiting
        return;
      }
      device.onuncapturederror = (event) => report(new Error(`WebGPU: ${event.error.message}`));
      device.lost.then((info) => {
        if (alive && info.reason !== "destroyed") console.warn(`GameView: GPU device lost (${info.message})`);
      });
      const context = ref.current?.getContext("webgpu");
      if (!context) return;

      const format = navigator.gpu.getPreferredCanvasFormat();
      context.configure({ device, format, alphaMode: "opaque" });
      const canvas = context.canvas as unknown as ReturnType<CanvasRef["getNativeSurface"]>;
      const renderer = new Renderer(device, context, format, source);

      let last = 0;
      let frames = 0;
      let fpsStart = 0;
      let updateTime = 0;

      const frame = (now: number) => {
        if (!alive) return;
        if (!last) last = fpsStart = now;
        const dt = Math.min((now - last) / 1000, 0.1);
        last = now;

        const { onUpdate, onStats, camera, light } = live.current;
        const t0 = performance.now();
        onUpdate?.(dt);
        updateTime += performance.now() - t0;

        const ratio = PixelRatio.get();
        const width = Math.max(1, Math.round(canvas.clientWidth * ratio));
        const height = Math.max(1, Math.round(canvas.clientHeight * ratio));
        if (canvas.width !== width) canvas.width = width;
        if (canvas.height !== height) canvas.height = height;
        renderer.render(width, height, camera, light);

        frames++;
        if (now - fpsStart >= 1000) {
          onStats?.({ fps: (frames * 1000) / (now - fpsStart), updateMs: updateTime / frames });
          frames = 0;
          updateTime = 0;
          fpsStart = now;
        }
        raf = requestAnimationFrame(frame);
      };
      raf = requestAnimationFrame(frame);
    })().catch(report);

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      device?.destroy(); // frees every GPU resource the renderer created
    };
    // The source is fixed for the lifetime of the view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <Canvas ref={ref} style={[styles.canvas, style]} />;
}

const styles = StyleSheet.create({ canvas: { flex: 1 } });
