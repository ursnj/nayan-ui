export type KeyboardInputMode = 'pointer' | 'drag' | 'swipe';
export const PRIMARY_INPUT_EVENT = 'nayan-engine-primary-action';
export interface KeyboardInputOptions {
  mode?: KeyboardInputMode;
  enabled?: () => boolean;
  /** Optional primary control, in CSS pixels relative to the input surface. */
  primary?: () => { x: number; y: number };
}

/** Browser keyboard adapter. Reuses pointer input, including engine gestures and raw contact surfaces. */
export function createKeyboardInput(surface: HTMLElement, options: KeyboardInputOptions = {}) {
  const mode = options.mode ?? 'pointer';
  const keys = new Set<string>();
  const directions: Record<string, readonly [number, number]> = {
    ArrowLeft: [-1, 0],
    KeyA: [-1, 0],
    ArrowRight: [1, 0],
    KeyD: [1, 0],
    ArrowUp: [0, -1],
    KeyW: [0, -1],
    ArrowDown: [0, 1],
    KeyS: [0, 1]
  };
  let point = { x: surface.clientWidth / 2, y: surface.clientHeight / 2 };
  let held: { target: Element; id: number } | undefined;
  let frame = 0;
  let last = 0;
  let disposed = false;
  const cursor = document.createElement('div');
  cursor.setAttribute('aria-hidden', 'true');
  cursor.dataset.engineKeyboardCursor = '';
  Object.assign(cursor.style, {
    position: 'absolute',
    width: '22px',
    height: '22px',
    border: '2px solid white',
    borderRadius: '50%',
    boxShadow: '0 0 0 2px #17122b, 0 2px 8px #000a',
    background: '#6f3ef460',
    pointerEvents: 'none',
    zIndex: '20',
    display: 'none',
    transform: 'translate(-50%, -50%)'
  });
  surface.appendChild(cursor);
  const show = () => {
    point.x = Math.max(2, Math.min(surface.clientWidth - 2, point.x));
    point.y = Math.max(2, Math.min(surface.clientHeight - 2, point.y));
    cursor.style.display = 'block';
    cursor.style.left = `${point.x}px`;
    cursor.style.top = `${point.y}px`;
  };
  const target = () => {
    const rect = surface.getBoundingClientRect();
    const element = document.elementFromPoint(rect.left + point.x, rect.top + point.y);
    return element && surface.contains(element) ? element : null;
  };
  const dispatch = (element: Element, type: string, id: number) => {
    const rect = surface.getBoundingClientRect();
    element.dispatchEvent(
      new PointerEvent(type, {
        bubbles: true,
        cancelable: true,
        pointerId: id,
        pointerType: 'mouse',
        isPrimary: id === -1,
        button: 0,
        buttons: type === 'pointerup' || type === 'pointercancel' ? 0 : 1,
        clientX: rect.left + point.x,
        clientY: rect.top + point.y
      })
    );
  };
  const down = () => {
    const element = target();
    if (!element || held) return;
    held = { target: element, id: -1 };
    dispatch(element, 'pointerdown', -1);
  };
  const up = (cancelled = false) => {
    if (!held) return;
    dispatch(held.target, cancelled ? 'pointercancel' : 'pointerup', held.id);
    held = undefined;
  };
  const tap = (id = -2) => {
    const element = target();
    if (!element) return;
    dispatch(element, 'pointerdown', id);
    dispatch(element, 'pointerup', id);
  };
  const cancel = () => {
    cancelAnimationFrame(frame);
    frame = 0;
    keys.clear();
    up(true);
    cursor.style.display = 'none';
  };
  const vector = () => {
    let x = 0,
      y = 0;
    for (const key of keys) {
      const direction = directions[key];
      if (direction) {
        x += direction[0];
        y += direction[1];
      }
    }
    const length = Math.max(1, Math.hypot(x, y));
    return { x: x / length, y: y / length };
  };
  const tick = (now: number) => {
    frame = 0;
    if (disposed || options.enabled?.() === false) {
      cancel();
      return;
    }
    const dt = Math.min(0.05, Math.max(0, (now - last) / 1000));
    last = now;
    const direction = vector();
    point.x = Math.max(2, Math.min(surface.clientWidth - 2, point.x + direction.x * 420 * dt));
    point.y = Math.max(2, Math.min(surface.clientHeight - 2, point.y + direction.y * 420 * dt));
    show();
    if (held) dispatch(held.target, 'pointermove', held.id);
    if (keys.size) frame = requestAnimationFrame(tick);
  };
  const editable = (event: KeyboardEvent) => {
    const element = event.target;
    return element instanceof Element && !!element.closest('input,textarea,select,button,a,[role=button],[role=switch],[contenteditable=true]');
  };
  const keyDown = (event: KeyboardEvent) => {
    if (event.altKey || event.ctrlKey || event.metaKey || event.defaultPrevented || editable(event)) return;
    if (options.enabled?.() === false) {
      cancel();
      return;
    }
    const focused = document.activeElement;
    if (focused && focused !== document.body && focused !== document.documentElement && !surface.contains(focused)) return;
    const direction = directions[event.code];
    if (!direction && event.code !== 'Space' && event.code !== 'Enter') return;
    event.preventDefault();
    if (event.code === 'Enter') {
      if (!event.repeat) {
        cancel();
        const action = new CustomEvent(PRIMARY_INPUT_EVENT, {
          bubbles: true,
          cancelable: true
        });
        if (!(surface.querySelector('canvas') ?? surface).dispatchEvent(action)) return;
        const previous = point;
        point = options.primary?.() ?? point;
        tap();
        point = previous;
      }
      return;
    }
    if (event.code === 'Space') {
      if (event.repeat) return;
      show();
      if (mode === 'pointer') down();
      else {
        const resume = !!held;
        up();
        tap();
        if (resume) down();
      }
      return;
    }
    if (mode === 'swipe') {
      const previous = point;
      point = { x: surface.clientWidth / 2, y: surface.clientHeight / 2 };
      down();
      point = {
        x: point.x + direction![0] * 80,
        y: point.y + direction![1] * 80
      };
      if (held) dispatch(held.target, 'pointermove', held.id);
      up();
      point = previous;
      return;
    }
    if (!keys.size && mode === 'drag') {
      point = { x: surface.clientWidth / 2, y: surface.clientHeight / 2 };
      down();
    }
    keys.add(event.code);
    show();
    if (!frame) {
      last = performance.now();
      frame = requestAnimationFrame(tick);
    }
  };
  const keyUp = (event: KeyboardEvent) => {
    if (event.code === 'Space' && mode === 'pointer') up();
    if (!keys.delete(event.code)) return;
    if (!keys.size) {
      cancelAnimationFrame(frame);
      frame = 0;
      if (mode === 'drag') up();
    }
  };
  const pointer = (event: PointerEvent) => {
    if (!event.isTrusted) return;
    if (event.type === 'pointerdown') {
      cancel();
      const control =
        event.target instanceof Element && event.target.closest('input,textarea,select,button,a,[role=button],[role=switch],[contenteditable=true]');
      if (!control) surface.focus({ preventScroll: true });
    }
    // Keep the keyboard cursor independent of mouse clicks on HUD controls.
    if (!held) cursor.style.display = 'none';
  };
  const visibility = () => {
    if (document.hidden) cancel();
  };
  const focus = () => {
    const element = document.activeElement;
    if (
      element &&
      element !== document.body &&
      (!surface.contains(element) || element.closest('input,textarea,select,button,a,[role=button],[role=switch],[contenteditable=true]'))
    )
      cancel();
  };
  window.addEventListener('keydown', keyDown);
  window.addEventListener('keyup', keyUp);
  window.addEventListener('blur', cancel);
  document.addEventListener('visibilitychange', visibility);
  document.addEventListener('focusin', focus);
  surface.addEventListener('pointerdown', pointer, true);
  surface.addEventListener('pointermove', pointer, true);
  return {
    cancel,
    dispose() {
      if (disposed) return;
      disposed = true;
      cancel();
      window.removeEventListener('keydown', keyDown);
      window.removeEventListener('keyup', keyUp);
      window.removeEventListener('blur', cancel);
      document.removeEventListener('visibilitychange', visibility);
      document.removeEventListener('focusin', focus);
      surface.removeEventListener('pointerdown', pointer, true);
      surface.removeEventListener('pointermove', pointer, true);
      cursor.remove();
    }
  };
}
