import { useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { PanResponder, PixelRatio, Platform, StyleSheet, View, type ViewStyle } from "react-native";
import { Canvas, useCanvasRef, type CanvasRef } from "react-native-webgpu";
import { GLRenderer } from "./GLRenderer";
import { AutoQuality, QUALITY_LEVELS, type Quality, type QualitySetting } from "./quality";
import { defaultCamera, defaultLight, Renderer } from "./Renderer";
import type { Camera, Light, RenderSource } from "../types";
import type { Entity } from "../world/World";

const DEFAULT_BACKGROUND = [0.04, 0.05, 0.09] as const;
const TAP_SLOP = 10; // points a finger may wander and still tap
const TAP_TIME = 300; // ms
const SWIPE_DISTANCE = 30; // points
const SWIPE_SPEED = 0.3; // points per ms
const LONG_PRESS_TIME = 500; // ms

type GLViewProps = { style?: ViewStyle; onContextCreate: (gl: unknown) => void };
/** expo-gl's view, when installed: the OpenGL ES fallback for Android GPUs without WebGPU. */
const GLView: ComponentType<GLViewProps> | undefined = (() => {
  try {
    return require("expo-gl").GLView;
  } catch {
    return undefined;
  }
})();

export type GameStats = {
  fps: number;
  /** Mean time spent in `onUpdate` per frame, in milliseconds. */
  updateMs: number;
  /** The quality level drawn with (with `quality="auto"`, the one it settled on so far). */
  quality: Quality;
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
  /** On "end": the drag was interrupted (a second finger started a pinch, or the system took the touch). Put a held piece back. */
  cancelled?: boolean;
};

export type PinchEvent = {
  phase: "start" | "move" | "end";
  /** Finger spread relative to the start: 2 = twice as far apart (zoom in). */
  scale: number;
  /** Radians the two fingers turned since the start, clockwise on screen. */
  rotation: number;
  /** Midpoint between the fingers in the view, in points. */
  x: number;
  y: number;
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
  /**
   * Resolution, anti-aliasing and shadow quality. "auto" (default) starts at "medium" and steps down
   * while the game can't hold 60 fps, so it stays smooth on low-end phones.
   */
  quality?: QualitySetting;
  style?: ViewStyle;
  /** A quick tap, at `x, y` points in the view. `world.pick(x, y)` finds what was tapped. */
  onTap?: (x: number, y: number) => void;
  /** A quick flick in one direction (2048, runners, sliding puzzles). */
  onSwipe?: (direction: SwipeDirection) => void;
  /** Finger down, moving and up (aiming, dragging pieces, slicing). */
  onDrag?: (drag: DragEvent) => void;
  /** A finger held still for half a second (pick up, show moves). No tap follows. */
  onLongPress?: (x: number, y: number) => void;
  /** Two fingers spreading, pinching or turning (zoom and rotate a board). Ends any drag in progress. */
  onPinch?: (pinch: PinchEvent) => void;
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
    let origin = { x: 0, y: 0 }; // the view's top-left on the page, to place a second finger
    let mode: "drag" | "pinch" | "none" = "none";
    let pinch0 = { distance: 1, angle: 0 };
    let lastPinch: PinchEvent = { phase: "end", scale: 1, rotation: 0, x: 0, y: 0 };
    let longPress: ReturnType<typeof setTimeout> | undefined;
    let longPressed = false;
    const drag = (phase: DragEvent["phase"], x: number, y: number, cancelled?: boolean) =>
      live.current.props.onDrag?.({ phase, x, y, dx: x - start.x, dy: y - start.y, ...(cancelled && { cancelled }) });
    type Touch = { pageX: number; pageY: number };
    const twoFingers = (touches: readonly Touch[], phase: PinchEvent["phase"]) => {
      const [a, b] = touches as [Touch, Touch];
      const distance = Math.max(1, Math.hypot(b.pageX - a.pageX, b.pageY - a.pageY));
      const angle = Math.atan2(b.pageY - a.pageY, b.pageX - a.pageX);
      if (phase === "start") pinch0 = { distance, angle };
      lastPinch = {
        phase,
        scale: distance / pinch0.distance,
        rotation: angle - pinch0.angle,
        x: (a.pageX + b.pageX) / 2 - origin.x,
        y: (a.pageY + b.pageY) / 2 - origin.y,
      };
      live.current.props.onPinch?.(lastPinch);
    };
    const stopLongPress = () => {
      clearTimeout(longPress);
      longPress = undefined;
    };
    const responder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const { locationX, locationY, pageX, pageY } = e.nativeEvent;
        start = { x: locationX, y: locationY, time: Date.now() };
        origin = { x: pageX - locationX, y: pageY - locationY };
        mode = "drag";
        longPressed = false;
        drag("start", start.x, start.y);
        if (live.current.props.onLongPress) {
          longPress = setTimeout(() => {
            longPress = undefined;
            if (mode !== "drag") return;
            longPressed = true;
            live.current.props.onLongPress?.(start.x, start.y);
          }, LONG_PRESS_TIME);
        }
      },
      onPanResponderMove: (e, g) => {
        const touches = e.nativeEvent.touches;
        if (touches.length >= 2 && live.current.props.onPinch) {
          if (mode === "drag") {
            stopLongPress();
            drag("end", start.x + g.dx, start.y + g.dy, true);
            mode = "pinch";
            twoFingers(touches, "start");
          } else if (mode === "pinch") {
            twoFingers(touches, "move");
          }
          return;
        }
        if (mode !== "drag") return; // one finger left after a pinch: wait for it to lift
        if (Math.hypot(g.dx, g.dy) >= TAP_SLOP) stopLongPress();
        drag("move", start.x + g.dx, start.y + g.dy);
      },
      onPanResponderRelease: (_, g) => {
        stopLongPress();
        const was = mode;
        mode = "none";
        if (was === "pinch") {
          live.current.props.onPinch?.({ ...lastPinch, phase: "end" });
          return;
        }
        const x = start.x + g.dx;
        const y = start.y + g.dy;
        drag("end", x, y);
        if (longPressed) return;
        const { onTap, onSwipe } = live.current.props;
        const distance = Math.hypot(g.dx, g.dy);
        const time = Date.now() - start.time;
        if (distance < TAP_SLOP && time < TAP_TIME) onTap?.(start.x, start.y);
        else if (distance > SWIPE_DISTANCE && distance / Math.max(1, time) > SWIPE_SPEED) {
          onSwipe?.(Math.abs(g.dx) > Math.abs(g.dy) ? (g.dx > 0 ? "right" : "left") : g.dy > 0 ? "down" : "up");
        }
      },
      onPanResponderTerminate: (_, g) => {
        stopLongPress();
        const was = mode;
        mode = "none";
        if (was === "pinch") live.current.props.onPinch?.({ ...lastPinch, phase: "end" });
        else if (was === "drag") drag("end", start.x + g.dx, start.y + g.dy, true);
      },
    });
    return { responder, dispose: stopLongPress };
  }, []);
  useEffect(() => touch.dispose, [touch]);

  // Android GPUs without WebGPU (no adapter even in compatibility mode) draw with OpenGL ES instead.
  const [useGL, setUseGL] = useState(false);
  const [gl, setGL] = useState<WebGL2RenderingContext | null>(null);
  const size = useRef({ width: 1, height: 1 });

  const report = (error: unknown) => {
    const e = error instanceof Error ? error : new Error(String(error));
    (live.current.props.onError ?? ((x: Error) => console.error(`GameView: ${x.message}`)))(e);
  };

  /** Runs the game loop: update, camera, quality, draw, stats. Returns a stop function. */
  const startLoop = (
    renderer: Pick<Renderer, "render" | "setQuality" | "viewProj">,
    resize: (ratio: number) => { width: number; height: number; clientWidth: number; clientHeight: number },
    onFirstFrame?: () => void,
  ) => {
    let alive = true;
    let raf = 0;
    const auto = new AutoQuality();
    const chosen = () => {
      const setting = live.current.props.quality ?? "auto";
      return setting === "auto" ? auto.quality : setting;
    };
    let quality = chosen();
    renderer.setQuality(QUALITY_LEVELS[quality]);
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

      const next = chosen();
      if (next !== quality) {
        quality = next;
        renderer.setQuality(QUALITY_LEVELS[quality]);
      }
      // Phones' GPUs are fill-rate bound: cap the pixels drawn rather than match a 3x+ screen.
      const { width, height, clientWidth, clientHeight } = resize(Math.min(PixelRatio.get(), QUALITY_LEVELS[quality].maxPixelRatio));
      renderer.render(width, height, view, light, environment);
      source.setView?.(renderer.viewProj, clientWidth, clientHeight);
      if (firstFrame) {
        firstFrame = false;
        onFirstFrame?.();
      }

      frames++;
      if (now - fpsStart >= 1000) {
        auto.report(now, (now - fpsStart) / frames);
        current.onStats?.({ fps: (frames * 1000) / (now - fpsStart), updateMs: updateTime / frames, quality });
        frames = 0;
        updateTime = 0;
        fpsStart = now;
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  };

  useEffect(() => {
    if (useGL) return;
    let alive = true;
    let stop: (() => void) | undefined;
    let device: GPUDevice | undefined;

    (async () => {
      // Older GPUs (e.g. PowerVR GE8322) miss WebGPU core limits; fall back to compatibility mode.
      const adapter =
        (await navigator.gpu.requestAdapter()) ??
        (await navigator.gpu.requestAdapter({ featureLevel: "compatibility" } as GPURequestAdapterOptions));
      if (!alive) return;
      if (!adapter) {
        if (Platform.OS === "android" && GLView) setUseGL(true);
        else report(new Error("no WebGPU adapter: this device's GPU doesn't support WebGPU"));
        return;
      }
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
      const quality = live.current.props.quality;
      const renderer = new Renderer(device, context, format, source, QUALITY_LEVELS[!quality || quality === "auto" ? "medium" : quality]);
      const gpu = device;
      stop = startLoop(
        renderer,
        (ratio) => {
          const width = Math.max(1, Math.round(canvas.clientWidth * ratio));
          const height = Math.max(1, Math.round(canvas.clientHeight * ratio));
          if (canvas.width !== width) canvas.width = width;
          if (canvas.height !== height) canvas.height = height;
          return { width, height, clientWidth: canvas.clientWidth, clientHeight: canvas.clientHeight };
        },
        () => gpu.popErrorScope().then((e) => e && report(new Error(`WebGPU setup: ${e.message}`)), report),
      );
    })().catch(report);

    return () => {
      alive = false;
      stop?.();
      device?.destroy(); // frees every GPU resource the renderer created
    };
    // A new source (e.g. a new round's World) restarts drawing; everything else is read live.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, useGL]);

  useEffect(() => {
    if (!gl) return;
    let renderer: GLRenderer | undefined;
    let stop: (() => void) | undefined;
    try {
      const quality = live.current.props.quality;
      renderer = new GLRenderer(gl, source, QUALITY_LEVELS[!quality || quality === "auto" ? "medium" : quality]);
      // Same quality levels as WebGPU: drawn offscreen at the level's pixel ratio, scaled up to the screen.
      stop = startLoop(
        renderer,
        (ratio) => {
          const { width, height } = size.current;
          return {
            width: Math.max(1, Math.round(width * ratio)),
            height: Math.max(1, Math.round(height * ratio)),
            clientWidth: width,
            clientHeight: height,
          };
        },
      );
    } catch (error) {
      report(error);
    }
    return () => {
      stop?.();
      renderer?.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, gl]);

  const touchable = props.onTap || props.onSwipe || props.onDrag || props.onLongPress || props.onPinch;
  return (
    <View
      style={[styles.canvas, style]}
      onLayout={(e) => (size.current = { width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
      {...(touchable ? touch.responder.panHandlers : undefined)}
    >
      {useGL && GLView ? (
        <GLView style={styles.canvas} onContextCreate={(context) => setGL(context as unknown as WebGL2RenderingContext)} />
      ) : (
        <Canvas ref={ref} style={styles.canvas} />
      )}
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
