import { afterAll, afterEach, expect, mock, test } from 'bun:test';
import { installDom } from '../../../__tests__/dom';
import { createKeyboardInput, type KeyboardInputMode } from '../keyboard';

const dom = installDom();
const previousElement = Object.getOwnPropertyDescriptor(globalThis, 'Element');
const previousCustomEvent = Object.getOwnPropertyDescriptor(globalThis, 'CustomEvent');
Object.defineProperty(globalThis, 'CustomEvent', {
  configurable: true,
  value: dom.window.CustomEvent
});
Object.defineProperty(globalThis, 'Element', {
  configurable: true,
  value: dom.window.Element
});
const responder = await import('../../render/responder.web');
mock.module('../../render/responder', () => responder);
const { createTouchResponder } = await import('../../render/touch');
const previousFrame = globalThis.requestAnimationFrame;
const previousCancel = globalThis.cancelAnimationFrame;
const frames = new Map<number, FrameRequestCallback>();
let nextFrame = 0,
  clock = performance.now();
globalThis.requestAnimationFrame = (run) => {
  frames.set(++nextFrame, run);
  return nextFrame;
};
globalThis.cancelAnimationFrame = (id) => {
  if (id !== null && id !== undefined) frames.delete(id);
};
let keyboard: ReturnType<typeof createKeyboardInput>;
let touch: ReturnType<typeof createTouchResponder>;
let surface: HTMLDivElement;
const drag = mock((_event: import('../../render/GameView').DragEvent) => {});
const tap = mock((_x: number, _y: number) => {});
const swipe = mock((_direction: string) => {});
const overlay = mock((_phase: string, _x: number, y: number) => y > 550);

function setup(mode: KeyboardInputMode = 'pointer', enabled = () => true) {
  surface = document.createElement('div');
  Object.defineProperties(surface, {
    clientWidth: { value: 400 },
    clientHeight: { value: 600 }
  });
  surface.getBoundingClientRect = () => ({ left: 50, top: 70, width: 400, height: 600 }) as DOMRect;
  document.body.append(surface);
  document.elementFromPoint = () => surface;
  touch = createTouchResponder(() => ({
    onDrag: drag,
    onTap: tap,
    onSwipe: swipe,
    onOverlayTouch: overlay
  }));
  const handlers = touch.responder.panHandlers as unknown as ReturnType<typeof responder.PanResponder.create>['panHandlers'];
  for (const [type, handler] of [
    ['pointerdown', handlers.onPointerDown],
    ['pointermove', handlers.onPointerMove],
    ['pointerup', handlers.onPointerUp],
    ['pointercancel', handlers.onPointerCancel]
  ] as const)
    surface.addEventListener(type, (event) => handler(event as never));
  keyboard = createKeyboardInput(surface, {
    mode,
    enabled,
    primary: () => ({ x: 200, y: 570 })
  });
}
function key(type: 'keydown' | 'keyup', code: string, repeat = false, target: EventTarget = window) {
  const event = new dom.window.KeyboardEvent(type, {
    code,
    repeat,
    bubbles: true,
    cancelable: true
  });
  target.dispatchEvent(event as unknown as Event);
  return event;
}
function step() {
  clock += 40;
  const callbacks = [...frames.values()];
  frames.clear();
  for (const run of callbacks) run(clock);
}
afterEach(() => {
  keyboard?.dispose();
  touch?.dispose();
  surface?.remove();
  document.body.replaceChildren();
  frames.clear();
  drag.mockClear();
  tap.mockClear();
  swipe.mockClear();
  overlay.mockClear();
});
afterAll(() => {
  globalThis.requestAnimationFrame = previousFrame;
  globalThis.cancelAnimationFrame = previousCancel;
  if (previousElement) Object.defineProperty(globalThis, 'Element', previousElement);
  else Reflect.deleteProperty(globalThis, 'Element');
  if (previousCustomEvent) Object.defineProperty(globalThis, 'CustomEvent', previousCustomEvent);
  else Reflect.deleteProperty(globalThis, 'CustomEvent');
  dom.cleanup();
});

test('keyboard cursor selects and drags through the existing pointer gesture recognizer', () => {
  setup();
  key('keydown', 'Space');
  key('keyup', 'Space');
  expect(tap).toHaveBeenCalledWith(200, 300);
  key('keydown', 'Space');
  key('keydown', 'ArrowRight');
  step();
  key('keyup', 'ArrowRight');
  key('keyup', 'Space');
  expect(drag.mock.calls.some(([event]) => event.phase === 'move' && event.dx > 0)).toBe(true);
  expect(drag.mock.calls.at(-1)?.[0].phase).toBe('end');
  expect(frames.size).toBe(0);
  expect(surface.querySelector<HTMLElement>('[data-engine-keyboard-cursor]')?.style.display).toBe('block');
});

test('WASD holds directional movement and releases immediately; blur cancels held input', () => {
  setup('drag');
  key('keydown', 'KeyW');
  step();
  expect(drag.mock.calls.some(([event]) => event.dy < 0)).toBe(true);
  key('keyup', 'KeyW');
  expect(drag.mock.calls.at(-1)?.[0].phase).toBe('end');
  expect(frames.size).toBe(0);
  key('keydown', 'KeyD');
  step();
  window.dispatchEvent(new Event('blur'));
  expect(drag.mock.calls.at(-1)?.[0].cancelled).toBe(true);
  expect(frames.size).toBe(0);
});

test('direction keys produce complete discrete swipes for grid movement', () => {
  setup('swipe');
  key('keydown', 'ArrowLeft');
  key('keydown', 'KeyS');
  expect(swipe.mock.calls.map(([direction]) => direction)).toEqual(['left', 'down']);
  expect(frames.size).toBe(0);
});

test('Enter activates the primary engine overlay once, without leaking a gameplay tap', () => {
  setup();
  key('keydown', 'Enter');
  key('keydown', 'Enter', true);
  expect(overlay.mock.calls).toEqual([
    ['start', 200, 570],
    ['end', 200, 570]
  ]);
  expect(tap).not.toHaveBeenCalled();
  expect(drag).not.toHaveBeenCalled();
});

test('an engine primary action claims Enter before the pointer fallback', () => {
  setup();
  const primary = mock((event: Event) => event.preventDefault());
  surface.addEventListener('nayan-engine-primary-action', primary);
  key('keydown', 'Enter');
  expect(primary).toHaveBeenCalledTimes(1);
  expect(tap).not.toHaveBeenCalled();
  expect(drag).not.toHaveBeenCalled();
});

test('keyboard input leaves focused controls and text entry alone and stops when disabled or disposed', () => {
  let enabled = true;
  setup('drag', () => enabled);
  const input = document.createElement('input');
  surface.append(input);
  input.focus();
  expect(key('keydown', 'KeyW', false, input).defaultPrevented).toBe(false);
  expect(drag).not.toHaveBeenCalled();
  input.blur();
  key('keydown', 'ArrowRight');
  step();
  input.focus();
  expect(drag.mock.calls.at(-1)?.[0].cancelled).toBe(true);
  expect(frames.size).toBe(0);
  input.blur();
  key('keydown', 'ArrowRight');
  step();
  enabled = false;
  step();
  expect(drag.mock.calls.at(-1)?.[0].cancelled).toBe(true);
  expect(frames.size).toBe(0);
  keyboard.dispose();
  const count = drag.mock.calls.length;
  enabled = true;
  key('keydown', 'KeyD');
  step();
  expect(drag.mock.calls).toHaveLength(count);
  expect(surface.querySelector('[data-engine-keyboard-cursor]')).toBeNull();
});
