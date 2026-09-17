import { reportOnce } from '../lib/diagnostics';
import { clamp } from '../lib/utils';
import { getImageBitmap, getReader } from '../media/library';
import { TEXT_LINE_HEIGHT, US, clipEndUs, isMediaClip, isTextClip, sourceTimeUs } from '../types';
import type { Background, Clip, MediaClip, MediaFit, ProjectSettings, TextClip, Track, Transform } from '../types';
import { blurOnlyFilter, canvasFilterString, exportProcessor, needsPixelProcessing, previewProcessor } from './glProcessor';
import { transitionStateAt } from './transitions';
import type { LayerTransitionState } from './transitions';

export interface Scene {
  project: ProjectSettings;
  tracks: Track[];
  clips: Clip[];
}

type Context2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

export interface RenderOptions {
  /** Preview and export keep separate GPU/scratch surfaces so they can't clash. */
  target: 'preview' | 'export';
}

/**
 * Draws the timeline at a single instant.
 *
 * Preview and export both call this, pointed at different canvases, which is
 * what guarantees the exported file matches what the user saw. Because all
 * geometry in the model is a fraction of the frame, the same scene renders
 * correctly at any resolution.
 *
 * Returns false when a layer that should have been visible had no source to
 * draw. The background is painted first, so such a frame is not merely
 * incomplete — it has replaced whatever was on the canvas with an empty
 * picture, and the caller needs to know it is worth rendering again.
 */
export const renderScene = async (context: Context2D, scene: Scene, timeUs: number, options: RenderOptions): Promise<boolean> => {
  const { project } = scene;
  let complete = true;

  await drawBackground(context, scene, timeUs, options);

  for (const layer of visibleLayers(scene, timeUs)) {
    const transition = layer.transitionIn;
    const withinTransition = transition && timeUs < layer.startUs + transition.durationUs;

    if (!withinTransition) {
      complete = (await drawLayer(context, layer, project, timeUs, options, null)) && complete;
      continue;
    }

    // A transition needs the clip it is coming *from* underneath it. That clip
    // has already ended on the timeline, so it is re-rendered here rather than
    // appearing in `visibleLayers`.
    const progress = (timeUs - layer.startUs) / transition.durationUs;
    const state = transitionStateAt(transition.kind, progress, project.width, project.height);
    const outgoing = previousClipOnTrack(scene, layer);

    if (outgoing && state.outgoing.alpha > 0) {
      // Keep reading the outgoing clip's source forward through the blend
      // rather than freezing its last frame, which looks broken over motion.
      const drawn = await drawLayer(context, outgoing, project, Math.min(timeUs, clipEndUs(outgoing) - 1), options, {
        ...state.outgoing,
        sourceOverrunUs: isMediaClip(outgoing) ? outgoing.inUs + (timeUs - outgoing.startUs) * outgoing.speed : undefined
      });
      complete = drawn && complete;
    }

    complete = (await drawLayer(context, layer, project, timeUs, options, { ...state.incoming })) && complete;

    if (state.overlay && state.overlay.alpha > 0) {
      context.save();
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.globalAlpha = state.overlay.alpha;
      context.globalCompositeOperation = 'source-over';
      context.filter = 'none';
      context.fillStyle = state.overlay.color;
      context.fillRect(0, 0, project.width, project.height);
      context.restore();
    }
  }

  return complete;
};

/** Clips that should be on screen at `timeUs`, in bottom-to-top draw order. */
const visibleLayers = (scene: Scene, timeUs: number): Clip[] => {
  const layers: Clip[] = [];
  // tracks[0] is the topmost layer, so walk the list backwards to draw it last.
  for (let index = scene.tracks.length - 1; index >= 0; index--) {
    const track = scene.tracks[index];
    if (track.kind !== 'video' || track.hidden) continue;
    for (const clip of scene.clips) {
      if (clip.trackId !== track.id) continue;
      if (timeUs < clip.startUs || timeUs >= clipEndUs(clip)) continue;
      layers.push(clip);
    }
  }
  return layers;
};

/** The clip immediately before `clip` on the same track, if they touch. */
const previousClipOnTrack = (scene: Scene, clip: Clip): Clip | null => {
  let best: Clip | null = null;
  for (const candidate of scene.clips) {
    if (candidate.id === clip.id || candidate.trackId !== clip.trackId) continue;
    if (candidate.startUs >= clip.startUs) continue;
    if (!best || candidate.startUs > best.startUs) best = candidate;
  }
  // Only treat it as the outgoing side if it actually reaches the cut.
  if (best && clipEndUs(best) >= clip.startUs - 1000) return best;
  return null;
};

/** Fade envelope, shared with the audio engine so sound and picture match. */
const envelopeAt = (clip: Clip, timeUs: number): number => {
  const local = timeUs - clip.startUs;
  const remaining = clip.durationUs - local;
  let gain = 1;
  if (clip.fadeInUs > 0) gain = Math.min(gain, clamp(local / clip.fadeInUs, 0, 1));
  if (clip.fadeOutUs > 0) gain = Math.min(gain, clamp(remaining / clip.fadeOutUs, 0, 1));
  return gain;
};

interface DrawOverride extends LayerTransitionState {
  /**
   * Source position to read instead of the one implied by the timeline. Used
   * by transitions, where the outgoing clip must keep playing past its own
   * out-point for the duration of the blend.
   */
  sourceOverrunUs?: number;
}

/* ------------------------------------------------------------------ *
 * Scratch surfaces
 * ------------------------------------------------------------------ */

const scratch = new Map<string, { canvas: OffscreenCanvas | HTMLCanvasElement; context: Context2D }>();

/**
 * How many offscreen surfaces to keep alive.
 *
 * Sample surfaces are keyed by source dimensions, so a project mixing many
 * resolutions would otherwise accumulate one full-size canvas per distinct
 * size and never let go: twenty 4K sources is roughly 660MB of backing store
 * held for the session. A transition needs two at once and the backdrop a
 * third, so the ceiling only has to be comfortably above that.
 */
const SCRATCH_LIMIT = 8;

/**
 * A reusable offscreen surface. Layers that need pixel processing or text
 * rasterisation are drawn here first; allocating a canvas per frame would
 * thrash the GC and stall playback.
 */
const getScratch = (key: string, width: number, height: number) => {
  let entry = scratch.get(key);
  const targetWidth = Math.max(1, width);
  const targetHeight = Math.max(1, height);

  if (!entry) {
    const canvas =
      typeof OffscreenCanvas !== 'undefined'
        ? new OffscreenCanvas(targetWidth, targetHeight)
        : Object.assign(document.createElement('canvas'), { width: targetWidth, height: targetHeight });
    const context = canvas.getContext('2d') as Context2D | null;
    if (!context) return null;
    entry = { canvas, context };
    scratch.set(key, entry);

    // Drop the least recently used surfaces, and release their backing store
    // rather than waiting for the collector to notice a detached canvas.
    while (scratch.size > SCRATCH_LIMIT) {
      const oldest = scratch.keys().next().value;
      if (oldest === undefined || oldest === key) break;
      const evicted = scratch.get(oldest);
      if (evicted) {
        evicted.canvas.width = 0;
        evicted.canvas.height = 0;
      }
      scratch.delete(oldest);
    }
  } else {
    // Re-insert so Map iteration order stays least-recently-used first.
    scratch.delete(key);
    scratch.set(key, entry);
  }
  if (entry.canvas.width !== targetWidth || entry.canvas.height !== targetHeight) {
    entry.canvas.width = targetWidth;
    entry.canvas.height = targetHeight;
  }
  entry.context.setTransform(1, 0, 0, 1, 0, 0);
  entry.context.globalAlpha = 1;
  entry.context.globalCompositeOperation = 'source-over';
  entry.context.filter = 'none';
  entry.context.clearRect(0, 0, entry.canvas.width, entry.canvas.height);
  return entry;
};

/**
 * An existing surface with its pixels left alone, or null if it is gone or the
 * wrong size.
 *
 * `getScratch` clears on the way out, which is right for a caller about to
 * redraw and useless to one that wants to reuse what is already there. Reading
 * through here still counts as a use, so keeping a surface does not make it
 * the next thing evicted.
 */
const peekScratch = (key: string, width: number, height: number) => {
  const entry = scratch.get(key);
  if (!entry) return null;
  if (entry.canvas.width !== Math.max(1, width) || entry.canvas.height !== Math.max(1, height)) return null;
  scratch.delete(key);
  scratch.set(key, entry);
  return entry;
};

/**
 * Frees the surfaces an export allocated, leaving the preview's alone.
 *
 * Export surfaces are sized to the *output*, not the window: a 4K bounce
 * leaves up to `SCRATCH_LIMIT` full-frame canvases — the text raster alone is
 * 3840×2160 — held by a module-level map for the rest of the session, for a
 * render pass that has finished. The preview's own surfaces are keyed
 * separately and are still in use, so they are deliberately untouched.
 */
export const releaseExportSurfaces = () => {
  for (const [key, entry] of scratch) {
    if (!key.startsWith('export:')) continue;
    // Zero the backing store rather than waiting for the collector to notice
    // a detached canvas, as the eviction path does.
    entry.canvas.width = 0;
    entry.canvas.height = 0;
    scratch.delete(key);
    textSignatures.delete(key);
  }
};

/* ------------------------------------------------------------------ *
 * Layer drawing
 * ------------------------------------------------------------------ */

/**
 * Draws one layer. False means a frame that should have been on screen wasn't
 * available — distinct from one that is deliberately invisible, where there is
 * nothing to wait for and nothing to retry.
 */
const drawLayer = async (
  context: Context2D,
  clip: Clip,
  project: ProjectSettings,
  timeUs: number,
  options: RenderOptions,
  override: DrawOverride | null
): Promise<boolean> => {
  const alpha = clip.opacity * envelopeAt(clip, timeUs) * (override?.alpha ?? 1);
  // Transparent by the user's own instruction — opacity, a fade, a transition.
  if (alpha <= 0.001) return true;

  if (isTextClip(clip)) {
    const rendered = renderTextToScratch(clip, project, timeUs, `${options.target}:raster`);
    if (!rendered) return false;
    compose(context, rendered.canvas, clip, project, timeUs, options, override, alpha, project.width, project.height);
    return true;
  }
  return drawMediaLayer(context, clip, project, timeUs, options, override, alpha);
};

interface ResolvedSource {
  source: CanvasImageSource;
  sourceWidth: number;
  sourceHeight: number;
}

const resolveImageSource = (clip: MediaClip): ResolvedSource | null => {
  const bitmap = getImageBitmap(clip.assetId);
  if (!bitmap) return null;
  return { source: bitmap, sourceWidth: bitmap.width, sourceHeight: bitmap.height };
};

const resolveVideoSource = async (clip: MediaClip, timeUs: number, options: RenderOptions, overrunUs?: number): Promise<ResolvedSource | null> => {
  const reader = getReader(clip.id, clip.assetId, options.target);
  if (!reader) return null;
  const sourceUs = overrunUs ?? sourceTimeUs(clip, timeUs);
  if (sourceUs === null) return null;

  const sample = await reader.sampleAt(sourceUs / US);
  if (!sample) return null;

  const sourceWidth = sample.displayWidth;
  const sourceHeight = sample.displayHeight;

  // Blit through a scratch surface so mediabunny applies rotation and pixel
  // aspect ratio for us, and so the GPU pass has a plain texture source.
  //
  // The key carries the dimensions because a transition draws two clips per
  // frame: sharing one surface between a 1080p and a 720p layer would resize —
  // and so reallocate and clear — it twice on every single frame of the blend,
  // which is exactly when there is no headroom to spare.
  const surface = getScratch(`${options.target}:sample:${sourceWidth}x${sourceHeight}`, sourceWidth, sourceHeight);
  if (!surface) return null;
  try {
    sample.draw(surface.context as CanvasRenderingContext2D, 0, 0, sourceWidth, sourceHeight);
  } catch (error) {
    // A sample invalidated by a concurrent seek is normal and the next frame
    // recovers. A *closed* one never recovers, and silently dropping the layer
    // leaves a preview that is empty for no visible reason — so say it once.
    reportOnce('video frame', error);
    return null;
  }
  return { source: surface.canvas, sourceWidth, sourceHeight };
};

const drawMediaLayer = async (
  context: Context2D,
  clip: MediaClip,
  project: ProjectSettings,
  timeUs: number,
  options: RenderOptions,
  override: DrawOverride | null,
  alpha: number
): Promise<boolean> => {
  // Audio draws nothing by definition, so it is never an incomplete frame.
  if (clip.kind === 'audio') return true;

  const resolved = clip.kind === 'image' ? resolveImageSource(clip) : await resolveVideoSource(clip, timeUs, options, override?.sourceOverrunUs);
  if (!resolved) return false;

  compose(context, resolved.source, clip, project, timeUs, options, override, alpha, resolved.sourceWidth, resolved.sourceHeight);
  return true;
};

/**
 * Runs the pixel pipeline (when needed) and draws the result with the clip's
 * crop and transform.
 */
const compose = (
  context: Context2D,
  source: CanvasImageSource,
  clip: Clip,
  project: ProjectSettings,
  timeUs: number,
  options: RenderOptions,
  override: DrawOverride | null,
  alpha: number,
  sourceWidth: number,
  sourceHeight: number
) => {
  if (sourceWidth <= 0 || sourceHeight <= 0) return;

  const color = clip.colorAdjust;
  const chromaKey = isMediaClip(clip) ? clip.chromaKey : undefined;
  const blurScale = project.height / 1080;

  let image: CanvasImageSource = source;
  let filter = canvasFilterString(color, blurScale);

  if (needsPixelProcessing({ color, chromaKey })) {
    const processor = options.target === 'export' ? exportProcessor : previewProcessor;
    const processed = processor.process(source as TexImageSource, sourceWidth, sourceHeight, {
      color,
      chromaKey: chromaKey ?? { enabled: false, color: '#000000', similarity: 0, smoothness: 0, spill: 0 },
      seed: timeUs
    });
    if (processed) {
      image = processed;
      // The shader has already handled everything except blur.
      filter = blurOnlyFilter(color, blurScale);
    }
  }

  // Crop selects a sub-rectangle of the source, which then fills the same box.
  const crop = clip.crop;
  const sx = sourceWidth * clamp(crop.left, 0, 0.98);
  const sy = sourceHeight * clamp(crop.top, 0, 0.98);
  const sw = Math.max(1, sourceWidth * (1 - clamp(crop.left + crop.right, 0, 0.99)));
  const sh = Math.max(1, sourceHeight * (1 - clamp(crop.top + crop.bottom, 0, 0.99)));

  // A transition's blur rides on top of the grade's own. Two `blur()` functions
  // in one filter chain compose, so it is appended rather than merged — and it
  // is scaled with output height like every other blur, so a whip pan smears
  // by the same amount at 720p and 4K.
  // The epsilon is not cosmetic: a transition's blur curve lands on values
  // like 7e-17 at its endpoints, which are invisible but truthy, and a
  // `blur(0.00px)` in the filter chain still pushes the canvas onto its
  // filtered draw path for the frame.
  if (override?.blur && override.blur > 0.01) {
    const radius = (override.blur * blurScale).toFixed(2);
    filter = filter === 'none' ? `blur(${radius}px)` : `${filter} blur(${radius}px)`;
  }

  // Text rasterises at project size, so `contain` is the identity for it.
  const box = fitRect(isMediaClip(clip) ? clip.fit : 'contain', sw, sh, project.width, project.height);
  const transform = clip.transform;

  context.save();
  context.globalAlpha = alpha;

  if (override?.clip) override.clip(context, project.width, project.height);
  if (override?.translate) context.translate(override.translate.x, override.translate.y);

  applyTransform(context, transform, project, override?.scale ?? 1);
  context.filter = filter;

  try {
    context.drawImage(image, sx, sy, sw, sh, -box.width / 2, -box.height / 2, box.width, box.height);
  } catch (error) {
    // A closed VideoFrame or a zero-sized surface; drop the frame.
    reportOnce('layer draw', error);
  }
  context.restore();
};

/** Applies the clip's transform around the canvas centre. */
const applyTransform = (context: Context2D, transform: Transform, project: ProjectSettings, extraScale: number) => {
  context.translate(project.width / 2 + transform.x * project.width, project.height / 2 + transform.y * project.height);
  if (transform.rotation) context.rotate((transform.rotation * Math.PI) / 180);
  const flipX = transform.flipH ? -1 : 1;
  const flipY = transform.flipV ? -1 : 1;
  context.scale(transform.scale * flipX * extraScale, transform.scale * flipY * extraScale);
};

/* ------------------------------------------------------------------ *
 * Background
 * ------------------------------------------------------------------ */

/**
 * Blur radius, in pixels, that the reduced backdrop surface is sized around.
 *
 * A 48px blur across a full 1080p frame is tens of milliseconds every frame,
 * which playback cannot afford. Downscaling first buys most of it: blurring by
 * r/k on a surface scaled by k and then scaling back up is the same blur for
 * k² fewer pixels.
 *
 * The reduction is derived from the requested radius rather than fixed, so a
 * heavy blur gets a big saving while a light one is barely reduced at all — a
 * fixed surface would quietly destroy detail the user asked to keep.
 */
const BACKDROP_TARGET_RADIUS = 4;

/** Below this the blur is doing nothing worth a second surface. */
const BACKDROP_DIRECT_RADIUS = 2;

const drawBackground = async (context: Context2D, scene: Scene, timeUs: number, options: RenderOptions) => {
  const { project } = scene;
  const background = project.background;

  context.save();
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.globalAlpha = 1;
  context.globalCompositeOperation = 'source-over';
  context.filter = 'none';

  // Always lay the solid colour down first: it is the base every other kind
  // sits on, and the only thing standing between a missing asset and a frame
  // of whatever the canvas happened to hold last.
  context.fillStyle = background.color;
  context.fillRect(0, 0, project.width, project.height);

  if (background.kind === 'linear-gradient' || background.kind === 'radial-gradient') {
    context.fillStyle = buildGradient(context, background, project);
    context.fillRect(0, 0, project.width, project.height);
  } else if (background.kind === 'image' || background.kind === 'blur') {
    const source = background.kind === 'image' ? resolveBackgroundImage(background) : await resolveBackdropClip(scene, timeUs, options);
    if (source) drawBackdrop(context, source, background, project, options);
  }

  context.restore();
};

const buildGradient = (context: Context2D, background: Background, project: ProjectSettings) => {
  if (background.kind === 'radial-gradient') {
    const gradient = context.createRadialGradient(
      project.width / 2,
      project.height / 2,
      0,
      project.width / 2,
      project.height / 2,
      Math.hypot(project.width, project.height) / 2
    );
    gradient.addColorStop(0, background.from);
    gradient.addColorStop(1, background.to);
    return gradient;
  }

  // Angle is measured clockwise from straight up, the way every design tool
  // states it; canvas wants two endpoints, so project the angle onto a line
  // through the centre long enough to span the frame.
  const radians = ((background.angle - 90) * Math.PI) / 180;
  const reach = (Math.abs(Math.cos(radians)) * project.width + Math.abs(Math.sin(radians)) * project.height) / 2;
  const dx = Math.cos(radians) * reach;
  const dy = Math.sin(radians) * reach;
  const gradient = context.createLinearGradient(project.width / 2 - dx, project.height / 2 - dy, project.width / 2 + dx, project.height / 2 + dy);
  gradient.addColorStop(0, background.from);
  gradient.addColorStop(1, background.to);
  return gradient;
};

const resolveBackgroundImage = (background: Background): ResolvedSource | null => {
  if (!background.assetId) return null;
  const bitmap = getImageBitmap(background.assetId);
  if (!bitmap) return null;
  return { source: bitmap, sourceWidth: bitmap.width, sourceHeight: bitmap.height };
};

/** The frontmost picture on screen — what a blurred backdrop is made from. */
const resolveBackdropClip = async (scene: Scene, timeUs: number, options: RenderOptions): Promise<ResolvedSource | null> => {
  const layers = visibleLayers(scene, timeUs);
  for (let index = layers.length - 1; index >= 0; index--) {
    const clip = layers[index];
    if (!isMediaClip(clip) || clip.kind === 'audio') continue;
    // Re-reading the same instant is cheap: the reader already holds this
    // sample, so this costs a blit rather than a decode.
    return clip.kind === 'image' ? resolveImageSource(clip) : await resolveVideoSource(clip, timeUs, options);
  }
  return null;
};

/** Cover-fits a picture over the whole frame, defocused and dimmed. */
const drawBackdrop = (context: Context2D, resolved: ResolvedSource, background: Background, project: ProjectSettings, options: RenderOptions) => {
  // The radius is stated at 1080p so a project looks the same at 720p and 4K.
  const radius = Math.max(0, background.blur) * (project.height / 1080);
  const zoom = Math.max(1, background.scale);

  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';

  /** Fills `target` with the source, cropped to cover and zoomed. */
  const paint = (target: Context2D, width: number, height: number) => {
    const cover = coverRect(resolved.sourceWidth, resolved.sourceHeight, width, height);
    target.drawImage(resolved.source, (width - cover.width * zoom) / 2, (height - cover.height * zoom) / 2, cover.width * zoom, cover.height * zoom);
  };

  try {
    if (radius < BACKDROP_DIRECT_RADIUS) {
      // Sharp, or near enough. A reduced surface here would throw away detail
      // the user explicitly asked to keep by turning the blur down.
      context.filter = radius > 0.1 ? `blur(${radius.toFixed(2)}px)` : 'none';
      paint(context, project.width, project.height);
      context.filter = 'none';
    } else {
      const ratio = Math.min(1, BACKDROP_TARGET_RADIUS / radius);
      const width = Math.max(1, Math.round(project.width * ratio));
      const height = Math.max(1, Math.round(project.height * ratio));
      const surface = getScratch(`${options.target}:backdrop`, width, height);
      if (!surface) return;

      surface.context.imageSmoothingEnabled = true;
      surface.context.imageSmoothingQuality = 'high';
      surface.context.filter = `blur(${(radius * ratio).toFixed(2)}px)`;
      paint(surface.context, width, height);
      context.drawImage(surface.canvas, 0, 0, project.width, project.height);
    }
  } catch {
    // A closed VideoFrame; leave the solid base showing for this frame.
    context.filter = 'none';
    return;
  }

  if (background.dim > 0) {
    context.globalAlpha = Math.min(1, background.dim);
    context.fillStyle = background.color;
    context.fillRect(0, 0, project.width, project.height);
    context.globalAlpha = 1;
  }
};

/**
 * The base rectangle a layer is drawn into, per its fit mode.
 *
 * Shared with the preview overlay, so the selection frame and the handles land
 * on the pixels that were actually drawn.
 */
export const fitRect = (fit: MediaFit, sourceWidth: number, sourceHeight: number, boxWidth: number, boxHeight: number) => {
  if (fit === 'stretch') return { width: boxWidth, height: boxHeight };
  return fit === 'cover' ? coverRect(sourceWidth, sourceHeight, boxWidth, boxHeight) : containRect(sourceWidth, sourceHeight, boxWidth, boxHeight);
};

/** Cover-fit: the box is filled completely, overflowing if aspect ratios differ. */
const coverRect = (sourceWidth: number, sourceHeight: number, boxWidth: number, boxHeight: number) => {
  if (!sourceWidth || !sourceHeight) return { width: boxWidth, height: boxHeight };
  const scale = Math.max(boxWidth / sourceWidth, boxHeight / sourceHeight);
  return { width: sourceWidth * scale, height: sourceHeight * scale };
};

/** Contain-fit: the whole frame is visible, letterboxed if aspect ratios differ. */
export const containRect = (sourceWidth: number, sourceHeight: number, boxWidth: number, boxHeight: number) => {
  if (!sourceWidth || !sourceHeight) return { width: boxWidth, height: boxHeight };
  const scale = Math.min(boxWidth / sourceWidth, boxHeight / sourceHeight);
  return { width: sourceWidth * scale, height: sourceHeight * scale };
};

/* ------------------------------------------------------------------ *
 * Text
 * ------------------------------------------------------------------ */

/** Reveal fraction and entrance offset for the clip's text animation. */
const textAnimationAt = (clip: TextClip, timeUs: number) => {
  const local = timeUs - clip.startUs;
  const inDuration = Math.min(600_000, clip.durationUs / 3);
  const progress = clamp(local / Math.max(1, inDuration), 0, 1);
  const eased = progress * (2 - progress);

  switch (clip.animation) {
    case 'fade':
      return { alpha: eased, offsetY: 0, scale: 1, reveal: 1 };
    case 'rise':
      return { alpha: eased, offsetY: (1 - eased) * 0.06, scale: 1, reveal: 1 };
    case 'pop':
      return { alpha: eased, offsetY: 0, scale: 0.7 + 0.3 * eased, reveal: 1 };
    case 'typewriter':
      return { alpha: 1, offsetY: 0, scale: 1, reveal: progress };
    default:
      return { alpha: 1, offsetY: 0, scale: 1, reveal: 1 };
  }
};

/**
 * What the last raster on a given surface was drawn from.
 *
 * Text is rasterised at full project size, so a 4K title costs a clear and a
 * layout of every line on every frame — even parked on a static caption where
 * the result is identical. The signature below covers every input that reaches
 * a pixel, so a frame that would redraw the same thing reuses the surface
 * instead. An animated title changes its signature each frame and pays the
 * same cost as before, which is correct: its pixels really do differ.
 */
const textSignatures = new Map<string, string>();

const renderTextToScratch = (clip: TextClip, project: ProjectSettings, timeUs: number, key: string) => {
  const animation = textAnimationAt(clip, timeUs);
  const fontSize = Math.max(1, clip.fontSize * project.height * animation.scale);
  const lineHeight = fontSize * TEXT_LINE_HEIGHT;

  let lines = clip.text.split('\n');
  if (animation.reveal < 1) {
    // Typewriter: reveal characters across the whole block, not per line.
    lines = clip.text.slice(0, Math.floor(clip.text.length * animation.reveal)).split('\n');
  }
  if (lines.length === 0 || (lines.length === 1 && lines[0] === '')) return null;

  const font = `${clip.italic ? 'italic ' : ''}${clip.fontWeight} ${fontSize}px ${clip.fontFamily}`;
  const centreX = project.width / 2 + clip.x * project.width;
  const centreY = project.height / 2 + (clip.y + animation.offsetY) * project.height;
  const blockHeight = lines.length * lineHeight;

  /*
   * Everything a pixel depends on, and nothing that doesn't. The resolved
   * values are used rather than the raw clip fields, so the entrance
   * animation lands in here already evaluated for this instant.
   */
  const signature = [
    lines.join(' '),
    font,
    clip.align,
    clip.textColor,
    clip.backgroundColor,
    clip.strokeColor,
    clip.strokeWidth,
    centreX,
    centreY,
    lineHeight,
    animation.alpha,
    project.width,
    project.height
  ].join('|');

  // `getScratch` clears the surface, so it is only reached on a real miss.
  if (textSignatures.get(key) === signature) {
    const cached = peekScratch(key, project.width, project.height);
    if (cached) return cached;
  }

  const surface = getScratch(key, project.width, project.height);
  if (!surface) return null;
  const context = surface.context;
  textSignatures.set(key, signature);

  context.font = font;
  context.textAlign = clip.align;
  context.textBaseline = 'middle';

  context.globalAlpha = animation.alpha;

  if (clip.backgroundColor !== 'transparent') {
    const widest = Math.max(...lines.map(line => context.measureText(line).width));
    const padX = fontSize * 0.4;
    const padY = fontSize * 0.25;
    const boxLeft = clip.align === 'left' ? centreX : clip.align === 'right' ? centreX - widest : centreX - widest / 2;
    context.fillStyle = clip.backgroundColor;
    roundedRect(context, boxLeft - padX, centreY - blockHeight / 2 - padY, widest + padX * 2, blockHeight + padY * 2, fontSize * 0.2);
    context.fill();
  }

  lines.forEach((line, index) => {
    const y = centreY - blockHeight / 2 + lineHeight * (index + 0.5);
    if (clip.strokeWidth > 0) {
      context.lineWidth = clip.strokeWidth * fontSize * 0.1;
      context.strokeStyle = clip.strokeColor;
      context.lineJoin = 'round';
      context.strokeText(line, centreX, y);
    }
    context.fillStyle = clip.textColor;
    context.fillText(line, centreX, y);
  });

  return surface;
};

const roundedRect = (context: Context2D, x: number, y: number, width: number, height: number, radius: number) => {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + width, y, x + width, y + height, r);
  context.arcTo(x + width, y + height, x, y + height, r);
  context.arcTo(x, y + height, x, y, r);
  context.arcTo(x, y, x + width, y, r);
  context.closePath();
};
