import { type CSSProperties, memo, useEffect, useRef, useState } from 'react';
import { attachCanvas, detachCanvas } from '../NativeNayanEngine.web';
import { prepareEngine } from '../prepare';
import type { DocumentSurfaceProps } from './types';

function DocumentSurfaceView<Change>({
  document: drawing,
  mode = 'draw',
  background = '#ffffff',
  active = true,
  onError,
  onChange,
  style
}: DocumentSurfaceProps<Change>) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState('');
  const live = useRef({ mode, background, active, onError, onChange });
  live.current = { mode, background, active, onError, onChange };
  useEffect(() => {
    const canvas = ref.current!;
    setError('');
    let alive = true,
      ready = false,
      raf = 0,
      drawingPointer: number | null = null;
    const pointers = new Map<number, { x: number; y: number; pen: boolean }>();
    let lastEvent = 0;
    let wheelX = 0,
      wheelY = 0;
    let wheelClientX = 0,
      wheelClientY = 0;
    let oldDistance = 0,
      oldCenter = [0, 0];
    // Measure layout once per event: coalesced samples reuse the event's rectangle.
    const coords = (e: PointerEvent, r: DOMRect = canvas.getBoundingClientRect()) => ({
      x: e.clientX - r.left,
      y: e.clientY - r.top,
      pen: e.pointerType === 'pen'
    });
    const cancel = () => {
      if (drawingPointer !== null && !drawing.isDisposed) drawing.cancel();
      drawingPointer = null;
      pointers.clear();
      oldDistance = 0;
      wheelX = wheelY = 0;
    };
    const down = (e: PointerEvent) => {
      if (!ready || drawing.isDisposed || !live.current.active || e.button !== 0) return;
      if ([...pointers.values()].some((p) => p.pen) && e.pointerType !== 'pen') return;
      e.preventDefault();
      canvas.focus();
      canvas.setPointerCapture(e.pointerId);
      const p = coords(e);
      pointers.set(e.pointerId, p);
      if (pointers.size === 1 && (live.current.mode === 'draw' || live.current.mode === 'components')) {
        drawingPointer = e.pointerId;
        drawing.input(0, p.x, p.y, p.pen ? e.pressure : 1);
      } else {
        if (drawingPointer !== null && !drawing.isDisposed) drawing.cancel();
        drawingPointer = null;
        oldDistance = 0;
      }
    };
    const move = (e: PointerEvent) => {
      if (!live.current.active || drawing.isDisposed) return;
      const previous = pointers.get(e.pointerId);
      if (!previous) return;
      const rect = canvas.getBoundingClientRect();
      const p = coords(e, rect);
      pointers.set(e.pointerId, p);
      if (e.pointerId === drawingPointer) {
        const coalesced = e.getCoalescedEvents?.();
        for (const sample of coalesced?.length ? coalesced : [e]) {
          const v = coords(sample, rect);
          drawing.input(1, v.x, v.y, v.pen ? sample.pressure : 1);
        }
      } else if (pointers.size > 1) {
        const points = [...pointers.values()];
        const a = points[0]!,
          b = points[1]!;
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        const center = [(a.x + b.x) / 2, (a.y + b.y) / 2];
        if (oldDistance > 0) drawing.transform(center[0]! - oldCenter[0]!, center[1]! - oldCenter[1]!, distance / oldDistance);
        oldDistance = distance;
        oldCenter = center;
      } else drawing.transform(p.x - previous.x, p.y - previous.y);
    };
    const up = (e: PointerEvent) => {
      if (drawingPointer === e.pointerId && !drawing.isDisposed) {
        const p = coords(e);
        drawing.input(e.type === 'pointercancel' ? 3 : 2, p.x, p.y, p.pen ? e.pressure : 1);
        drawingPointer = null;
      }
      pointers.delete(e.pointerId);
      oldDistance = 0;
    };
    const key = (e: KeyboardEvent) => {
      if (
        drawing.isDisposed ||
        !live.current.active ||
        !(e.ctrlKey || e.metaKey) ||
        live.current.mode === 'view' ||
        live.current.mode === 'components'
      )
        return;
      if (e.key.toLowerCase() === 'z') {
        e.preventDefault();
        e.shiftKey ? drawing.redo?.() : drawing.undo?.();
      } else if (e.key.toLowerCase() === 'y') {
        e.preventDefault();
        drawing.redo?.();
      }
    };
    const wheel = (e: WheelEvent) => {
      if (!ready || drawing.isDisposed || !live.current.active) return;
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 16 : e.deltaMode === 2 ? canvas.clientHeight : 1;
      if (live.current.mode === 'components' && !(e.ctrlKey || e.metaKey)) {
        // Trackpads can deliver several samples per display frame. Preserve their full distance
        // and let Rust consume one input batch alongside the next paint.
        wheelX -= e.deltaX * unit;
        wheelY -= e.deltaY * unit;
        wheelClientX = e.clientX;
        wheelClientY = e.clientY;
      } else {
        e.ctrlKey || e.metaKey ? drawing.transform(0, 0, Math.exp(-e.deltaY * unit * 0.003)) : drawing.transform(-e.deltaX * unit, -e.deltaY * unit);
      }
    };
    const visibility = () => {
      if (document.hidden) cancel();
    };
    const render = () => {
      if (!alive) return;
      if (ready && !drawing.isDisposed && live.current.active && !document.hidden) {
        const bounds = canvas.getBoundingClientRect();
        const ratio = Math.min(window.devicePixelRatio || 1, 3);
        const w = Math.max(1, Math.round(bounds.width * ratio)),
          h = Math.max(1, Math.round(bounds.height * ratio));
        if (canvas.width !== w || canvas.height !== h) {
          canvas.width = w;
          canvas.height = h;
        }
        try {
          if (wheelX || wheelY) {
            drawing.pointer?.(wheelClientX - bounds.left, wheelClientY - bounds.top);
            drawing.transform(wheelX, wheelY);
            wheelX = wheelY = 0;
          }
          drawing.present(bounds.width, bounds.height, live.current.background, ratio);
          if (live.current.onChange && (live.current.mode === 'components' || performance.now() - lastEvent >= 100)) {
            lastEvent = performance.now();
            const state = drawing.readChange();
            if (state) live.current.onChange(state);
          }
        } catch (failure) {
          ready = false;
          const error = failure instanceof Error ? failure : new Error(String(failure));
          live.current.onError?.(error);
          setError(error.message);
        }
      }
      raf = requestAnimationFrame(render);
    };
    void Promise.resolve(prepareEngine())
      .then(() => (alive ? attachCanvas(drawing.id, canvas) : undefined))
      .then(() => {
        if (alive && !drawing.isDisposed) {
          drawing.invalidateView();
          ready = true;
        } else detachCanvas(drawing.id);
      })
      .catch((failure) => {
        if (!alive) return;
        const error = failure instanceof Error ? failure : new Error(String(failure));
        live.current.onError?.(error);
        setError(error.message);
      });
    canvas.addEventListener('pointerdown', down);
    canvas.addEventListener('pointermove', move);
    canvas.addEventListener('pointerup', up);
    canvas.addEventListener('pointercancel', up);
    canvas.addEventListener('lostpointercapture', up);
    canvas.addEventListener('keydown', key);
    canvas.addEventListener('wheel', wheel, { passive: false });
    window.addEventListener('blur', cancel);
    document.addEventListener('visibilitychange', visibility);
    raf = requestAnimationFrame(render);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
      cancel();
      detachCanvas(drawing.id);
      canvas.removeEventListener('pointerdown', down);
      canvas.removeEventListener('pointermove', move);
      canvas.removeEventListener('pointerup', up);
      canvas.removeEventListener('pointercancel', up);
      canvas.removeEventListener('lostpointercapture', up);
      canvas.removeEventListener('keydown', key);
      canvas.removeEventListener('wheel', wheel);
      window.removeEventListener('blur', cancel);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [drawing]);
  return (
    <canvas
      ref={ref}
      data-nayan-component-canvas={mode === 'components' ? '' : undefined}
      tabIndex={0}
      aria-label={error ? `Drawing unavailable: ${error}` : 'Drawing canvas'}
      title={error || undefined}
      style={{
        display: 'block',
        flex: 1,
        width: '100%',
        height: '100%',
        minHeight: 0,
        touchAction: 'none',
        outline: 'none',
        ...(style as CSSProperties)
      }}
    />
  );
}

export const DocumentSurface = memo(DocumentSurfaceView) as typeof DocumentSurfaceView;
