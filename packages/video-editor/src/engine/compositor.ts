import { clamp } from '../lib/utils';
import { getImageBitmap, getReader } from '../media/library';
import { US, clipEndUs, isTextClip, sourceTimeUs } from '../types';
import type { Clip, Filters, MediaClip, ProjectSettings, TextClip, Track, Transform } from '../types';

export interface Scene {
  project: ProjectSettings;
  tracks: Track[];
  clips: Clip[];
}

type Context2D = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

/**
 * Draws the timeline at a single instant. Preview and export share this so the
 * exported file matches what the user saw — the only difference is the canvas
 * they're handed.
 */
export const renderScene = async (context: Context2D, scene: Scene, timeUs: number) => {
  const { project } = scene;

  context.save();
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.globalAlpha = 1;
  context.filter = 'none';
  context.fillStyle = project.backgroundColor;
  context.fillRect(0, 0, project.width, project.height);
  context.restore();

  for (const layer of visibleLayers(scene, timeUs)) {
    // Await then draw immediately: a reader's sample is only valid until the
    // next call on that same reader.
    if (isTextClip(layer)) {
      drawText(context, layer, project, timeUs);
    } else {
      await drawMedia(context, layer, project, timeUs);
    }
  }
};

/** Clips that should be on screen at `timeUs`, in bottom-to-top draw order. */
export const visibleLayers = (scene: Scene, timeUs: number): Clip[] => {
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

/** Fade-in/out envelope, also reused for audio gain so the two stay in step. */
export const envelopeAt = (clip: Clip, timeUs: number): number => {
  const local = timeUs - clip.startUs;
  const remaining = clip.durationUs - local;
  let gain = 1;
  if (clip.fadeInUs > 0) gain = Math.min(gain, clamp(local / clip.fadeInUs, 0, 1));
  if (clip.fadeOutUs > 0) gain = Math.min(gain, clamp(remaining / clip.fadeOutUs, 0, 1));
  return gain;
};

const filterString = (filters: Filters, scale: number): string => {
  const parts: string[] = [];
  if (filters.brightness !== 1) parts.push(`brightness(${filters.brightness})`);
  if (filters.contrast !== 1) parts.push(`contrast(${filters.contrast})`);
  if (filters.saturation !== 1) parts.push(`saturate(${filters.saturation})`);
  if (filters.hueRotate !== 0) parts.push(`hue-rotate(${filters.hueRotate}deg)`);
  if (filters.grayscale > 0) parts.push(`grayscale(${filters.grayscale})`);
  if (filters.sepia > 0) parts.push(`sepia(${filters.sepia})`);
  // Blur is in project-resolution pixels, so scale it with the output.
  if (filters.blur > 0) parts.push(`blur(${filters.blur * scale}px)`);
  return parts.length ? parts.join(' ') : 'none';
};

/** Applies the clip's transform around the canvas centre. */
const applyTransform = (context: Context2D, transform: Transform, project: ProjectSettings) => {
  context.translate(project.width / 2 + transform.x * project.width, project.height / 2 + transform.y * project.height);
  if (transform.rotation) context.rotate((transform.rotation * Math.PI) / 180);
  const flipX = transform.flipH ? -1 : 1;
  const flipY = transform.flipV ? -1 : 1;
  context.scale(transform.scale * flipX, transform.scale * flipY);
};

/** Contain-fit: the whole frame is visible, letterboxed if aspect ratios differ. */
const containRect = (sourceWidth: number, sourceHeight: number, boxWidth: number, boxHeight: number) => {
  if (!sourceWidth || !sourceHeight) return { width: boxWidth, height: boxHeight };
  const scale = Math.min(boxWidth / sourceWidth, boxHeight / sourceHeight);
  return { width: sourceWidth * scale, height: sourceHeight * scale };
};

const drawMedia = async (context: Context2D, clip: MediaClip, project: ProjectSettings, timeUs: number) => {
  if (clip.kind === 'audio') return;

  const alpha = clip.opacity * envelopeAt(clip, timeUs);
  if (alpha <= 0.001) return;

  const scale = project.height / 1080;

  if (clip.kind === 'image') {
    const bitmap = getImageBitmap(clip.assetId);
    if (!bitmap) return;
    const size = containRect(bitmap.width, bitmap.height, project.width, project.height);
    context.save();
    context.globalAlpha = alpha;
    context.filter = filterString(clip.filters, scale);
    applyTransform(context, clip.transform, project);
    context.drawImage(bitmap, -size.width / 2, -size.height / 2, size.width, size.height);
    context.restore();
    return;
  }

  const reader = getReader(clip.id, clip.assetId);
  if (!reader) return;
  const sourceUs = sourceTimeUs(clip, timeUs);
  if (sourceUs === null) return;

  const sample = await reader.sampleAt(sourceUs / US);
  if (!sample) return;

  const size = containRect(sample.displayWidth, sample.displayHeight, project.width, project.height);
  context.save();
  context.globalAlpha = alpha;
  context.filter = filterString(clip.filters, scale);
  applyTransform(context, clip.transform, project);
  try {
    // VideoSample.draw handles rotation metadata and pixel aspect ratio.
    sample.draw(context, -size.width / 2, -size.height / 2, size.width, size.height);
  } catch {
    // The sample can be invalidated by a concurrent seek; skip this frame.
  }
  context.restore();
};

const drawText = (context: Context2D, clip: TextClip, project: ProjectSettings, timeUs: number) => {
  const alpha = clip.opacity * envelopeAt(clip, timeUs);
  if (alpha <= 0.001 || !clip.text.trim()) return;

  const fontSize = Math.max(1, clip.fontSize * project.height);
  const lineHeight = fontSize * 1.25;
  const lines = clip.text.split('\n');

  context.save();
  context.globalAlpha = alpha;
  context.font = `${clip.italic ? 'italic ' : ''}${clip.bold ? '700' : '400'} ${fontSize}px ${clip.fontFamily}`;
  context.textAlign = clip.align;
  context.textBaseline = 'middle';

  const centreX = project.width / 2 + clip.x * project.width;
  const centreY = project.height / 2 + clip.y * project.height;
  const blockHeight = lines.length * lineHeight;

  if (clip.backgroundColor !== 'transparent') {
    const widest = Math.max(...lines.map(line => context.measureText(line).width));
    const padX = fontSize * 0.4;
    const padY = fontSize * 0.25;
    const boxLeft = clip.align === 'left' ? centreX : clip.align === 'right' ? centreX - widest : centreX - widest / 2;
    context.fillStyle = clip.backgroundColor;
    context.fillRect(boxLeft - padX, centreY - blockHeight / 2 - padY, widest + padX * 2, blockHeight + padY * 2);
  }

  lines.forEach((line, index) => {
    const y = centreY - blockHeight / 2 + lineHeight * (index + 0.5);
    if (clip.strokeWidth > 0) {
      context.lineWidth = clip.strokeWidth * fontSize * 0.1;
      context.strokeStyle = clip.strokeColor;
      context.lineJoin = 'round';
      context.strokeText(line, centreX, y);
    }
    context.fillStyle = clip.color;
    context.fillText(line, centreX, y);
  });

  context.restore();
};
