import { useEffect } from "react";
import { PixelRatio, StyleSheet, type ViewStyle } from "react-native";
import { Canvas, useCanvasRef, type CanvasRef } from "react-native-webgpu";
import { Renderer } from "./Renderer";
import type { Simulation } from "./types";

export type GameStats = {
  fps: number;
  /** Mean time spent in `simulation.update()` per frame, in milliseconds. */
  updateMs: number;
};

type Props = {
  simulation: Simulation;
  style?: ViewStyle;
  /** Called once a second. */
  onStats?: (stats: GameStats) => void;
};

export function GameView({ simulation, style, onStats }: Props) {
  const ref = useCanvasRef();

  useEffect(() => {
    let alive = true;
    let raf = 0;

    (async () => {
      const adapter = await navigator.gpu.requestAdapter();
      if (!adapter || !alive) return;
      const device = await adapter.requestDevice();
      const context = ref.current?.getContext("webgpu");
      if (!context || !alive) return;

      const format = navigator.gpu.getPreferredCanvasFormat();
      context.configure({ device, format, alphaMode: "opaque" });
      const canvas = context.canvas as unknown as ReturnType<CanvasRef["getNativeSurface"]>;
      const renderer = new Renderer(device, context, format, simulation);

      let last = 0;
      let frames = 0;
      let fpsStart = 0;
      let updateTime = 0;

      const frame = (now: number) => {
        if (!alive) return;
        if (!last) last = fpsStart = now;
        const dt = Math.min((now - last) / 1000, 0.1);
        last = now;

        const t0 = performance.now();
        simulation.update(dt);
        updateTime += performance.now() - t0;
        const ratio = PixelRatio.get();
        const width = Math.max(1, Math.round(canvas.clientWidth * ratio));
        const height = Math.max(1, Math.round(canvas.clientHeight * ratio));
        if (canvas.width !== width) canvas.width = width;
        if (canvas.height !== height) canvas.height = height;
        renderer.render(width, height, now / 1000);

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
    })();

    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
    // The simulation is fixed for the lifetime of the view.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <Canvas ref={ref} style={[styles.canvas, style]} />;
}

const styles = StyleSheet.create({ canvas: { flex: 1 } });
