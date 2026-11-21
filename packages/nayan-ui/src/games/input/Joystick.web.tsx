import { type CSSProperties, type PointerEvent, useCallback, useEffect, useRef } from 'react';
export type JoystickState = { x: number; y: number };
export function useJoystick(): JoystickState {
  return useRef<JoystickState>({ x: 0, y: 0 }).current;
}
export interface JoystickProps {
  state: JoystickState;
  size?: number;
  style?: CSSProperties;
}
export function Joystick({ state, size = 150, style }: JoystickProps) {
  const knob = useRef<HTMLDivElement>(null);
  const pointer = useRef<number | null>(null);
  const origin = useRef({ x: 0, y: 0 });
  const reach = size * 0.3;
  const reset = useCallback(() => {
    pointer.current = null;
    state.x = state.y = 0;
    if (knob.current) knob.current.style.transform = 'translate(0px, 0px)';
  }, [state]);
  useEffect(() => {
    const visibility = () => {
      if (document.hidden) reset();
    };
    window.addEventListener('blur', reset);
    document.addEventListener('visibilitychange', visibility);
    return () => {
      reset();
      window.removeEventListener('blur', reset);
      document.removeEventListener('visibilitychange', visibility);
    };
  }, [reset]);
  const move = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerId !== pointer.current) return;
    const x = e.clientX - origin.current.x,
      y = e.clientY - origin.current.y;
    const scale = Math.min(1, reach / Math.max(1, Math.hypot(x, y)));
    state.x = (x * scale) / reach;
    state.y = (-y * scale) / reach;
    knob.current!.style.transform = `translate(${x * scale}px, ${y * scale}px)`;
  };
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        borderRadius: size / 2,
        boxSizing: 'border-box',
        background: 'rgba(255,255,255,0.08)',
        border: '2px solid rgba(255,255,255,0.25)',
        touchAction: 'none',
        ...style
      }}
      onPointerDown={(e) => {
        if (pointer.current !== null || e.button !== 0) return;
        e.preventDefault();
        pointer.current = e.pointerId;
        origin.current = { x: e.clientX, y: e.clientY };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={move}
      onPointerUp={(e) => {
        if (e.pointerId === pointer.current) reset();
      }}
      onPointerCancel={reset}
      onLostPointerCapture={(e) => {
        if (e.pointerId === pointer.current) reset();
      }}>
      <div
        ref={knob}
        style={{
          pointerEvents: 'none',
          width: size * 0.4,
          height: size * 0.4,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.55)'
        }}
      />
    </div>
  );
}
