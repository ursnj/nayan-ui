import type { PanResponderCallbacks } from 'react-native';
import { afterAll, afterEach, expect, mock, spyOn, test } from 'bun:test';
import type { DragEvent, PinchEvent } from '../GameView';

let callbacks: PanResponderCallbacks;
mock.module('../responder', () => ({
  PanResponder: {
    create(value: PanResponderCallbacks) {
      callbacks = value;
      return { panHandlers: {} };
    }
  }
}));
const { createTouchResponder } = await import('../touch');
type Handlers = Parameters<typeof createTouchResponder>[0];
const timers = new Map<number, { at: number; call: () => void }>();
const now = spyOn(Date, 'now');
const set = globalThis.setTimeout,
  clear = globalThis.clearTimeout;
let clock = 0,
  next = 0;
globalThis.setTimeout = ((call: () => void, ms: number) => {
  timers.set(++next, { at: clock + ms, call });
  return next;
}) as unknown as typeof setTimeout;
globalThis.clearTimeout = ((id: number) => {
  timers.delete(id);
}) as unknown as typeof clearTimeout;
function advance(ms: number) {
  clock += ms;
  now.mockReturnValue(clock);
  for (const [id, value] of timers)
    if (value.at <= clock) {
      timers.delete(id);
      value.call();
    }
}
let responder: ReturnType<typeof createTouchResponder>;
function setup(handlers: ReturnType<Handlers>) {
  responder = createTouchResponder(() => handlers);
  return handlers;
}
function event(touches = [{ pageX: 110, pageY: 220 }]) {
  return {
    nativeEvent: {
      locationX: 10,
      locationY: 20,
      pageX: 110,
      pageY: 220,
      touches
    }
  };
}
function send(phase: 'Grant' | 'Move' | 'Release' | 'Terminate', dx = 0, dy = 0, touches?: { pageX: number; pageY: number }[]) {
  callbacks[`onPanResponder${phase}`]?.(event(touches) as never, { dx, dy } as never);
}
afterEach(() => {
  responder?.dispose();
  timers.clear();
  clock = 0;
  now.mockReturnValue(clock);
});
afterAll(() => {
  now.mockRestore();
  globalThis.setTimeout = set;
  globalThis.clearTimeout = clear;
});

test('tap and drag use local coordinates, live handlers and strict distance/time boundaries', () => {
  now.mockReturnValue(0);
  const tap = mock(() => {}),
    drag = mock((_event: DragEvent) => {});
  const handlers = setup({ onTap: tap, onDrag: drag });
  expect(callbacks.onStartShouldSetPanResponder?.({} as never, {} as never)).toBe(true);
  expect(callbacks.onMoveShouldSetPanResponder?.({} as never, {} as never)).toBe(true);
  send('Grant');
  send('Move', 3, 4);
  advance(299);
  send('Release', 3, 4);
  expect(tap).toHaveBeenCalledWith(10, 20);
  expect(drag.mock.calls.map((call) => call[0])).toEqual([
    { phase: 'start', x: 10, y: 20, dx: 0, dy: 0 },
    { phase: 'move', x: 13, y: 24, dx: 3, dy: 4 },
    { phase: 'end', x: 13, y: 24, dx: 3, dy: 4 }
  ]);
  const latest = mock(() => {});
  handlers.onTap = latest;
  send('Grant');
  send('Release');
  expect(latest).toHaveBeenCalledTimes(1);
  send('Grant');
  advance(300);
  send('Release');
  send('Grant');
  send('Release', 10);
  expect(latest).toHaveBeenCalledTimes(1);
});

test.each([
  { dx: 31, dy: 0, direction: 'right' },
  { dx: -31, dy: 0, direction: 'left' },
  { dx: 0, dy: -31, direction: 'up' },
  { dx: 0, dy: 31, direction: 'down' }
])('swipe $direction requires both minimum distance and speed', ({ dx, dy, direction }) => {
  const swipe = mock(() => {});
  setup({ onSwipe: swipe });
  send('Grant');
  advance(100);
  send('Release', dx, dy);
  expect(swipe).toHaveBeenCalledWith(direction);
  send('Grant');
  advance(1000);
  send('Release', dx, dy);
  send('Grant');
  send('Release', Math.sign(dx) * 30, Math.sign(dy) * 30);
  expect(swipe).toHaveBeenCalledTimes(1);
});

test('long press fires once, suppresses tap/swipe and cancels on motion or disposal', () => {
  const hold = mock(() => {}),
    tap = mock(() => {}),
    swipe = mock(() => {});
  setup({ onLongPress: hold, onTap: tap, onSwipe: swipe });
  send('Grant');
  advance(499);
  expect(hold).not.toHaveBeenCalled();
  advance(1);
  expect(hold).toHaveBeenCalledWith(10, 20);
  advance(500);
  send('Release');
  expect(tap).not.toHaveBeenCalled();
  expect(swipe).not.toHaveBeenCalled();
  send('Grant');
  send('Move', 10);
  advance(500);
  send('Release', 40);
  expect(hold).toHaveBeenCalledTimes(1);
  send('Grant');
  responder.dispose();
  advance(500);
  expect(hold).toHaveBeenCalledTimes(1);
});

test('overlay capture receives all phases and excludes game gestures', () => {
  const overlay = mock((phase: string, _x: number, _y: number) => phase === 'start'),
    drag = mock((_event: DragEvent) => {}),
    tap = mock(() => {});
  setup({ onOverlayTouch: overlay, onDrag: drag, onTap: tap });
  send('Grant');
  send('Move', 5, 7);
  send('Release', 5, 7);
  expect(overlay.mock.calls).toEqual([
    ['start', 10, 20],
    ['move', 15, 27],
    ['end', 15, 27]
  ]);
  send('Grant');
  send('Terminate', 3, 4);
  expect(overlay).toHaveBeenLastCalledWith('cancel', 13, 24);
  send('Grant');
  responder.cancel();
  expect(overlay).toHaveBeenLastCalledWith('cancel', 10, 20);
  expect(tap).not.toHaveBeenCalled();
  expect(drag).not.toHaveBeenCalled();
});

test.each(['Release', 'Terminate', 'cancel'] as const)('pinch transitions cancel the drag and end exactly once on %s', (phase) => {
  const pinch = mock((_event: PinchEvent) => {}),
    drag = mock((_event: DragEvent) => {}),
    tap = mock(() => {});
  setup({ onPinch: pinch, onDrag: drag, onTap: tap });
  send('Grant');
  send('Move', 0, 0, [
    { pageX: 110, pageY: 220 },
    { pageX: 120, pageY: 220 }
  ]);
  expect(drag).toHaveBeenLastCalledWith({
    phase: 'end',
    x: 10,
    y: 20,
    dx: 0,
    dy: 0,
    cancelled: true
  });
  expect(pinch).toHaveBeenLastCalledWith({
    phase: 'start',
    scale: 1,
    rotation: 0,
    x: 15,
    y: 20
  });
  send('Move', 0, 0, [
    { pageX: 110, pageY: 220 },
    { pageX: 110, pageY: 240 }
  ]);
  expect(pinch).toHaveBeenLastCalledWith({
    phase: 'move',
    scale: 2,
    rotation: Math.PI / 2,
    x: 10,
    y: 30
  });
  send('Move', 20, 20); // Losing a finger must not start a new drag.
  if (phase === 'cancel') responder.cancel();
  else send(phase);
  responder.cancel();
  send('Release');
  send('Terminate');
  send('Move');
  expect(pinch.mock.calls.map((call) => (call[0] as { phase: string }).phase)).toEqual(['start', 'move', 'end']);
  expect(tap).not.toHaveBeenCalled();
});

test('cancelled native drags end once and cannot turn into a tap', () => {
  const drag = mock((_event: DragEvent) => {}),
    tap = mock(() => {});
  setup({ onDrag: drag, onTap: tap });
  send('Grant');
  send('Terminate', 2, 3);
  responder.cancel();
  send('Release');
  expect(drag).toHaveBeenLastCalledWith({
    phase: 'end',
    x: 12,
    y: 23,
    dx: 2,
    dy: 3,
    cancelled: true
  });
  expect(drag).toHaveBeenCalledTimes(2);
  expect(tap).not.toHaveBeenCalled();
  send('Grant');
  responder.cancel();
  expect(drag).toHaveBeenLastCalledWith({
    phase: 'end',
    x: 10,
    y: 20,
    dx: 0,
    dy: 0,
    cancelled: true
  });
});
