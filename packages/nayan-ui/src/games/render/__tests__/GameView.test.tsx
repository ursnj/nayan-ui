import { act, createContext, type ReactNode, useContext, useLayoutEffect } from 'react';
import { afterAll, afterEach, expect, mock, spyOn, test } from 'bun:test';
import { installDom } from '../../../__tests__/dom';
import type { RenderSource } from '../../types';
import type { GameViewProps } from '../GameView';

const dom = installDom();
const { createRoot } = await import('react-dom/client');
let active = true;
let frameResult = 1;
let renderError = 'GPU unavailable';
let nextFrame = 0;
const frames = new Map<number, FrameRequestCallback>();
const oldRequest = globalThis.requestAnimationFrame,
  oldCancel = globalThis.cancelAnimationFrame;
globalThis.requestAnimationFrame = (callback) => {
  frames.set(++nextFrame, callback);
  return nextFrame;
};
globalThis.cancelAnimationFrame = (id) => {
  if (id != null) frames.delete(id);
};
const touch = {
  cancel: mock(() => {}),
  dispose: mock(() => {}),
  responder: { panHandlers: {} }
};
let surface: {
  surfaceId: number;
  onSize: (width: number, height: number) => void;
  onError: (error: Error) => void;
  touch?: unknown;
};
const drawn: {
  frame: number[];
  count: number;
  world: number;
  regions: number[];
}[] = [];
const overlays: { count: number; regions: number[] }[] = [];
const backdrops: number[] = [];
const AppContext = createContext('outside');
let surfaceContext = 'outside';
let surfaceMounts = 0;
let surfaceSize: [number, number] = [200, 100];
const native = {
  generateBuiltinMeshes: mock(() => {}),
  renderBackend: () => 'test-backend',
  renderError: () => renderError,
  renderFrame(
    _surface: number,
    frame: ArrayBuffer,
    _matrices: object,
    _colors: object,
    regions: ArrayBuffer,
    _ranges: object,
    count: number,
    _projection: object,
    world: number
  ) {
    drawn.push({
      frame: [...new Float64Array(frame)],
      count,
      world,
      regions: [...new Float32Array(regions)]
    });
    return frameResult;
  },
  renderOverlay(_surface: number, _matrices: object, _colors: object, regions: ArrayBuffer, _ranges: object, count: number) {
    overlays.push({ count, regions: [...new Float32Array(regions)] });
  },
  renderBackdrop(_surface: number, _matrices: object, _colors: object, _regions: object, _ranges: object, count: number) {
    backdrops.push(count);
  }
};
mock.module('../../../native/NativeNayanEngine', () => ({ default: native }));
mock.module('../host', () => ({
  useActive: () => active,
  pixelRatio: () => 4,
  createTouchResponder: () => touch,
  Surface: (props: typeof surface) => {
    surface = props;
    surfaceContext = useContext(AppContext);
    useLayoutEffect(() => {
      surfaceMounts++;
    }, []);
    const { onSize } = props;
    useLayoutEffect(() => {
      onSize(...surfaceSize);
    }, [onSize]);
    return <div data-engine-surface="true" />;
  }
}));
const { GameView } = await import('../GameView');
function source(count = 4): RenderSource {
  const ranges = new Uint32Array(4096 * 4);
  ranges.set([0, count], 0);
  return {
    matrices: new Float32Array(16 * 8),
    colors: new Float32Array(4 * 8),
    ranges,
    capacity: 8,
    count
  };
}
let root: ReturnType<typeof createRoot> | undefined;
async function mount(props: GameViewProps) {
  if (!root) root = createRoot(dom.window.document.createElement('div') as unknown as HTMLElement);
  await act(async () => {
    root!.render(<GameView {...props} />);
  });
}
function step(time: number) {
  const [id, callback] = frames.entries().next().value!;
  frames.delete(id);
  callback(time);
}
afterEach(async () => {
  await act(async () => {
    root?.unmount();
  });
  root = undefined;
  frames.clear();
  drawn.length = 0;
  overlays.length = 0;
  backdrops.length = 0;
  active = true;
  surfaceSize = [200, 100];
  frameResult = 1;
  renderError = 'GPU unavailable';
  touch.cancel.mockClear();
  touch.dispose.mockClear();
});
afterAll(() => {
  globalThis.requestAnimationFrame = oldRequest;
  globalThis.cancelAnimationFrame = oldCancel;
  dom.cleanup();
});

test('game time starts only after a displayed frame and long gaps are capped', async () => {
  const update = mock((_dt: number) => {});
  const view = source();
  const projected = mock(() => {});
  view.setView = projected;
  frameResult = 0;
  await mount({ source: view, onUpdate: update });
  step(10);
  step(26);
  expect(update.mock.calls.map((call) => call[0])).toEqual([0, 0]);
  expect(projected).not.toHaveBeenCalled();
  frameResult = 1;
  step(42);
  step(58);
  step(1058);
  expect(update.mock.calls.map((call) => call[0])).toEqual([0, 0, 0, 0.016, 0.1]);
  expect(projected).toHaveBeenCalledTimes(3);
  expect(drawn[0]!.frame.slice(0, 6)).toEqual([0, 40, 60, 0, 0, 0]);
  expect(drawn[0]!.frame.slice(21, 24)).toEqual([600, 300, 4]);
  expect(drawn[0]!.world).toBe(-1);
  expect(drawn[0]!.regions.slice(0, 4)).toEqual([0, 0, 1, 1]);
});

test('pause, app inactivity and unmount cancel input and every scheduled frame', async () => {
  const view = source(),
    update = mock(() => {});
  await mount({ source: view, onUpdate: update, onTap: () => {} });
  expect(surface.touch).toBe(touch);
  step(10);
  await mount({ source: view, onUpdate: update, paused: true });
  expect(frames.size).toBe(0);
  expect(touch.cancel).toHaveBeenCalledTimes(1);
  await mount({ source: view, onUpdate: update });
  step(500);
  active = false;
  await mount({ source: view, onUpdate: update });
  expect(frames.size).toBe(0);
  expect(touch.cancel).toHaveBeenCalledTimes(2);
  active = true;
  await mount({ source: view, onUpdate: update });
  const stale = frames.values().next().value!;
  await act(async () => {
    root!.unmount();
  });
  root = undefined;
  const count = update.mock.calls.length;
  stale(1000);
  expect(update).toHaveBeenCalledTimes(count);
  expect(touch.dispose).toHaveBeenCalledTimes(1);
  expect(frames.size).toBe(0);
});

test('live callbacks, camera, lighting and quality update without duplicating the loop', async () => {
  const view = source(),
    oldUpdate = mock(() => {}),
    latestUpdate = mock(() => {});
  await mount({ source: view, onUpdate: oldUpdate });
  step(10);
  await mount({
    source: view,
    onUpdate: latestUpdate,
    quality: 'lowest',
    fog: 0.02,
    background: [0.2, 0.3, 0.4],
    camera: { eye: [1, 2, 3], target: [4, 5, 6], fov: 0.7, ortho: 10 },
    light: {
      direction: [0, 1, 0],
      ambient: 0.2,
      shadows: false,
      shadowExtent: 12,
      color: [0.5, 0.6, 0.7]
    }
  });
  expect(frames.size).toBe(1);
  step(26);
  expect(oldUpdate).toHaveBeenCalledTimes(1);
  expect(latestUpdate).toHaveBeenCalledTimes(1);
  const frame = drawn.at(-1)!.frame;
  expect(frame.slice(0, 8)).toEqual([1, 2, 3, 4, 5, 6, 0.7, 10]);
  expect(frame.slice(11, 14)).toEqual([0.2, 0, 12]);
  expect(frame.slice(21, 26)).toEqual([400, 200, 1, 2048, 1]);
  // Within the pixel budget the scene is drawn at the screen's own resolution.
  expect(frame[26]).toBe(1);
  // "lowest" has no MSAA: its edges are smoothed after drawing.
  expect(frame[27]).toBe(1);
  // At "low" and "lowest" a shadow-casting light draws no shadows (never a blurred low-resolution map).
  await mount({ source: view, onUpdate: latestUpdate, quality: 'lowest', light: { direction: [0, 1, 0], ambient: 0.2, shadows: true } });
  step(52);
  expect(drawn.at(-1)!.frame[12]).toBe(0);
  await mount({ source: view, onUpdate: latestUpdate, quality: 'high', light: { direction: [0, 1, 0], ambient: 0.2, shadows: true } });
  step(78);
  expect(drawn.at(-1)!.frame[12]).toBe(1);
});

test('opaque and transparent ranges determine drawn counts and overlays can be replaced or removed', async () => {
  const view = source(8),
    overlay = source(2);
  view.ranges.set([1, 2], 0);
  view.ranges.set([3, 1], 4096 * 2);
  await mount({ source: view, overlay });
  step(10);
  expect(drawn[0]!.count).toBe(4);
  expect(overlays[0]!.count).toBe(2);
  const replacement = {
    ...source(1),
    regions: new Float32Array([0.1, 0.2, 0.3, 0.4])
  };
  await mount({ source: view, overlay: replacement });
  step(26);
  expect(overlays.at(-1)!.count).toBe(1);
  await mount({ source: view });
  step(42);
  expect(overlays.at(-1)!.count).toBe(0);
});

test('a backdrop is sent once, again only after its world steps, and removed with the prop', async () => {
  const view = source(2),
    backdrop = { ...source(3), updateCount: 1 };
  await mount({ source: view, backdrop });
  step(10);
  step(26);
  expect(backdrops).toEqual([3]);
  backdrop.updateCount = 2;
  step(42);
  expect(backdrops).toEqual([3, 3]);
  await mount({ source: view });
  step(58);
  expect(backdrops).toEqual([3, 3, 0]);
});

test("without a backdrop prop, the source's own still layer is drawn behind it", async () => {
  const layer = { ...source(5), updateCount: 1 };
  await mount({ source: { ...source(2), backdrop: layer } });
  step(10);
  expect(backdrops).toEqual([5]);
});

test('render failures are reported at most three times and surface failures use the latest handler', async () => {
  const error = mock((_error: Error) => {}),
    newer = mock((_error: Error) => {});
  const view = source();
  frameResult = -1;
  await mount({ source: view, onError: error });
  for (let i = 0; i < 8; i++) step(10 + i * 16);
  expect(error).toHaveBeenCalledTimes(3);
  expect(error.mock.calls[0]![0].message).toBe('GPU unavailable');
  await mount({ source: view, onError: newer });
  surface.onError(new Error('surface lost'));
  expect(newer.mock.calls[0]![0].message).toBe('surface lost');
});

test('default error reporting handles missing native diagnostics and stats sample once per second', async () => {
  const logger = spyOn(console, 'error').mockImplementation(() => {});
  const stats = mock((_value: unknown) => {});
  try {
    renderError = '';
    frameResult = -1;
    await mount({ source: source(), onStats: stats });
    step(10);
    step(510);
    expect(stats).not.toHaveBeenCalled();
    step(1010);
    expect(logger.mock.calls[0]![0]).toContain('rendering failed');
    expect(stats).toHaveBeenCalledTimes(1);
    expect(stats.mock.calls[0]![0]).toMatchObject({
      fps: 3,
      quality: 'high',
      backend: 'test-backend'
    });
  } finally {
    logger.mockRestore();
  }
});

test('automatic quality survives pause and resume and starts over only for a new source', async () => {
  let clock = 0;
  const now = spyOn(performance, 'now').mockImplementation(() => clock);
  const render = native.renderFrame;
  // GPU bound: each draw takes 30 ms of 25 ms frames.
  native.renderFrame = (...args: Parameters<typeof render>) => {
    clock += 30;
    return render(...args);
  };
  const qualities: { quality: string; sceneScale: number }[] = [];
  const onStats = ({ quality, sceneScale }: { quality: string; sceneScale: number }) => qualities.push({ quality, sceneScale });
  let time = 0;
  const run = (ms: number) => {
    for (const end = time + ms; time < end;) step((time += 25));
  };
  try {
    // A large surface exercises the resolution steps before effects are reduced.
    surfaceSize = [600, 1000];
    const view = source();
    await mount({ source: view, onStats });
    run(8000);
    const full = qualities[0]!;
    const lowered = qualities.at(-1);
    expect(lowered!.sceneScale).toBeLessThan(full.sceneScale);
    await mount({ source: view, onStats, paused: true });
    await mount({ source: view, onStats });
    qualities.length = 0;
    run(1100);
    expect(qualities[0]).toEqual(lowered!);
    await mount({ source: source(), onStats });
    qualities.length = 0;
    run(1100);
    expect(qualities[0]).toEqual(full);
  } finally {
    native.renderFrame = render;
    now.mockRestore();
  }
});

test('a new view with the same quality key starts at the level auto settled on', async () => {
  let clock = 0;
  const now = spyOn(performance, 'now').mockImplementation(() => clock);
  const render = native.renderFrame;
  native.renderFrame = (...args: Parameters<typeof render>) => {
    clock += 30;
    return render(...args);
  };
  const qualities: { quality: string; sceneScale: number }[] = [];
  const onStats = ({ quality, sceneScale }: { quality: string; sceneScale: number }) => qualities.push({ quality, sceneScale });
  let time = 0;
  const run = (ms: number) => {
    for (const end = time + ms; time < end;) step((time += 25));
  };
  try {
    surfaceSize = [600, 1000];
    await mount({ source: source(), onStats, qualityKey: 'remembered-game' });
    run(8000);
    const full = qualities[0]!;
    const lowered = qualities.at(-1);
    expect(lowered!.sceneScale).toBeLessThan(full.sceneScale);
    await mount({ source: source(), onStats, qualityKey: 'remembered-game' });
    qualities.length = 0;
    run(1100);
    expect(qualities[0]).toEqual(lowered!);
    await mount({ source: source(), onStats, qualityKey: 'another-game' });
    qualities.length = 0;
    run(1100);
    expect(qualities[0]).toEqual(full);
  } finally {
    native.renderFrame = render;
    now.mockRestore();
  }
});

/** A source that counts its own updates, as World does. */
function steppable(count = 4) {
  const calls: number[] = [];
  let steps = 0;
  const state = { disposed: false };
  const view: RenderSource & { update(dt: number): void } = {
    ...source(count),
    update(dt: number) {
      steps++;
      calls.push(dt);
    },
    get updateCount() {
      return steps;
    },
    get isDisposed() {
      return state.disposed;
    }
  };
  return { view, calls, state };
}

test('a steppable source and overlay are stepped once a frame unless onUpdate stepped them', async () => {
  const scene = steppable();
  const layer = steppable(1);
  await mount({ source: scene.view, overlay: layer.view });
  step(10);
  step(26);
  // No onUpdate at all: both are stepped with the frame's dt.
  expect(scene.calls).toEqual([0, 0.016]);
  expect(layer.calls).toEqual([0, 0.016]);

  // An onUpdate that steps the scene itself (with its own dt) isn't followed by a second step.
  await mount({ source: scene.view, overlay: layer.view, onUpdate: () => scene.view.update(0.005) });
  step(42);
  expect(scene.calls).toEqual([0, 0.016, 0.005]);
  expect(layer.calls).toEqual([0, 0.016, 0.016]);

  // Disposed sources are never stepped.
  scene.state.disposed = true;
  await mount({ source: scene.view, onUpdate: () => {} });
  step(58);
  expect(scene.calls).toEqual([0, 0.016, 0.005]);
});

test('background and light colors accept CSS colors', async () => {
  await mount({ source: source(), background: '#336699', light: { direction: [0, 1, 0], ambient: 0.5, color: 'rgba(255, 0, 0, 0.5)' } });
  step(10);
  const frame = drawn.at(-1)!.frame;
  expect(frame.slice(14, 17)).toEqual([1, 0, 0]);
  expect(frame.slice(17, 20).map((v) => Math.round(v * 255))).toEqual([0x33, 0x66, 0x99]);
});

test('a game inside an engine surface retains live app context and theme without restarting its surface', async () => {
  const { createComponentRenderer } = await import('../../../components/reconciler');
  const { ComponentAttachmentContext } = await import('../../../components/NPlatformView');
  const { ComponentThemeContext } = await import('../../../components/ThemeContext');
  let attachment: ReactNode = null;
  const register = (_id: string, children: ReactNode) => {
    attachment = children;
  };
  const failed = mock((_error: unknown) => {});
  const renderer = createComponentRenderer(() => {}, failed);
  const view = source();
  const contexts = [AppContext];
  root = createRoot(document.createElement('div'));
  const render = async (session: string, background: string, override?: string) => {
    await act(async () => {
      renderer.render(
        <ComponentAttachmentContext.Provider value={register}>
          <ComponentThemeContext.Provider value={{ contexts, theme: 'dark', resolvedTheme: 'dark', themes: { dark: { background } } }}>
            <AppContext.Provider value={session}>
              <GameView source={view} background={override} />
            </AppContext.Provider>
          </ComponentThemeContext.Provider>
        </ComponentAttachmentContext.Provider>
      );
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(attachment).not.toBeNull();
    await act(() => root!.render(attachment));
  };
  try {
    const before = surfaceMounts;
    await render('signed-in', '#336699');
    expect(surfaceContext).toBe('signed-in');
    step(10);
    const surfaceId = surface.surfaceId;
    const scheduledFrame = frames.keys().next().value;
    expect(
      drawn
        .at(-1)!
        .frame.slice(17, 20)
        .map((v) => Math.round(v * 255))
    ).toEqual([0x33, 0x66, 0x99]);
    await render('signed-out', '#112233');
    expect(surfaceContext).toBe('signed-out');
    expect(surfaceMounts).toBe(before + 1);
    expect(surface.surfaceId).toBe(surfaceId);
    expect(frames.keys().next().value).toBe(scheduledFrame);
    expect(frames.size).toBe(1);
    step(26);
    expect(
      drawn
        .at(-1)!
        .frame.slice(17, 20)
        .map((v) => Math.round(v * 255))
    ).toEqual([0x11, 0x22, 0x33]);
    await render('signed-out', '#112233', '#ff0000');
    step(42);
    expect(drawn.at(-1)!.frame.slice(17, 20)).toEqual([1, 0, 0]);
    expect(failed).not.toHaveBeenCalled();
  } finally {
    await act(async () => {
      renderer.dispose();
      await new Promise((resolve) => setTimeout(resolve, 20));
    });
    expect(attachment).toBeNull();
  }
});

test('with a native frame clock, frames come from it and are published to the render thread', async () => {
  const published: number[] = [];
  let onFrame: ((t: number) => void) | undefined;
  const stopped = mock((_surface: number) => {});
  let status = 0;
  let presented = 0;
  const threaded = native as unknown as Record<string, unknown>;
  Object.assign(threaded, {
    hasFrameClock: () => true,
    startFrames: (_surface: number, fn: (t: number) => void) => {
      onFrame = fn;
    },
    stopFrames: stopped,
    publishFrame: (_s: number, _f: ArrayBuffer, _m: object, _c: object, _r: object, _g: object, count: number, viewProj: ArrayBuffer) => {
      published.push(count);
      new Float32Array(viewProj)[0] = 7;
      return status;
    },
    renderStats: () => [presented, 4.5]
  });
  const renderFrame = spyOn(native, 'renderFrame');
  const stats = mock((_s: { fps: number; renderMs: number }) => {});
  const views: number[] = [];
  const view = source(3);
  view.setView = (vp) => views.push(vp[0]!);
  const update = mock((_dt: number) => {});
  try {
    await mount({ source: view, onUpdate: update, onStats: stats });
    expect(frames.size).toBe(0); // no requestAnimationFrame loop
    onFrame!(10);
    onFrame!(26.67);
    expect(published).toEqual([3, 3]);
    expect(renderFrame).not.toHaveBeenCalled();
    // The camera is known as soon as a frame is published, before anything is presented.
    expect(views).toEqual([7, 7]);
    // Game time waits for the first presented frame.
    expect(update.mock.calls.map((c) => c[0])).toEqual([0, 0]);
    status = 1;
    onFrame!(43.33);
    onFrame!(60);
    expect(update.mock.calls.at(-1)![0]).toBeCloseTo(0.01667, 4);
    // A second later the stats report what the render thread presented.
    presented = 45;
    onFrame!(1010);
    expect(stats).toHaveBeenCalledTimes(1);
    expect(stats.mock.calls[0]![0].fps).toBeCloseTo(45, 0);
    expect(stats.mock.calls[0]![0].renderMs).toBe(4.5);
  } finally {
    await act(async () => {
      root?.unmount();
    });
    root = undefined;
    expect(stopped).toHaveBeenCalledTimes(1);
    for (const key of ['hasFrameClock', 'startFrames', 'stopFrames', 'publishFrame', 'renderStats']) delete threaded[key];
    renderFrame.mockRestore();
  }
});

test('afterNextFrame runs work right after the next GameView frame, or on requestAnimationFrame without one', async () => {
  const { afterNextFrame } = await import('../GameView');
  const order: string[] = [];
  // No GameView running: requestAnimationFrame.
  const cancelled = afterNextFrame(() => order.push('cancelled'));
  cancelled();
  afterNextFrame(() => order.push('idle'));
  step(5);
  expect(order).toEqual(['idle']);
  frames.clear();
  await mount({ source: source(), onUpdate: () => order.push('update') });
  afterNextFrame(() => order.push('after'));
  step(10);
  expect(order).toEqual(['idle', 'update', 'after']);
  step(26);
  expect(order).toEqual(['idle', 'update', 'after', 'update']);
});
