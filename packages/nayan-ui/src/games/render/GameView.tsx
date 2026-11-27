import { useContext, useEffect, useMemo, useRef } from 'react';
import { NPlatformView } from '../../components/NPlatformView';
import { ComponentRenderContext, ComponentThemeContext } from '../../components/ThemeContext';
import type { ComponentProps } from '../../components/types';
import NativeEngine from '../../native/NativeNayanEngine';
import { type Camera, type Light, MAX_MESHES, type RenderSource } from '../types';
import { type ColorInput, resolveColor } from '../world/color';
import { follow, shake } from './camera';
import { createTouchResponder, pixelRatio, Surface, useActive, type ViewStyle } from './host';
import { getMeshIdLimit, uploadBuiltInMeshes } from './meshes';
import {
  AutoQuality,
  levelPixelRatio,
  median,
  QUALITY_LEVELS,
  type QualityLevel,
  rememberQuality,
  type RenderQuality,
  type RenderQualitySetting,
  settledQuality
} from './quality';

const DEFAULT_BACKGROUND = [0.04, 0.05, 0.09] as const;

// ENGINE_FRAME_LEN, plus the scene scale (26), FXAA (27) and live shadows (28), which older native cores ignore.
const FRAME_LEN = 29;
const WHITE = [1, 1, 1] as const;
let nextSurface = 1;

const defaultCamera = (): Camera => ({
  eye: [0, 40, 60],
  target: [0, 0, 0],
  fov: Math.PI / 3
});
const defaultLight = (): Light => ({
  direction: [0.4, 0.8, 0.5],
  ambient: 0.35
});

/** Callbacks waiting for the next frame any GameView finishes (see `afterNextFrame`). */
let afterFrame: (() => void)[] = [];
/** GameView frame loops running now. */
let runningLoops = 0;

function runAfterFrame() {
  if (afterFrame.length === 0) return;
  const due = afterFrame;
  afterFrame = [];
  for (const fn of due) fn();
}

/**
 * Runs `fn` right after the next frame a GameView hands to the screen, on the same display clock
 * (the native one where the platform has it): the time a frame leaves is the best moment for
 * background work, such as loading in slices. With no GameView running it falls back to
 * requestAnimationFrame. Returns a function that cancels it.
 *
 * ```ts
 * const cancel = afterNextFrame(() => buildNextChunk());
 * ```
 */
export function afterNextFrame(fn: () => void): () => void {
  let cancelled = false;
  const run = () => {
    if (!cancelled) fn();
  };
  if (runningLoops > 0) afterFrame.push(run);
  else {
    const raf = requestAnimationFrame(run);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }
  return () => {
    cancelled = true;
  };
}

export type GameViewStats = {
  fps: number;
  /** Mean time spent in `onUpdate` and stepping the worlds per frame, in milliseconds. */
  updateMs: number;
  /**
   * Mean JS-thread time per frame spent handing the frame and overlay to the renderer, in
   * milliseconds. With a render thread this is copying only; otherwise it includes drawing.
   */
  publishMs: number;
  /** Average milliseconds per frame spent drawing (CPU side, including waiting on the GPU). */
  renderMs: number;
  /** The quality level drawn with (with `quality="auto"`, the one it settled on so far). */
  quality: RenderQuality;
  /** The 3D scene's resolution per axis relative to the screen's: 1, or less under a pixel budget. */
  sceneScale: number;
  /** The graphics API drawing: "vulkan", "gl" (OpenGL ES) or "metal". */
  backend: string;
};

export type SwipeDirection = 'left' | 'right' | 'up' | 'down';

export type OverlayTouchPhase = 'start' | 'move' | 'end' | 'cancel';

export type DragEvent = {
  phase: 'start' | 'move' | 'end';
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
  phase: 'start' | 'move' | 'end';
  /** Finger spread relative to the start: 2 = twice as far apart (zoom in). */
  scale: number;
  /** Radians the two fingers turned since the start, clockwise on screen. */
  rotation: number;
  /** Midpoint between the fingers in the view, in points. */
  x: number;
  y: number;
};

export type GameViewProps = {
  /** What to draw (usually a `World`). Changing it restarts the view; never pass a disposed world. */
  source: RenderSource;
  /**
   * Your game loop, called once per frame before drawing, with the elapsed seconds (capped at 0.1;
   * 0 until the first frame is on screen, so nothing plays out unseen): read input, spawn, move the
   * camera. The world (and `overlay`) is stepped for you right after; call `world.update(dt)` here
   * yourself only to step it at a different point or with a different `dt`.
   */
  onUpdate?: (dt: number) => void;
  /** Mutate this object (e.g. `camera.eye`) from `onUpdate`; it is read every frame. */
  camera?: Camera;
  light?: Light;
  /** Screen/fog color: CSS or linear 0..1 RGB (alpha ignored). Defaults to NTheme's background, then dark navy. */
  background?: ColorInput;
  /** Distance fog density towards `background` (e.g. 0.02). Default 0 (off). */
  fog?: number;
  /**
   * Resolution, anti-aliasing and shadows. "auto" (default) starts at "high", steps down only while
   * the GPU really can't keep up (crisper shadows, then no shadows or anti-aliasing, resolution last) and
   * steps back up once frames are smooth again, so every phone gets the best look it can hold.
   */
  quality?: RenderQualitySetting;
  /**
   * Remembers the level "auto" settles on under this key (e.g. the game's id) in the engine's durable
   * store, so every later view with the same key, after app restarts too, starts there rather than at "high".
   */
  qualityKey?: string;
  /**
   * Whether "auto" judges the device by the frames now (default true). Pass false while what's on
   * screen isn't the game being played (a results card, a menu, a ready screen): their cost says
   * nothing about the game, and a level chosen there would be remembered for the next visit.
   */
  adaptQuality?: boolean;
  /** Suspend updates and drawing while keeping the native surface mounted. */
  paused?: boolean;
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
  /** Host primary action for keyboard input, such as Start/Stop or Play Again. */
  onPrimaryAction?: () => void;
  /**
   * A screen-space layer drawn over the scene by the renderer (scoreboards, buttons): usually a second
   * `World`, in points from the view's top-left with y up (so on screen y <= 0) and z toward the viewer
   * within -100..100. Unlit (flat faces show their exact color) and always in front. Stepped each
   * frame like `source`.
   */
  overlay?: RenderSource;
  /**
   * Static scenery behind `source` (a meadow, sky and hills; a board's backdrop): the renderer draws it
   * once into a cached image with this view's camera and light, and draws it again only when it
   * changes or the camera, light, size or quality do. Each frame then costs one full-screen image
   * instead of the whole scenery, and `source` is always drawn in front of it. It isn't stepped (its
   * velocities and animations stand still): call `backdrop.update(0)` after spawning or changing it.
   * Defaults to `source.backdrop`: a World's still entities (`still: true`, `backdropLayer`).
   */
  backdrop?: RenderSource;
  /**
   * Touches for the overlay, in points in the view. Return true from "start" to claim the touch (a
   * button was hit): its moves and end come here, and the game gets no drag, tap or swipe for it.
   * "cancel" when the system takes the touch.
   */
  onOverlayTouch?: (phase: OverlayTouchPhase, x: number, y: number) => boolean | void;
  /** Called once a second. */
  onStats?: (stats: GameViewStats) => void;
  /** GPU setup failures and rendering errors. Defaults to console.error. */
  onError?: (error: Error) => void;
};

export function GameView(props: GameViewProps) {
  const rendering = useContext(ComponentRenderContext);
  const content = <GameSurface {...props} />;
  return rendering ? <NPlatformView style={{ flex: 1, ...props.style } as ComponentProps['style']}>{content}</NPlatformView> : content;
}

function GameSurface(props: GameViewProps) {
  const { source, camera, light, background, fog, style } = props;
  const theme = useContext(ComponentThemeContext);
  const inheritedBackground = theme?.themes?.[theme.resolvedTheme ?? 'light']?.background ?? theme?.colors?.background;
  const active = useActive();
  // Latest props, read from the frame loop and touch handlers without restarting them.
  const live = useRef({
    props,
    camera: camera ?? defaultCamera(),
    light: light ?? defaultLight(),
    environment: {
      background: background ?? inheritedBackground ?? DEFAULT_BACKGROUND,
      fog: fog ?? 0
    }
  });
  live.current.props = props;
  if (camera) live.current.camera = camera;
  if (light) live.current.light = light;
  live.current.environment = {
    background: background ?? inheritedBackground ?? DEFAULT_BACKGROUND,
    fog: fog ?? 0
  };

  const touch = useMemo(() => createTouchResponder(() => live.current.props), []);
  useEffect(() => touch.dispose, [touch]);
  useEffect(() => {
    if (props.paused || !active) touch.cancel();
  }, [touch, props.paused, active]);

  const surfaceId = useMemo(() => nextSurface++, []);
  const size = useRef({ width: 0, height: 0 });
  // The automatic quality outlives pauses, settings sheets and resumes; only a new source starts over.
  const autoQuality = useRef<{ source: RenderSource; auto: AutoQuality } | null>(null);

  useEffect(() => {
    if (props.paused || !active) return;
    const native = NativeEngine;
    const report = (error: unknown) => {
      const e = error instanceof Error ? error : new Error(String(error));
      (live.current.props.onError ?? ((x: Error) => console.error(`GameView: ${x.message}`)))(e);
    };
    if (!native) {
      report(new Error('the native engine is not linked into this build'));
      return;
    }
    uploadBuiltInMeshes();
    let alive = true;
    let raf = 0;
    let errors = 0;
    // Where the platform has them (Android), frames come from the display's own clock and are drawn
    // on the engine's render thread: this loop only runs the game and publishes what to draw.
    const native2 = native;
    const threaded = native2.hasFrameClock?.() === true && typeof native2.publishFrame === 'function' && typeof native2.startFrames === 'function';
    let presentedAt = 0;
    if (autoQuality.current?.source !== source)
      autoQuality.current = { source, auto: new AutoQuality(settledQuality(live.current.props.qualityKey, native)) };
    const auto = autoQuality.current.auto;
    const chosen = (): [RenderQuality, QualityLevel] => {
      const setting = live.current.props.quality ?? 'auto';
      return setting === 'auto' ? [auto.quality, auto.level] : [setting, QUALITY_LEVELS[setting]];
    };
    const followed: [number, number, number] = [0, 0, 0];
    const shaken: Camera = { eye: [0, 0, 0], target: [0, 0, 0], fov: 1 };
    const frameData = new Float64Array(FRAME_LEN);
    const viewProj = new Float32Array(16);
    // Sources without texture regions show whole textures.
    const wholeRegions = (s: RenderSource) => {
      if (s.regions) return s.regions;
      const regions = new Float32Array(Math.max(1, s.capacity) * 4);
      for (let i = 2; i < regions.length; i += 4) {
        regions[i] = 1;
        regions[i + 1] = 1;
      }
      return regions;
    };
    const regions = wholeRegions(source);
    // Instances actually packed (hidden ones are left out): the furthest range end, at most `count`.
    // Only the mesh ids in use can have instances, in each half (opaque, then see-through). The
    // see-through half starts halfway through the ranges, wherever that is (a native core built for
    // fewer mesh ids has a shorter table).
    const drawn = (s: RenderSource) => {
      const r = s.ranges;
      const buckets = r.length >> 1;
      const limit = getMeshIdLimit();
      const opaqueStop = Math.min(limit, buckets);
      const half = Math.min(MAX_MESHES, buckets >> 1);
      const clearStop = Math.min(half + limit, buckets);
      let end = 0;
      for (let i = 1, stop = opaqueStop * 2; i < stop; i += 2) {
        const count = r[i]!;
        if (count > 0 && r[i - 1]! + count > end) end = r[i - 1]! + count;
      }
      for (let i = half * 2 + 1, stop = clearStop * 2; i < stop; i += 2) {
        const count = r[i]!;
        if (count > 0 && r[i - 1]! + count > end) end = r[i - 1]! + count;
      }
      return Math.min(s.count, end);
    };
    let overlay: { source: RenderSource; regions: Float32Array } | null = null;
    // The backdrop last sent, and its update count then: sent again only when it changes.
    let backdrop: { source: RenderSource; updates: number; regions: Float32Array } | null = null;
    let last = 0;
    let frames = 0;
    let fpsStart = 0;
    let updateTime = 0;
    let publishTime = 0;
    let renderTime = 0;
    // This second's frame intervals and draw times: the quality picker looks at their medians, so a
    // single hiccup (garbage collection, a busy JS frame) never costs quality.
    const intervals: number[] = [];
    const draws: number[] = [];
    // Game time starts with the first frame actually on screen: until then `onUpdate` gets dt = 0, so
    // intros and animations aren't over before the surface (attached during the screen's transition) shows.
    let shown = false;

    const frame = (now: number) => {
      if (!alive) return;
      if (!threaded) raf = requestAnimationFrame(frame);
      if (!last) last = fpsStart = now;
      if (now > last) intervals.push(now - last);
      const dt = shown ? Math.min((now - last) / 1000, 0.1) : 0;
      last = now;

      const { props: current, camera, light, environment } = live.current;
      const t0 = performance.now();
      const layer = current.overlay;
      const sourceSteps = source.updateCount;
      const layerSteps = layer?.updateCount;
      current.onUpdate?.(dt);
      // Step what onUpdate didn't (a World counts its own updates), so the loop needs no boilerplate.
      if (source.update && !source.isDisposed && source.updateCount === sourceSteps) source.update(dt);
      if (layer?.update && !layer.isDisposed && layer.updateCount === layerSteps) layer.update(dt);
      updateTime += performance.now() - t0;

      follow(camera, source, followed, dt);
      const view = shake(camera, shaken, dt);

      const [quality, level] = chosen();
      const { width, height } = size.current;
      // Phones' GPUs are fill-rate bound: cap the pixels drawn rather than match a 3x+ screen. A level's
      // pixel budget shrinks only the 3D scene (stretched to fill the view): the screen keeps its own
      // resolution, so the overlay's text stays sharp at every level.
      const density = pixelRatio();
      const screenRatio = Math.min(density, level.maxPixelRatio);
      const ratio = levelPixelRatio(level, density, width, height);
      const f = frameData;
      f.set(view.eye, 0);
      f.set(view.target, 3);
      f[6] = view.fov;
      f[7] = view.ortho ?? 0;
      f.set(light.direction, 8);
      f[11] = light.ambient;
      f[12] = (light.shadows ?? true) !== false && level.shadows ? 1 : 0;
      f[13] = light.shadowExtent ?? 30;
      // Exactly three channels each: either color may carry an alpha that must not spill over.
      const lightColor = light.color === undefined ? WHITE : resolveColor(light.color);
      f[14] = lightColor[0];
      f[15] = lightColor[1];
      f[16] = lightColor[2];
      const sky = resolveColor(environment.background);
      f[17] = sky[0];
      f[18] = sky[1];
      f[19] = sky[2];
      f[20] = environment.fog;
      f[21] = Math.round(width * screenRatio);
      f[22] = Math.round(height * screenRatio);
      f[23] = level.samples;
      f[24] = level.shadowSize;
      f[25] = level.softShadows ? 1 : 0;
      f[26] = screenRatio > 0 ? ratio / screenRatio : 1;
      f[27] = level.fxaa ? 1 : 0;
      f[28] = light.shadows === 'backdrop' ? 0 : 1;
      const t1 = performance.now();
      if (layer) {
        if (overlay?.source !== layer) overlay = { source: layer, regions: wholeRegions(layer) };
        native.renderOverlay(
          surfaceId,
          layer.matrices.buffer,
          layer.colors.buffer,
          overlay.regions.buffer,
          layer.ranges.buffer,
          drawn(layer),
          width,
          height
        );
      } else if (overlay) {
        overlay = null;
        native.renderOverlay(surfaceId, regions.buffer, regions.buffer, regions.buffer, regions.buffer, 0, 0, 0); // removes it
      }
      const backSource = current.backdrop ?? source.backdrop;
      const back = backSource && !backSource.isDisposed ? backSource : undefined;
      if (back && typeof native.renderBackdrop === 'function') {
        if (backdrop?.source !== back || backdrop.updates !== (back.updateCount ?? 0)) {
          // A freshly spawned world has no matrices until it's stepped once.
          if (!back.updateCount && back.update) back.update(0);
          backdrop = { source: back, updates: back.updateCount ?? 0, regions: wholeRegions(back) };
          native.renderBackdrop(surfaceId, back.matrices.buffer, back.colors.buffer, backdrop.regions.buffer, back.ranges.buffer, drawn(back));
        }
      } else if (backdrop) {
        backdrop = null;
        native.renderBackdrop?.(surfaceId, regions.buffer, regions.buffer, regions.buffer, regions.buffer, 0); // removes it
      }
      const render = threaded ? native2.publishFrame! : native.renderFrame;
      const rendered = render(
        surfaceId,
        f.buffer,
        source.matrices.buffer,
        source.colors.buffer,
        regions.buffer,
        source.ranges.buffer,
        drawn(source),
        viewProj.buffer,
        source.nativeWorld ?? -1
      );
      const drawMs = performance.now() - t1;
      publishTime += drawMs;
      if (!threaded) {
        renderTime += drawMs;
        draws.push(drawMs);
      }
      // A published frame's camera is known at once (picking needs it), whether or not it's presented yet.
      if (rendered === 1 || (threaded && rendered === 0)) source.setView?.(viewProj, width, height);
      if (rendered === 1) shown = true;
      else if (rendered < 0 && errors++ < 3) report(new Error(native.renderError() || 'rendering failed'));

      frames++;
      if (now - fpsStart >= 1000) {
        const elapsed = now - fpsStart;
        let fps = (frames * 1000) / elapsed;
        let frameMs = median(intervals);
        let renderMs = median(draws);
        let meanRenderMs = renderTime / frames;
        if (threaded) {
          // What the display actually got: frames presented by the render thread, and how long each took to draw.
          const [presented = 0, nativeMs = 0] = native2.renderStats?.(surfaceId) ?? [];
          const shownFrames = presented - presentedAt;
          presentedAt = presented;
          fps = (shownFrames * 1000) / elapsed;
          frameMs = shownFrames > 0 ? Math.max(frameMs, elapsed / shownFrames) : elapsed;
          renderMs = meanRenderMs = nativeMs;
        }
        if (current.adaptQuality ?? true) auto.report(now, { frameMs, renderMs });
        else auto.hold(now);
        if ((current.quality ?? 'auto') === 'auto') rememberQuality(current.qualityKey, auto.step, native);
        intervals.length = 0;
        draws.length = 0;
        current.onStats?.({
          fps,
          updateMs: updateTime / frames,
          publishMs: publishTime / frames,
          renderMs: meanRenderMs,
          quality,
          sceneScale: frameData[26]!,
          backend: native.renderBackend()
        });
        frames = 0;
        updateTime = 0;
        publishTime = 0;
        renderTime = 0;
        fpsStart = now;
      }
      runAfterFrame();
    };
    if (threaded) native2.startFrames!(surfaceId, frame);
    else raf = requestAnimationFrame(frame);
    runningLoops++;
    return () => {
      alive = false;
      runningLoops--;
      // Work waiting on this loop's frames moves to requestAnimationFrame if it was the last one.
      if (runningLoops === 0 && afterFrame.length) requestAnimationFrame(runAfterFrame);
      if (threaded) native2.stopFrames!(surfaceId);
      else cancelAnimationFrame(raf);
    };
    // A new source or resuming a paused view restarts drawing; other props are read live.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source, props.paused, active]);

  const touchable = props.onTap || props.onSwipe || props.onDrag || props.onLongPress || props.onPinch || props.onOverlayTouch;
  return (
    <Surface
      surfaceId={surfaceId}
      style={style}
      onSize={(width, height) => {
        size.current = { width, height };
      }}
      onError={(error) => (live.current.props.onError ?? console.error)(error)}
      touch={touchable ? touch : undefined}
      onPrimaryAction={props.onPrimaryAction ? () => live.current.props.onPrimaryAction?.() : undefined}
    />
  );
}
