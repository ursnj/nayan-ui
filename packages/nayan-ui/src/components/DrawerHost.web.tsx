import { reducedMotionQuery } from '../native/reducedMotion.web';
import { type CSSProperties, useEffect, useRef } from 'react';
import { prepareWasm } from '../native/wasm.web';
import type { DrawerHostProps } from './NDrawer';

type Core = {
  engine_drawer_new(): number;
  engine_drawer_free(handle: number): void;
  engine_drawer_configure(handle: number, width: number, viewport: number, edge: number, flags: number): number;
  engine_drawer_input(handle: number, action: number, x: number, y: number, time: number): number;
};

/** DOM only applies the Rust/WASM motion samples and owns browser accessibility/input. */
export function DrawerHost(props: DrawerHostProps) {
  const root = useRef<HTMLDivElement>(null),
    panel = useRef<HTMLDivElement>(null),
    content = useRef<HTMLDivElement>(null),
    scrim = useRef<HTMLDivElement>(null);
  const current = useRef(props);
  current.current = props;
  const driver = useRef<{ configure(): void; target(): void } | null>(null);
  useEffect(() => {
    let alive = true,
      handle = 0,
      core: Core | null = null,
      frame = 0,
      previous = 0,
      state = 0;
    let pointer: number | null = null,
      captured = false,
      cancelClick = false;
    let wasVisible = false;
    let previousFocus: HTMLElement | null = null;
    const motion = window.matchMedia(reducedMotionQuery);
    const flags = () => Math.floor(state / 2);
    const tick = (time: number) => {
      frame = 0;
      sample(core!.engine_drawer_input(handle, 0, previous ? Math.min(0.05, (time - previous) / 1000) : 1 / 60, 0, 0));
      previous = time;
      if (!(flags() & 1)) previous = 0;
    };
    const sample = (next: number) => {
      state = next;
      const p = state - flags() * 2,
        visible = p > 0 || !!(flags() & 2);
      if (panel.current) {
        panel.current.style.transform = `translateX(${(current.current.right ? 1 : -1) * (1 - p) * 100}%)`;
        panel.current.style.visibility = visible ? 'visible' : 'hidden';
        panel.current.inert = !visible;
      }
      if (scrim.current) {
        scrim.current.style.opacity = String(p);
        scrim.current.style.visibility = visible ? 'visible' : 'hidden';
      }
      if (content.current) content.current.inert = visible;
      if (visible !== wasVisible) {
        if (visible) {
          previousFocus = document.activeElement as HTMLElement | null;
          panel.current?.focus();
        } else {
          previousFocus?.focus();
          previousFocus = null;
        }
        wasVisible = visible;
      }
      if (flags() & 16 && alive) current.current.onChange(!!(flags() & 2));
      if (flags() & 1 && !frame && !document.hidden) frame = requestAnimationFrame(tick);
    };
    const configure = () => {
      if (!core || !handle || !root.current) return;
      const p = current.current;
      sample(
        core.engine_drawer_configure(
          handle,
          p.width,
          root.current.clientWidth,
          p.edgeWidth,
          (p.enabled ? 1 : 0) | (p.swipeEnabled ? 2 : 0) | (p.right ? 4 : 0) | (motion.matches ? 8 : 0)
        )
      );
    };
    const target = () => {
      if (core && handle) sample(core.engine_drawer_input(handle, 1, current.current.open ? 1 : 0, 0, 0));
    };
    const input = (action: number, event: PointerEvent) => {
      const rect = root.current!.getBoundingClientRect();
      sample(core!.engine_drawer_input(handle, action, event.clientX - rect.left, event.clientY - rect.top, event.timeStamp / 1000));
    };
    const down = (event: PointerEvent) => {
      if (!core || !event.isPrimary || event.button !== 0 || pointer !== null) return;
      cancelClick = false;
      input(2, event);
      if (flags() & 8) pointer = event.pointerId;
    };
    const move = (event: PointerEvent) => {
      if (pointer !== event.pointerId || !core) return;
      input(3, event);
      if (flags() & 4) {
        if (!captured) {
          root.current!.setPointerCapture(event.pointerId);
          captured = true;
        }
        event.preventDefault();
        event.stopPropagation();
      }
    };
    const up = (event: PointerEvent) => {
      if (pointer !== event.pointerId || !core) return;
      const dragged = captured;
      input(event.type === 'pointerup' ? 4 : 5, event);
      pointer = null;
      captured = false;
      cancelClick = dragged;
      if (root.current!.hasPointerCapture(event.pointerId)) root.current!.releasePointerCapture(event.pointerId);
      if (dragged) {
        event.preventDefault();
        event.stopPropagation();
      }
    };
    const click = (event: MouseEvent) => {
      if (cancelClick) {
        cancelClick = false;
        event.preventDefault();
        event.stopPropagation();
      }
    };
    const key = (event: KeyboardEvent) => {
      if (!current.current.open) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();
        current.current.onChange(false);
      }
      if (event.key === 'Tab' && panel.current) {
        const items = Array.from(panel.current.querySelectorAll<HTMLElement>('button,a[href],input,select,textarea,[tabindex="0"]')).filter(
          (el) => !el.hasAttribute('disabled') && !el.hidden
        );
        const first = items[0],
          last = items.at(-1);
        if (!first) {
          event.preventDefault();
          panel.current.focus();
        } else if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === panel.current)) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    const visibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(frame);
        frame = 0;
        previous = 0;
        pointer = null;
        captured = false;
        if (core) sample(core.engine_drawer_input(handle, 5, 0, 0, 0));
      } else configure();
    };
    const node = root.current!;
    node.addEventListener('pointerdown', down, true);
    node.addEventListener('pointermove', move, true);
    node.addEventListener('pointerup', up, true);
    node.addEventListener('pointercancel', up, true);
    node.addEventListener('click', click, true);
    node.addEventListener('keydown', key, true);
    document.addEventListener('visibilitychange', visibility);
    motion.addEventListener('change', configure);
    window.addEventListener('resize', configure);
    const resize = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(configure);
    resize?.observe(node);
    driver.current = { configure, target };
    void prepareWasm().then((value) => {
      if (!alive) return;
      core = value as unknown as Core;
      handle = core.engine_drawer_new();
      configure();
      target();
    });
    return () => {
      alive = false;
      driver.current = null;
      cancelAnimationFrame(frame);
      node.removeEventListener('pointerdown', down, true);
      node.removeEventListener('pointermove', move, true);
      node.removeEventListener('pointerup', up, true);
      node.removeEventListener('pointercancel', up, true);
      node.removeEventListener('click', click, true);
      node.removeEventListener('keydown', key, true);
      document.removeEventListener('visibilitychange', visibility);
      motion.removeEventListener('change', configure);
      window.removeEventListener('resize', configure);
      resize?.disconnect();
      if (core && handle) core.engine_drawer_free(handle);
      previousFocus?.focus();
    };
  }, []);
  useEffect(() => {
    driver.current?.configure();
  }, [props.width, props.edgeWidth, props.enabled, props.swipeEnabled, props.right]);
  useEffect(() => {
    driver.current?.target();
  }, [props.open, props.command]);
  return (
    <div ref={root} style={{ flex: 1, minHeight: 0, display: 'flex', position: 'relative', overflow: 'hidden', touchAction: 'pan-y' }}>
      <div ref={content} style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {props.children}
      </div>
      <div
        ref={scrim}
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, background: props.overlayColor, opacity: 0, visibility: 'hidden' }}
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal={props.open || undefined}
        aria-label={props.accessibilityLabel}
        tabIndex={-1}
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          [props.right ? 'right' : 'left']: 0,
          width: `min(${props.width}px, 100%)`,
          display: 'flex',
          flexDirection: 'column',
          visibility: 'hidden',
          transform: `translateX(${props.right ? 100 : -100}%)`,
          touchAction: 'pan-y',
          ...(props.drawerStyle as CSSProperties)
        }}>
        {props.drawerContent}
      </div>
    </div>
  );
}
