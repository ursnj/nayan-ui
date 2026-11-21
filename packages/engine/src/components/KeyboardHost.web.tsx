import { type CSSProperties, type ReactNode, useEffect, useRef } from 'react';
import type { KeyboardStore } from './keyboardStore';

export type KeyboardHostStyle = CSSProperties;
export interface KeyboardHostProps {
  children: ReactNode;
  toolbar: ReactNode;
  controller: KeyboardStore;
  enabled: boolean;
  offset?: number;
  style?: KeyboardHostStyle;
}
export const dismissKeyboard = () => {
  if (typeof document !== 'undefined' && document.activeElement instanceof HTMLElement) document.activeElement.blur();
};

/** Browsers own IME/viewport movement; observe it without preventing browser scrolling. */
export function KeyboardHost({ children, controller, enabled, style }: KeyboardHostProps) {
  const host = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!enabled) return;
    const viewport = window.visualViewport;
    let fullHeight = window.innerHeight;
    const update = () => {
      fullHeight = Math.max(fullHeight, window.innerHeight);
      const editing = host.current?.contains(document.activeElement) && document.activeElement?.matches('input,textarea,[contenteditable="true"]');
      const height = viewport && viewport.scale === 1 ? Math.max(0, fullHeight - viewport.height - viewport.offsetTop) : 0;
      controller.setKeyboard(Boolean(editing && height > 80), height);
    };
    viewport?.addEventListener('resize', update);
    window.addEventListener('resize', update);
    document.addEventListener('focusin', update);
    document.addEventListener('focusout', update);
    return () => {
      viewport?.removeEventListener('resize', update);
      window.removeEventListener('resize', update);
      document.removeEventListener('focusin', update);
      document.removeEventListener('focusout', update);
    };
  }, [controller, enabled]);
  return (
    <div ref={host} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, ...style }}>
      {children}
    </div>
  );
}
