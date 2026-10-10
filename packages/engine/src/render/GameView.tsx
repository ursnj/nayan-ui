import { useEffect, useMemo, useRef } from "react";
import { PanResponder, PixelRatio, StyleSheet, View, type ViewStyle } from "react-native";
import { Canvas, useCanvasRef, type CanvasRef } from "react-native-webgpu";
import { defaultCamera, defaultLight, Renderer } from "./Renderer";
import type { Camera, Light, RenderSource } from "../types";
import type { Entity } from "../world/World";

const DEFAULT_BACKGROUND = [0.04, 0.05, 0.09] as const;
const TAP_SLOP = 10; // points a finger may wander and still tap
const TAP_TIME = 300; // ms
const SWIPE_DISTANCE = 30; // points
const SWIPE_SPEED = 0.3; // points per ms

export type GameStats = {
  fps: number;
  /** Mean time spent in `onUpdate` per frame, in milliseconds. */
  updateMs: number;
};

export type SwipeDirection = "left" | "right" | "up" | "down";

export type DragEvent = {
  phase: "start" | "move" | "end";
  /** Finger position in the view, in points. */
  x: number;
  y: number;
  /** Distance moved since the drag started, in points. */
  dx: number;
  dy: number;
};

type Props = {
  /** What to draw (usually a `World`). Changing it restarts the view; never pass a disposed world. */
  source: RenderSource;
  /**
   * Your game loop, called once per frame before drawing, with the elapsed seconds (capped at 0.1).
   * Step your simulation here, e.g. `world.update(dt)`, then read input, spawn, move the camera.
   */
  onUpdate?: (dt: number) => void;
  /** Mutate this object (e.g. `camera.eye`) from `onUpdate`; it is read every frame. */
  camera?: Camera;
  light?: Light;
  /** Sky / clear color, linear 0..1 RGB. Also the fog color. Default dark navy. */
  background?: readonly [number, number, number];
  /** Distance fog density towards `background` (e.g. 0.02). Default 0 (off). */
  fog?: number;
  style?: ViewStyle;
  /** A quick tap, at `x, y` points in the view. `world.pick(x, y)` finds what was tapped. */
  onTap?: (x: number, y: number) => void;
  /** A quick flick in one direction (2048, runners, sliding puzzles). */
  onSwipe?: (direction: SwipeDirection) => void;
  /** Finger down, moving and up (aiming, dragging pieces, slicing). */
  onDrag?: (drag: DragEvent) => void;
  /** Called once a second. */
  onStats?: (stats: GameStats) => void;
  /** GPU setup failures and WebGPU validation errors. Defaults to console.error. */
  onError?: (error: Error) => void;
};

type WithPosition = RenderSource & { worldPosition(e: Entity, out: [number, number, number]): unknown };

export function GameView(props: Props) {
  const { source, camera, light, background, fog, style } = props;
  const ref = useCanvasRef();
  // Latest props, read from the frame loop and touch handlers without restarting them.
  const live = useRef({
    props,
    camera: camera ?? defaultCamera(),
    light: light ?? defaultLight(),
    environment: { background: background ?? DEFAULT_BACKGROUND, fog: fog ?? 0 },
  });
  live.current.props = props;
  if (camera) live.current.camera = camera;
  if (light) live.current.light = light;
  live.current.environment = { background: background ?? DEFAULT_BACKGROUND, fog: fog ?? 0 };

  const touch = useMemo(() => {
    let start = { x: 0, y: 0, time: 0 };
    const drag = (phase: DragEvent["phase"], x: number, y: number) =>
      live.current.props.onDrag?.({ phase, x, y, dx: x - start.x, dy: y - start.y });
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        start = { x: e.nativeEvent.locationX, y: e.nativeEvent.locationY, time: Date.now() };
        drag("start", start.x, start.y);
      },
      onPanResponderMove: (_, g) => drag("move", start.x + g.dx, start.y + g.dy),
      onPanResponderRelease: (_, g) => {
        const x = start.x + g.dx;
        const y = start.y + g.dy;
        drag("end", x, y);
        const { onTap, onSwipe } = live.current.props;
        const distance = Math.hypot(g.dx, g.dy);
        const time = Date.now() - start.time;
        if (distance < TAP_SLOP && time < TAP_TIME) onTap?.(start.x, start.y);
        else if (distance > SWIPE_DISTANCE && distance / Math.max(1, time) > SWIPE_SPEED) {
          onSwipe?.(Math.abs(g.dx) > Math.abs(g.dy) ? (g.dx > 0 ? "right" : "left") : g.dy > 0 ? "down" : "up");
        }
      },
      onPanResponderTerminate: (_, g) => drag("end", start.x + g.dx, start.y + g.dy),
    });
  }, []);

  useEffect(() => {
    let alive = true;
    let raf = 0;
    let device: GPUDevice | undefined;
    const report = (error: unknown) => {
      const e = error instanceof Error ? error : new Error(String(error));
      (live.current.props.onError ?? ((x: Error) => console.error(`GameView: ${x.message}`)))(e);
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
      // Validation errors don't throw in WebGPU; scope the setup and first frame so they surface.
      device.pushErrorScope("validation");
      const renderer = new Renderer(device, context, format, source);
      const followed: [number, number, number] = [0, 0, 0];
      const shaken: Camera = { eye: [0, 0, 0], target: [0, 0, 0], fov: 1 };
      let firstFrame = true;

      let last = 0;
      let frames = 0;
      let fpsStart = 0;
      let updateTime = 0;

      const frame = (now: number) => {
        if (!alive) return;
        if (!last) last = fpsStart = now;
        const dt = Math.min((now - last) / 1000, 0.1);
        last = now;

        const { props: current, camera, light, environment } = live.current;
        const t0 = performance.now();
        current.onUpdate?.(dt);
        updateTime += performance.now() - t0;

        follow(camera, source, followed, dt);
        const view = shake(camera, shaken, dt);

        const ratio = PixelRatio.get();
        const width = Math.max(1, Math.round(canvas.clientWidth * ratio));
        const height = Math.max(1, Math.round(canvas.clientHeight * ratio));
        if (canvas.width !== width) canvas.width = width;
        if (canvas.height !== height) canvas.height = height;
        renderer.render(width, height, view, light, environment);
        source.setView?.(renderer.viewProj, canvas.clientWidth, canvas.clientHeight);
        if (firstFrame) {
          firstFrame = false;
          device!.popErrorScope().then((e) => e && report(new Error(`WebGPU setup: ${e.message}`)), report);
        }

        frames++;
        if (now - fpsStart >= 1000) {
          current.onStats?.({ fps: (frames * 1000) / (now - fpsStart), updateMs: updateTime / frames });
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
    // A new source (e.g. a new round's World) restarts drawing; everything else is read live.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  const touchable = props.onTap || props.onSwipe || props.onDrag;
  return (
    <View style={[styles.canvas, style]} {...(touchable ? touch.panHandlers : undefined)}>
      <Canvas ref={ref} style={styles.canvas} />
    </View>
  );
}

/** `camera.follow`: ease the target toward the entity (where it was last drawn) and keep the eye at the offset. */
function follow(camera: Camera, source: RenderSource, out: [number, number, number], dt: number) {
  const f = camera.follow;
  if (!f || !("worldPosition" in source) || !(source as WithPosition).worldPosition(f.target, out)) return;
  const smoothing = f.smoothing ?? 0.15;
  const k = smoothing > 0 ? 1 - Math.exp(-dt / smoothing) : 1;
  for (let i = 0; i < 3; i++) {
    camera.target[i] = camera.target[i]! + (out[i]! - camera.target[i]!) * k;
    camera.eye[i] = camera.target[i]! + f.offset[i]!;
  }
}

/** `camera.shake`: a jittered copy of the camera; the strength fades by itself. */
function shake(camera: Camera, out: Camera, dt: number): Camera {
  const strength = camera.shake ?? 0;
  if (strength <= 0.001) {
    if (strength) camera.shake = 0;
    return camera;
  }
  camera.shake = strength * Math.exp(-dt * 8);
  out.fov = camera.fov;
  out.ortho = camera.ortho;
  for (let i = 0; i < 3; i++) {
    const jitter = (Math.random() * 2 - 1) * strength;
    out.eye[i] = camera.eye[i]! + jitter;
    out.target[i] = camera.target[i]! + jitter;
  }
  return out;
}

const styles = StyleSheet.create({ canvas: { flex: 1 } });
