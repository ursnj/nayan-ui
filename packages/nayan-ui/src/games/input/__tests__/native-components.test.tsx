import { act, createElement, type ReactNode } from 'react';
import { renderToString } from 'react-dom/server';
import type { PanResponderCallbacks } from 'react-native';
import { afterAll, afterEach, expect, mock, test } from 'bun:test';
import { installDom } from '../../../__tests__/dom';
import { createTestCore } from '../../../native/__tests__/core';

const core = await createTestCore();
mock.module('../../../native/NativeNayanEngine', () => ({ default: core }));
const dom = installDom();
const { createRoot } = await import('react-dom/client');
const listeners = new Set<(state: string) => void>();
const remove = mock(() => {});
let callbacks: PanResponderCallbacks;
let wrapper: { onLayout?: (event: unknown) => void };
let nativeSurfaceId = -1;
let nativeDrawingBackground = -1;
let nativeSurfaceRegistrations = 0;
let videoEnabled = false;
const hasViewManagerConfig = mock((name: string) => name === 'NayanEngineVideo' && videoEnabled);
const nativeSurfaceNames: string[] = [];
let nativeDrawingChange: ((event: { nativeEvent: { state: string; documentId: number } }) => void) | undefined;
class ValueXY {
  value = { x: 0, y: 0 };
  setValue(value: { x: number; y: number }) {
    this.value = value;
  }
  getTranslateTransform() {
    return [{ translateX: this.value.x }, { translateY: this.value.y }];
  }
}
const knobs: ValueXY[] = [];
mock.module('react-native', () => ({
  AssetRegistry: { getAssetByID: () => undefined },
  Platform: { OS: 'android' },
  processColor: (color: string) => parseInt(color.replace('#', ''), 16),
  AppState: {
    currentState: 'inactive',
    addEventListener(_name: string, listener: (state: string) => void) {
      listeners.add(listener);
      return {
        remove() {
          listeners.delete(listener);
          remove();
        }
      };
    }
  },
  PixelRatio: { get: () => 3 },
  StyleSheet: { create: (styles: object) => styles },
  PanResponder: {
    create(value: PanResponderCallbacks) {
      callbacks = value;
      return { panHandlers: {} };
    }
  },
  Animated: {
    ValueXY: class extends ValueXY {
      constructor() {
        super();
        knobs.push(this);
      }
    },
    View: ({ children }: { children?: ReactNode }) => createElement('div', null, children)
  },
  View: (props: { children?: ReactNode; onLayout?: (event: unknown) => void }) => {
    wrapper = props;
    return createElement('div', null, props.children);
  },
  Image: { resolveAssetSource: () => null },
  UIManager: { hasViewManagerConfig },
  requireNativeComponent: (name: string) => {
    if (name === 'NayanEngineSurface' || name === 'NayanEngineComponentSurface') {
      nativeSurfaceNames.push(name);
      nativeSurfaceRegistrations++;
    }
    return (props: { surfaceId: number; drawingBackground?: number; onDrawingChange?: typeof nativeDrawingChange }) => {
      nativeDrawingChange = props.onDrawingChange;
      nativeSurfaceId = props.surfaceId;
      nativeDrawingBackground = props.drawingBackground ?? -1;
      return null;
    };
  }
}));
// Importing the real public entry also catches native-only import-time regressions.
const { Joystick, useJoystick, World, warmUpEngine, DrawingCanvas, DrawingDocument, VideoPlayer } = await import('../../../index');
const { Surface, useActive, pixelRatio } = await import('../../render/host');
let root: ReturnType<typeof createRoot> | undefined;
async function render(node: ReactNode) {
  root ??= createRoot(document.createElement('div'));
  await act(async () => root!.render(node));
}
afterEach(async () => {
  await act(async () => root?.unmount());
  root = undefined;
});
afterAll(() => dom.cleanup());

test('native public API warms the same core and constructs usable worlds', async () => {
  await warmUpEngine();
  const world = new World(1);
  expect(world.spawn({ mesh: 'cube' })).toBeGreaterThanOrEqual(0);
  world.dispose();
});

test('native video checks the optional player only when used', async () => {
  expect(hasViewManagerConfig).not.toHaveBeenCalled();
  const video = <VideoPlayer source="https://example.com/video.mp4" />;
  expect(() => renderToString(video)).toThrow('with the video feature enabled');
  videoEnabled = true;
  await render(video);
  expect(hasViewManagerConfig).toHaveBeenCalledWith('NayanEngineVideo');
});

test('native host follows AppState, forwards native layout and releases subscriptions', async () => {
  const values: boolean[] = [];
  function Active() {
    values.push(useActive());
    return null;
  }
  await render(<Active />);
  expect(values).toEqual([false]);
  for (const state of ['active', 'background', 'active', 'inactive']) {
    await act(async () => {
      for (const listener of listeners) listener(state);
    });
    expect(values.at(-1)).toBe(state === 'active');
  }
  expect(pixelRatio()).toBe(3);
  const size = mock(() => {});
  await render(<Surface surfaceId={7} onSize={size} onError={() => {}} />);
  expect(remove).toHaveBeenCalledTimes(1);
  expect(listeners.size).toBe(0);
  wrapper.onLayout!({ nativeEvent: { layout: { width: 120, height: 80 } } });
  expect(size).toHaveBeenCalledWith(120, 80);
  expect(nativeSurfaceId).toBe(7);
});

test('native joystick clamps vectors, keeps stable state and clears on release, termination and unmount', async () => {
  const identities: { x: number; y: number }[] = [];
  function App() {
    const state = useJoystick();
    identities.push(state);
    return <Joystick state={state} size={100} />;
  }
  await render(<App />);
  const state = identities[0]!;
  const knob = knobs[0]!;
  expect(callbacks.onStartShouldSetPanResponder?.({} as never, {} as never)).toBe(true);
  expect(callbacks.onMoveShouldSetPanResponder?.({} as never, {} as never)).toBe(true);
  callbacks.onPanResponderMove!({} as never, { dx: 15, dy: -15 } as never);
  expect(state).toEqual({ x: 0.5, y: 0.5 });
  await render(<App />);
  expect(identities[1]).toBe(state);
  callbacks.onPanResponderMove!({} as never, { dx: 300, dy: 400 } as never);
  expect(state.x).toBeCloseTo(0.6);
  expect(state.y).toBeCloseTo(-0.8);
  callbacks.onPanResponderRelease!({} as never, {} as never);
  expect(state).toEqual({ x: 0, y: 0 });
  expect(knob.value).toEqual({ x: 0, y: 0 });
  callbacks.onPanResponderMove!({} as never, { dx: 10, dy: 20 } as never);
  callbacks.onPanResponderTerminate!({} as never, {} as never);
  expect(state).toEqual({ x: 0, y: 0 });
  callbacks.onPanResponderMove!({} as never, { dx: 30, dy: 0 } as never);
  await act(async () => root!.unmount());
  root = undefined;
  expect(state).toEqual({ x: 0, y: 0 });
});

test('drawing and games share one registered native surface component', () => {
  expect(DrawingCanvas).toBeDefined();
  expect(nativeSurfaceRegistrations).toBe(1);
});

test('native drawing changes update UI only for the active document and ignore late surface events', async () => {
  const doc = new DrawingDocument(128, 128, 1),
    change = mock(() => {});
  try {
    await render(<DrawingCanvas document={doc} onChange={change} />);
    nativeDrawingChange!({ nativeEvent: { state: '{"count":1}', documentId: doc.id + 1 } });
    expect(change).not.toHaveBeenCalled();
    nativeDrawingChange!({ nativeEvent: { state: '{"count":1}', documentId: doc.id } });
    expect(change).toHaveBeenCalledWith({ count: 1 });
    await render(<DrawingCanvas document={doc} active={false} onChange={change} />);
    nativeDrawingChange!({ nativeEvent: { state: '{"count":2}', documentId: doc.id } });
    expect(change).toHaveBeenCalledTimes(1);
    await render(<DrawingCanvas document={doc} onChange={change} />);
    doc.dispose();
    nativeDrawingChange!({ nativeEvent: { state: '{"count":3}', documentId: doc.id } });
    expect(change).toHaveBeenCalledTimes(1);
  } finally {
    doc.dispose();
  }
});

test('paper follows light and dark colors immediately without changing native artwork', async () => {
  const doc = new DrawingDocument(128, 128, 1);
  try {
    doc.input(0, 20, 20);
    doc.input(2, 80, 80);
    const project = doc.exportProject();
    await render(<DrawingCanvas document={doc} background="#fff8ee" />);
    expect(nativeDrawingBackground).toBe(0xfff8ee);
    await render(<DrawingCanvas document={doc} background="#19263b" />);
    expect(nativeDrawingBackground).toBe(0x19263b);
    expect(doc.exportProject()).toBe(project);
  } finally {
    doc.dispose();
  }
});

test('Android UI uses a composited surface while drawing and games retain the direct surface', async () => {
  const doc = new DrawingDocument(200, 200, 1);
  try {
    await render(createElement(DrawingCanvas, { document: doc, mode: 'components' }));
    expect(nativeSurfaceNames).toContain('NayanEngineComponentSurface');
    const count = nativeSurfaceRegistrations;
    await render(createElement(DrawingCanvas, { document: doc, mode: 'components' }));
    expect(nativeSurfaceRegistrations).toBe(count);
    await render(createElement(Surface, { surfaceId: 7, onSize() {}, onError() {} }));
    expect(nativeSurfaceId).toBe(7);
    expect(nativeSurfaceRegistrations).toBe(count);
  } finally {
    doc.dispose();
  }
});
