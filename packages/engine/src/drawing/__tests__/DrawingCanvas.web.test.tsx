import { act } from 'react';
import { afterAll, expect, mock, test } from 'bun:test';
import { installDom } from '../../__tests__/dom';
const attach = mock(async () => {}),
  detach = mock(() => {});
mock.module('../../native/NativeNayanEngine.web', () => ({ attachCanvas: attach, detachCanvas: detach }));
mock.module('../../games/render/meshes', () => ({ warmUpEngine: async () => {} }));
const dom = installDom();
const originalRaf = globalThis.requestAnimationFrame,
  originalCancel = globalThis.cancelAnimationFrame;
globalThis.requestAnimationFrame = () => 1;
globalThis.cancelAnimationFrame = () => {};
const { createRoot } = await import('react-dom/client');
const { DrawingCanvas } = await import('../DrawingCanvas.web');
afterAll(() => {
  globalThis.requestAnimationFrame = originalRaf;
  globalThis.cancelAnimationFrame = originalCancel;
  dom.cleanup();
});
function nativeDocument() {
  return {
    id: 500001,
    isDisposed: false,
    input: mock((_phase: number, _x: number, _y: number, _pressure: number) => {}),
    present: mock(() => true),
    cancel: mock(() => {}),
    invalidateView: mock(() => {}),
    undo: mock(() => {}),
    redo: mock(() => {}),
    transform: mock(() => {}),
    pointer: mock((_x: number, _y: number) => {})
  };
}
function pointer(canvas: HTMLCanvasElement, type: string, overrides: object = {}) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.assign(event, { pointerId: 1, pointerType: 'pen', clientX: 12, clientY: 24, pressure: 0.5, button: 0, ...overrides });
  canvas.dispatchEvent(event);
}
test('coalesced pen events reach the native document without React redraws and cleanup cancels input', async () => {
  const drawing = nativeDocument();
  const container = document.createElement('div');
  const mounted = createRoot(container);
  try {
    await act(async () => {
      mounted.render(<DrawingCanvas document={drawing as never} />);
      await Promise.resolve();
    });
    const canvas = container.querySelector('canvas')!;
    canvas.setPointerCapture = () => {};
    canvas.getBoundingClientRect = () => ({ left: 2, top: 4, width: 200, height: 300 }) as DOMRect;
    pointer(canvas, 'pointerdown');
    pointer(canvas, 'pointermove', {
      getCoalescedEvents: () => [
        { pointerType: 'pen', clientX: 14, clientY: 26, pressure: 0.3 },
        { pointerType: 'pen', clientX: 16, clientY: 28, pressure: 0.7 }
      ]
    });
    expect(drawing.input.mock.calls).toEqual([
      [0, 10, 20, 0.5],
      [1, 12, 22, 0.3],
      [1, 14, 24, 0.7]
    ]);
    expect(drawing.invalidateView).toHaveBeenCalledTimes(1);
    expect(attach).toHaveBeenCalledTimes(1);
  } finally {
    await act(() => mounted.unmount());
  }
  expect(drawing.cancel).toHaveBeenCalledTimes(1);
  expect(detach).toHaveBeenCalledWith(drawing.id);
});
test('a parent may dispose artwork before canvas cleanup without touching released native memory', async () => {
  const drawing = nativeDocument();
  const container = document.createElement('div'),
    root = createRoot(container);
  await act(async () => {
    root.render(<DrawingCanvas document={drawing as never} />);
    await Promise.resolve();
  });
  const canvas = container.querySelector('canvas')!;
  canvas.setPointerCapture = () => {};
  pointer(canvas, 'pointerdown');
  drawing.isDisposed = true;
  await act(() => root.unmount());
  expect(drawing.cancel).not.toHaveBeenCalled();
});

function key(canvas: HTMLCanvasElement, init: Record<string, unknown>) {
  const event = new Event('keydown', { bubbles: true, cancelable: true });
  Object.assign(event, { ctrlKey: false, metaKey: false, shiftKey: false, ...init });
  canvas.dispatchEvent(event);
  return event;
}
function wheel(canvas: HTMLCanvasElement, init: Record<string, unknown>) {
  const event = new Event('wheel', { bubbles: true, cancelable: true });
  Object.assign(event, { deltaX: 0, deltaY: 0, clientX: 0, clientY: 0, ctrlKey: false, metaKey: false, ...init });
  canvas.dispatchEvent(event);
}
async function mount(element: (drawing: ReturnType<typeof nativeDocument>) => React.ReactElement) {
  const drawing = Object.assign(nativeDocument(), { readChange: mock(() => ({ revision: 1 }) as never) });
  const container = document.createElement('div');
  const root = createRoot(container);
  await act(async () => {
    root.render(element(drawing));
    await Promise.resolve();
  });
  const canvas = container.querySelector('canvas')!;
  canvas.setPointerCapture = () => {};
  canvas.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 50 }) as DOMRect;
  return { drawing, canvas, root };
}

test('move mode pans with one finger, pinches with two, and a second finger cancels a stroke', async () => {
  const { drawing, canvas, root } = await mount((d) => <DrawingCanvas document={d as never} mode="move" />);
  try {
    pointer(canvas, 'pointerdown', { pointerType: 'touch', clientX: 10, clientY: 10 });
    pointer(canvas, 'pointermove', { pointerType: 'touch', clientX: 15, clientY: 12 });
    expect(drawing.transform.mock.calls.at(-1) as unknown as number[]).toEqual([5, 2]);
    pointer(canvas, 'pointerdown', { pointerId: 2, pointerType: 'touch', clientX: 30, clientY: 10 });
    pointer(canvas, 'pointermove', { pointerId: 2, pointerType: 'touch', clientX: 35, clientY: 10 });
    pointer(canvas, 'pointermove', { pointerId: 2, pointerType: 'touch', clientX: 55, clientY: 10 });
    const [dx, , scale] = drawing.transform.mock.calls.at(-1) as unknown as number[];
    expect(dx).toBe(10);
    expect(scale).toBeCloseTo(Math.hypot(40, 2) / Math.hypot(20, 2), 5);
    pointer(canvas, 'pointerup', { pointerId: 2 });
    pointer(canvas, 'pointerup', { pointerId: 1 });
    expect(drawing.input).not.toHaveBeenCalled();
  } finally {
    await act(() => root.unmount());
  }
  const draw = await mount((d) => <DrawingCanvas document={d as never} />);
  try {
    pointer(draw.canvas, 'pointerdown', { pointerType: 'touch' });
    pointer(draw.canvas, 'pointerdown', { pointerId: 2, pointerType: 'touch' });
    expect(draw.drawing.cancel).toHaveBeenCalledTimes(1);
    pointer(draw.canvas, 'pointerdown', { pointerId: 3, pointerType: 'touch', button: 2 }); // secondary buttons ignored
    expect(draw.drawing.input).toHaveBeenCalledTimes(1);
  } finally {
    await act(() => draw.root.unmount());
  }
});

test('lifting or cancelling finishes the stroke with the matching phase', async () => {
  const { drawing, canvas, root } = await mount((d) => <DrawingCanvas document={d as never} />);
  try {
    pointer(canvas, 'pointerdown', { pointerType: 'mouse', clientX: 4, clientY: 6 });
    pointer(canvas, 'pointerup', { pointerType: 'mouse', clientX: 8, clientY: 9 });
    pointer(canvas, 'pointerdown', { pointerType: 'mouse', clientX: 4, clientY: 6 });
    pointer(canvas, 'pointercancel', { pointerType: 'mouse', clientX: 5, clientY: 7 });
    expect(drawing.input.mock.calls.map((c) => c[0])).toEqual([0, 2, 0, 3]);
    expect(drawing.input.mock.calls[1]).toEqual([2, 8, 9, 1]);
  } finally {
    await act(() => root.unmount());
  }
});

test('keyboard undo/redo and wheel zoom/pan respect the view mode', async () => {
  const { drawing, canvas, root } = await mount((d) => <DrawingCanvas document={d as never} />);
  try {
    expect(key(canvas, { key: 'z', ctrlKey: true }).defaultPrevented).toBe(true);
    key(canvas, { key: 'Z', metaKey: true, shiftKey: true });
    key(canvas, { key: 'y', ctrlKey: true });
    key(canvas, { key: 'z' }); // no modifier: ignored
    expect(drawing.undo).toHaveBeenCalledTimes(1);
    expect(drawing.redo).toHaveBeenCalledTimes(2);
    wheel(canvas, { deltaX: 3, deltaY: 4 });
    expect(drawing.transform.mock.calls.at(-1) as unknown as number[]).toEqual([-3, -4]);
    wheel(canvas, { deltaY: -100, ctrlKey: true });
    const [, , scale] = drawing.transform.mock.calls.at(-1) as unknown as number[];
    expect(scale).toBeCloseTo(Math.exp(0.3), 5);
  } finally {
    await act(() => root.unmount());
  }
  const viewer = await mount((d) => <DrawingCanvas document={d as never} mode="view" />);
  try {
    key(viewer.canvas, { key: 'z', ctrlKey: true });
    expect(viewer.drawing.undo).not.toHaveBeenCalled();
  } finally {
    await act(() => viewer.root.unmount());
  }
});

test('UI wheel samples preserve distance and normalize units in one batch per display frame', async () => {
  const frames: FrameRequestCallback[] = [];
  globalThis.requestAnimationFrame = (callback) => frames.push(callback);
  const { drawing, canvas, root } = await mount((d) => <DrawingCanvas document={d as never} mode="components" />);
  Object.defineProperty(canvas, 'clientHeight', { value: 50 });
  canvas.getBoundingClientRect = () => ({ left: 10, top: 20, width: 100, height: 50 }) as DOMRect;
  const order: string[] = [];
  drawing.pointer.mockImplementation(() => {
    order.push('pointer');
  });
  drawing.transform.mockImplementation(() => {
    order.push('scroll');
  });
  try {
    wheel(canvas, { deltaX: 2.5, deltaY: 5.25, deltaMode: 0 });
    wheel(canvas, { deltaX: 1.25, deltaY: 3.5, deltaMode: 0 });
    wheel(canvas, { deltaY: 2, deltaMode: 1, clientX: 80, clientY: 60 });
    expect(drawing.transform).not.toHaveBeenCalled();
    await act(async () => frames.shift()?.(0));
    expect(drawing.transform.mock.calls as unknown as number[][]).toEqual([[-3.75, -40.75]]);
    expect(drawing.pointer.mock.calls).toEqual([[70, 40]]);
    expect(order).toEqual(['pointer', 'scroll']);
    await act(async () => frames.shift()?.(16));
    expect(drawing.transform).toHaveBeenCalledTimes(1);
    wheel(canvas, { deltaY: 1, deltaMode: 2 });
    await act(async () => frames.shift()?.(32));
    expect(drawing.transform.mock.calls.at(-1) as unknown as number[]).toEqual([0, -50]);
    wheel(canvas, { deltaY: 100 });
    window.dispatchEvent(new Event('blur'));
    await act(async () => frames.shift()?.(48));
    expect(drawing.transform).toHaveBeenCalledTimes(2);
  } finally {
    await act(() => root.unmount());
    globalThis.requestAnimationFrame = () => 1;
  }
});

test('UI attachment and interaction updates follow display frames without the artwork event throttle', async () => {
  const frames: FrameRequestCallback[] = [];
  globalThis.requestAnimationFrame = (callback) => frames.push(callback);
  const onChange = mock(() => {});
  const { drawing, root } = await mount((d) => <DrawingCanvas document={d as never} mode="components" onChange={onChange} />);
  try {
    await act(async () => frames.shift()?.(0));
    await act(async () => frames.shift()?.(16));
    expect(drawing.readChange).toHaveBeenCalledTimes(2);
    expect(onChange).toHaveBeenCalledTimes(2);
    drawing.readChange.mockImplementationOnce(() => null as never);
    await act(async () => frames.shift()?.(32));
    expect(onChange).toHaveBeenCalledTimes(2);
  } finally {
    await act(() => root.unmount());
    globalThis.requestAnimationFrame = () => 1;
  }
});

test('the render loop presents, throttles change events and reports failures', async () => {
  const frames: FrameRequestCallback[] = [];
  globalThis.requestAnimationFrame = (callback) => frames.push(callback);
  const onChange = mock(() => {});
  const onError = mock(() => {});
  const { drawing, canvas, root } = await mount((d) => <DrawingCanvas document={d as never} onChange={onChange} onError={onError} />);
  try {
    await act(async () => frames.shift()?.(0));
    expect(drawing.present).toHaveBeenCalledWith(100, 50, '#ffffff', expect.any(Number));
    expect(onChange).toHaveBeenCalledWith({ revision: 1 });
    expect(canvas.width).toBeGreaterThan(0);
    drawing.present.mockImplementationOnce(() => {
      throw new Error('surface lost');
    });
    await act(async () => frames.shift()?.(0));
    expect(onError).toHaveBeenCalledTimes(1);
    expect(canvas.getAttribute('aria-label')).toBe('Drawing unavailable: surface lost');
    const presented = drawing.present.mock.calls.length;
    await act(async () => frames.shift()?.(0));
    expect(drawing.present.mock.calls.length).toBe(presented); // stops presenting after a failure
  } finally {
    await act(() => root.unmount());
    globalThis.requestAnimationFrame = () => 1;
  }
});
