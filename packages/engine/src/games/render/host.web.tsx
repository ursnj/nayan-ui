import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { attachCanvas, detachCanvas } from '../../native/NativeNayanEngine.web';
import { PRIMARY_INPUT_EVENT } from '../input/keyboard';
import { createTouchResponder } from './touch';

export { createTouchResponder };
export type ViewStyle = CSSProperties;
export const pixelRatio = () => (typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1);
export function useActive() {
  const [active, setActive] = useState(typeof document === 'undefined' || !document.hidden);
  useEffect(() => {
    const changed = () => setActive(!document.hidden);
    document.addEventListener('visibilitychange', changed);
    return () => document.removeEventListener('visibilitychange', changed);
  }, []);
  return active;
}
interface SurfaceProps {
  surfaceId: number;
  style?: CSSProperties;
  onSize: (width: number, height: number) => void;
  onError: (error: Error) => void;
  touch?: ReturnType<typeof createTouchResponder>;
  onPrimaryAction?: () => void;
}
export function Surface({ surfaceId, style, onSize, onError, touch, onPrimaryAction }: SurfaceProps) {
  const parent = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const live = useRef({ onSize, onError, touch, onPrimaryAction });
  live.current = { onSize, onError, touch, onPrimaryAction };
  useEffect(() => {
    let alive = true;
    const measure = () => {
      if (!alive || !parent.current) return;
      const rect = parent.current.getBoundingClientRect();
      live.current.onSize(rect.width, rect.height);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(parent.current!);
    void attachCanvas(surfaceId, canvas.current!)
      .then(() => {
        if (!alive) detachCanvas(surfaceId);
      })
      .catch((error) => {
        if (alive) live.current.onError(error instanceof Error ? error : new Error(String(error)));
      });
    const cancel = () => live.current.touch?.cancel();
    const primary = (event: Event) => {
      if (live.current.onPrimaryAction) {
        event.preventDefault();
        live.current.onPrimaryAction();
      }
    };
    const element = parent.current!;
    element.addEventListener(PRIMARY_INPUT_EVENT, primary);
    const visibility = () => {
      if (document.hidden) cancel();
    };
    window.addEventListener('blur', cancel);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      alive = false;
      observer.disconnect();
      cancel();
      element.removeEventListener(PRIMARY_INPUT_EVENT, primary);
      window.removeEventListener('blur', cancel);
      document.removeEventListener('visibilitychange', visibility);
      detachCanvas(surfaceId);
    };
  }, [surfaceId]);
  return (
    <div
      ref={parent}
      style={{
        position: 'relative',
        flex: 1,
        minWidth: 0,
        minHeight: 0,
        overflow: 'hidden',
        touchAction: 'none',
        ...style
      }}
      {...touch?.responder.panHandlers}>
      <canvas
        ref={canvas}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          display: 'block'
        }}
      />
    </div>
  );
}
