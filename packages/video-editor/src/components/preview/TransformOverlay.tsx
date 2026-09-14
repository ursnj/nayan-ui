import { useCallback, useRef } from 'react';
import { containRect } from '../../engine/compositor';
import { clamp } from '../../lib/utils';
import { readEditorState, useEditor } from '../../store/editor';
import { isMediaClip, isTextClip, TEXT_LINE_HEIGHT } from '../../types';
import type { Clip, MediaAsset, ProjectSettings } from '../../types';

/**
 * A clip's on-screen box, expressed in frame fractions so the overlay behaves
 * identically at any preview zoom. `x`/`y` are the centre relative to the
 * frame centre.
 */
interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

type Handle = 'move' | 'nw' | 'ne' | 'sw' | 'se' | 'rotate';

interface TransformOverlayProps {
  clip: Clip;
  project: ProjectSettings;
  /** Displayed size of the preview canvas, in CSS pixels. */
  displayWidth: number;
  displayHeight: number;
}

/**
 * Direct manipulation on top of the preview.
 *
 * Media clips and text store geometry differently — a transform versus x/y
 * plus font size. The overlay reads and writes through one `Box` so the drag
 * maths lives in exactly one place.
 *
 * Scaling is applied as a *factor against the state at drag start*, not against
 * the live clip; deriving it from the live value each frame would compound and
 * accelerate the drag.
 */
export const TransformOverlay = ({ clip, project, displayWidth, displayHeight }: TransformOverlayProps) => {
  const assets = useEditor(state => state.assets);
  const updateClip = useEditor(state => state.updateClip);
  const dragRef = useRef<{ handle: Handle; startBox: Box; startClip: Clip; startX: number; startY: number } | null>(null);

  const box = readBox(clip, project, assets);

  const beginDrag = useCallback(
    (handle: Handle) => (event: React.PointerEvent) => {
      event.preventDefault();
      event.stopPropagation();

      const state = readEditorState();
      const startClip = state.clips.find(entry => entry.id === clip.id);
      if (!startClip) return;
      const startBox = readBox(startClip, project, state.assets);
      if (!startBox) return;

      dragRef.current = { handle, startBox, startClip, startX: event.clientX, startY: event.clientY };
      state.beginInteraction();

      const move = (moveEvent: PointerEvent) => {
        const drag = dragRef.current;
        if (!drag) return;
        // Pointer delta in frame fractions.
        const dx = (moveEvent.clientX - drag.startX) / displayWidth;
        const dy = (moveEvent.clientY - drag.startY) / displayHeight;
        const next = applyHandle(drag.handle, drag.startBox, dx, dy, moveEvent.shiftKey);
        writeBox(drag.startClip, drag.startBox, next, updateClip);
      };

      const up = () => {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
        dragRef.current = null;
        readEditorState().endInteraction();
      };

      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    },
    [clip.id, displayHeight, displayWidth, project, updateClip]
  );

  if (!box) return null;

  const width = box.width * displayWidth;
  const height = box.height * displayHeight;
  const left = displayWidth / 2 + box.x * displayWidth - width / 2;
  const top = displayHeight / 2 + box.y * displayHeight - height / 2;

  const handleClass = 'absolute h-2.5 w-2.5 rounded-sm border border-white bg-accent shadow-md';

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <div
        className="pointer-events-auto absolute cursor-move border border-accent"
        style={{ left, top, width, height, transform: `rotate(${box.rotation}deg)` }}
        onPointerDown={beginDrag('move')}>
        <span className={`${handleClass} -left-1.5 -top-1.5 cursor-nwse-resize`} onPointerDown={beginDrag('nw')} role="presentation" />
        <span className={`${handleClass} -right-1.5 -top-1.5 cursor-nesw-resize`} onPointerDown={beginDrag('ne')} role="presentation" />
        <span className={`${handleClass} -bottom-1.5 -left-1.5 cursor-nesw-resize`} onPointerDown={beginDrag('sw')} role="presentation" />
        <span className={`${handleClass} -bottom-1.5 -right-1.5 cursor-nwse-resize`} onPointerDown={beginDrag('se')} role="presentation" />

        {/* Rotation grip, floated above the box like every design tool. */}
        <span className="absolute -top-3 left-1/2 h-3 w-px -translate-x-1/2 bg-accent" />
        <span
          className="absolute -top-[26px] left-1/2 h-3.5 w-3.5 -translate-x-1/2 cursor-grab rounded-full border border-white bg-accent shadow-md"
          onPointerDown={beginDrag('rotate')}
          role="presentation"
        />
      </div>
    </div>
  );
};

const applyHandle = (handle: Handle, start: Box, dx: number, dy: number, constrain: boolean): Box => {
  if (handle === 'move') {
    // Shift constrains to the dominant axis.
    if (constrain) {
      return Math.abs(dx) > Math.abs(dy) ? { ...start, x: start.x + dx } : { ...start, y: start.y + dy };
    }
    return { ...start, x: start.x + dx, y: start.y + dy };
  }

  if (handle === 'rotate') {
    const degrees = start.rotation + dx * 180;
    return { ...start, rotation: constrain ? Math.round(degrees / 15) * 15 : Math.round(degrees) };
  }

  // Corner handles scale about the centre. Following the dominant axis keeps
  // the aspect ratio locked, which is what you want for footage.
  const signX = handle === 'ne' || handle === 'se' ? 1 : -1;
  const signY = handle === 'sw' || handle === 'se' ? 1 : -1;
  const deltaX = (dx * signX * 2) / Math.max(start.width, 0.001);
  const deltaY = (dy * signY * 2) / Math.max(start.height, 0.001);
  const factor = Math.max(0.05, 1 + (Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY));

  return { ...start, width: start.width * factor, height: start.height * factor };
};

/** Reads a clip's geometry into the shared box form. */
const readBox = (clip: Clip, project: ProjectSettings, assets: MediaAsset[]): Box | null => {
  if (isTextClip(clip)) {
    // Text has no intrinsic box; approximate one from the font metrics so the
    // handles land somewhere sensible.
    const lines = clip.text.split('\n');
    const height = clip.fontSize * TEXT_LINE_HEIGHT * Math.max(1, lines.length);
    const longest = Math.max(...lines.map(line => line.length), 1);
    const width = Math.min(1.8, ((clip.fontSize * longest * 0.55) / project.width) * project.height);
    return { x: clip.x, y: clip.y, width, height, rotation: clip.transform.rotation };
  }


  if (isMediaClip(clip)) {
    if (clip.kind === 'audio') return null;
    const asset = assets.find(entry => entry.id === clip.assetId);
    const fitted = containRect(asset?.width || project.width, asset?.height || project.height, project.width, project.height);
    const { scale } = clip.transform;
    return {
      x: clip.transform.x,
      y: clip.transform.y,
      width: (fitted.width / project.width) * scale,
      height: (fitted.height / project.height) * scale,
      rotation: clip.transform.rotation
    };
  }

  return null;
};

/** Writes the box back into whichever fields the clip actually uses. */
const writeBox = (startClip: Clip, startBox: Box, box: Box, updateClip: (id: string, patch: Partial<Clip>) => void) => {
  // Scale is relative to where the drag began, so it can't compound.
  const factor = startBox.width > 0 ? box.width / startBox.width : 1;
  const rotation = box.rotation;

  if (isTextClip(startClip)) {
    updateClip(startClip.id, {
      x: clamp(box.x, -1.5, 1.5),
      y: clamp(box.y, -1.5, 1.5),
      fontSize: clamp(startClip.fontSize * factor, 0.01, 0.6),
      transform: { ...startClip.transform, rotation }
    } as Partial<Clip>);
    return;
  }


  updateClip(startClip.id, {
    transform: {
      ...startClip.transform,
      x: clamp(box.x, -2, 2),
      y: clamp(box.y, -2, 2),
      scale: clamp(startClip.transform.scale * factor, 0.05, 8),
      rotation
    }
  } as Partial<Clip>);
};
