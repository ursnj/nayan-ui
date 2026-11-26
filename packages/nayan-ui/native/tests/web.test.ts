import { beforeAll, describe, expect, mock, test } from 'bun:test';
import { readFile } from 'node:fs/promises';
import { animations } from '../../src/animations/index';
import { DESC_LEN, encode } from '../../src/games/world/desc';
import { createBrowserEngine, type WasmCore } from '../../src/native/BrowserEngine';
import type { EngineBridge } from '../../src/native/EngineBridge';
import type { WorkerReply, WorkerRequest } from '../../src/sqlite/protocol';

let core: WasmCore;
let engine: EngineBridge;
let World: typeof import('../../src/games/world/World').World;
beforeAll(async () => {
  const { default: init } = await import('../core/build/web/engine_core.js');
  core = (await init({
    module_or_path: await readFile(new URL('../core/build/web/engine_core_bg.wasm', import.meta.url))
  })) as unknown as WasmCore;
  engine = createBrowserEngine(core);
  mock.module('../../src/native/NativeNayanEngine', () => ({
    default: engine
  }));
  mock.module('../../src/assets/source', () => ({
    assetUri: (s: string) => s,
    imageAssetSource: (source: unknown) => source,
    loadAssetBytes: async (uri: string) => ({
      uri,
      bytes: await (await fetch(uri)).arrayBuffer()
    })
  }));
  ({ World } = await import('../../src/games/world/World'));
  engine.generateBuiltinMeshes();
});

describe('shared engine API backed by real WebAssembly', () => {
  test('the SQLite worker runs real WASM queries and rolls back a failing batch', async () => {
    const reply = mock((_reply: WorkerReply) => {});
    const descriptors = Object.fromEntries(['onmessage', 'postMessage'].map((key) => [key, Object.getOwnPropertyDescriptor(globalThis, key)]));
    Object.defineProperty(globalThis, 'postMessage', { configurable: true, value: reply });
    try {
      await import('../../src/sqlite/worker');
      let id = 0;
      async function send(request: Omit<Extract<WorkerRequest, { op: 'open' }>, 'id'> | Omit<Extract<WorkerRequest, { op: 'request' }>, 'id'>) {
        const receive = globalThis.onmessage as unknown as (event: { data: WorkerRequest }) => Promise<void>;
        await receive({ data: { id: ++id, ...request } });
        const message = reply.mock.calls.at(-1)![0];
        expect(message.id).toBe(id);
        return JSON.parse(message.response);
      }
      const opened = await send({ op: 'open' });
      expect(opened).toEqual({ ok: true, value: expect.any(Number) });
      const request = (op: string, fields: object = {}) => send({ op: 'request', command: JSON.stringify({ op, handle: opened.value, ...fields }) });
      const statement = (sql: string, params: unknown[] = []) => ({ sql, params });
      try {
        expect(await request('run', { statement: statement('CREATE TABLE notes (id INTEGER PRIMARY KEY, body BLOB)') })).toMatchObject({ ok: true });
        const integer = { integer: '9007199254740993' };
        const blob = { blob: [0, 255] };
        expect(await request('run', { statement: statement('INSERT INTO notes VALUES (?, ?)', [integer, blob]) })).toMatchObject({ ok: true });
        expect(
          await request('batch', {
            statements: [statement('INSERT INTO notes VALUES (1, NULL)'), statement('INSERT INTO notes VALUES (1, NULL)')]
          })
        ).toMatchObject({ ok: false });
        expect(await request('query', { statement: statement('SELECT id, body FROM notes ORDER BY id') })).toEqual({
          ok: true,
          value: { columns: ['id', 'body'], rows: [[integer, blob]] }
        });
      } finally {
        expect(await request('close')).toEqual({ ok: true, value: null });
      }
      expect(await request('query', { statement: statement('SELECT 1') })).toMatchObject({ ok: false });
    } finally {
      for (const [key, descriptor] of Object.entries(descriptors)) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else Reflect.deleteProperty(globalThis, key);
      }
    }
  });

  test('browser location normalizes fixes in WASM and stops geolocation watches', async () => {
    const { isAvailable, subscribe } = await import('../../src/location/platform.web');
    const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
    const position = { latitude: 12, longitude: 77, accuracy: 4, altitude: -15, altitudeAccuracy: -1, heading: NaN, speed: -1 };
    let callback: PositionCallback | undefined;
    const started = Promise.withResolvers<PositionOptions | undefined>();
    const clearWatch = mock((_id: number) => {});
    const watchPosition = mock((success: PositionCallback, _error: PositionErrorCallback, options?: PositionOptions) => {
      callback = success;
      started.resolve(options);
      return 42;
    });
    const receive = mock((_result: unknown) => {});
    try {
      expect(await isAvailable()).toBe(false);
      Object.defineProperty(globalThis, 'window', {
        configurable: true,
        value: { isSecureContext: true, navigator: { geolocation: { watchPosition, clearWatch } } }
      });
      const cancelBeforeStart = subscribe(false, receive);
      cancelBeforeStart();
      expect(await isAvailable()).toBe(true);
      const stop = subscribe(true, receive);
      expect(await started.promise).toEqual({ enableHighAccuracy: true, maximumAge: 0 });
      callback!({ coords: position, timestamp: 123 } as GeolocationPosition);
      expect(receive).toHaveBeenCalledWith({
        position: { ...position, altitudeAccuracy: null, heading: null, speed: null, timestamp: 123 }
      });
      stop();
      callback!({ coords: position, timestamp: 124 } as GeolocationPosition);
      expect(watchPosition).toHaveBeenCalledTimes(1);
      expect(clearWatch).toHaveBeenCalledWith(42);
      expect(receive).toHaveBeenCalledTimes(1);
    } finally {
      if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
      else Reflect.deleteProperty(globalThis, 'window');
    }
  });

  test('browser permissions separate checks from requests and release acquired tracks', async () => {
    const { check, openSettings, request } = await import('../../src/permissions/platform.web');
    expect(await check('camera')).toEqual({ status: 'unavailable', canAskAgain: false });

    const originalWindow = Object.getOwnPropertyDescriptor(globalThis, 'window');
    const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
    const originalNotification = Object.getOwnPropertyDescriptor(globalThis, 'Notification');
    const stop = mock(() => {});
    const getUserMedia = mock(async (_: MediaStreamConstraints) => ({ getTracks: () => [{ stop }] }));
    const query = mock(async (_: PermissionDescriptor) => ({ state: 'prompt' }));
    const requestNotification = mock(async () => 'denied');
    const getCurrentPosition = mock((success: () => void) => success());
    const readText = mock(async () => 'private');
    const persist = mock(async () => true);
    Object.defineProperties(globalThis, {
      window: { configurable: true, value: { isSecureContext: true } },
      navigator: {
        configurable: true,
        value: {
          mediaDevices: { getUserMedia },
          permissions: { query },
          geolocation: { getCurrentPosition },
          clipboard: { readText },
          storage: { persist }
        }
      },
      Notification: { configurable: true, value: { permission: 'default', requestPermission: requestNotification } }
    });
    try {
      expect(await check('camera')).toEqual({ status: 'prompt', canAskAgain: true });
      query.mockRejectedValueOnce(new TypeError('Descriptor unsupported'));
      expect(await check('camera')).toEqual({ status: 'unknown', canAskAgain: null });
      expect(getUserMedia).not.toHaveBeenCalled();
      expect(await request('microphone')).toEqual({ status: 'granted', canAskAgain: false });
      expect(getUserMedia).toHaveBeenCalledWith({ audio: true });
      expect(stop).toHaveBeenCalledTimes(1);
      getUserMedia.mockRejectedValueOnce(new DOMException('Permission denied', 'NotAllowedError'));
      query.mockRejectedValueOnce(new TypeError('Descriptor unsupported'));
      expect(await request('camera')).toEqual({ status: 'denied', canAskAgain: null });
      getUserMedia.mockRejectedValueOnce(new DOMException('Device is busy', 'NotReadableError'));
      await expect(request('camera')).rejects.toThrow('Device is busy');
      query.mockResolvedValueOnce({ state: 'granted' });
      expect(await check('notifications')).toEqual({ status: 'granted', canAskAgain: false });
      query.mockRejectedValueOnce(new TypeError('Descriptor unsupported'));
      expect(await check('notifications')).toEqual({ status: 'prompt', canAskAgain: true });
      expect(requestNotification).not.toHaveBeenCalled();
      expect(await request('notifications')).toEqual({ status: 'denied', canAskAgain: false });
      expect(requestNotification).toHaveBeenCalledTimes(1);
      expect(await check('location')).toEqual({ status: 'prompt', canAskAgain: true });
      expect(query).toHaveBeenLastCalledWith({ name: 'geolocation' });
      expect(getCurrentPosition).not.toHaveBeenCalled();
      expect(await request('location')).toEqual({ status: 'granted', canAskAgain: false });
      expect(getCurrentPosition).toHaveBeenCalledTimes(1);
      expect(await request('clipboard-read')).toEqual({ status: 'prompt', canAskAgain: true });
      expect(readText).not.toHaveBeenCalled();
      expect(await request('persistent-storage')).toEqual({ status: 'granted', canAskAgain: false });
      expect(await request('android:android.permission.READ_SMS')).toEqual({ status: 'unavailable', canAskAgain: false });
      expect(await openSettings('camera')).toBe(false);
    } finally {
      if (originalWindow) Object.defineProperty(globalThis, 'window', originalWindow);
      else Reflect.deleteProperty(globalThis, 'window');
      if (originalNavigator) Object.defineProperty(globalThis, 'navigator', originalNavigator);
      else Reflect.deleteProperty(globalThis, 'navigator');
      if (originalNotification) Object.defineProperty(globalThis, 'Notification', originalNotification);
      else Reflect.deleteProperty(globalThis, 'Notification');
    }
  });

  test('native chrome classes resolve theme and pressed variants through the bridge without a drawing document', () => {
    const resolve = (pressed: boolean) =>
      JSON.parse(
        engine.drawingCommand(
          0,
          JSON.stringify({
            op: 'componentStyle',
            kind: 'NPress',
            className: 'bg-action flex-row items-center rounded-full px-2.5 py-1 active:opacity-80',
            theme: { colors: { action: '#6f3ef4' } },
            state: { pressed }
          })
        )
      );
    const idle = resolve(false),
      held = resolve(true);
    expect(idle.ok).toBe(true);
    expect(idle.value.backgroundColor).toBe('rgba(111,62,244,1)');
    expect(idle.value.paddingLeft).toBe(10);
    expect(idle.value.paddingTop).toBe(4);
    expect(idle.value.flexDirection).toBe('row');
    expect(idle.value.opacity).toBe(1);
    expect(held.value.opacity).toBeCloseTo(0.8);
  });

  test('public UUID utility uses Rust without a world or render surface', async () => {
    const { uuid } = await import('../../src/uuid');
    const first = uuid();
    core.memory.grow(1);
    const second = uuid();
    expect(first).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(second).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(second).not.toBe(first);
  });

  test('the browser surface presents directly and reads only changed component snapshots', async () => {
    const { ComponentDocument } = await import('../../src/components/ComponentDocument');
    const doc = new ComponentDocument();
    try {
      expect(engine.componentPresent?.(doc.id, 0, 0, 0, 0)).toBe(false);
      doc.present(0, 0, 'transparent');
      expect(engine.documentEvent).toBeFunction();
      doc.invalidateView();
      expect(doc.readChange()?.ui).toMatchObject({ revision: expect.any(Number), nodes: [], events: [] });
      expect(doc.readChange()).toBeNull();
    } finally {
      doc.dispose();
    }
  });

  test('UI images defer I/O until layout and sized decoding crosses the real WASM bridge', async () => {
    const id = engine.componentCreate!();
    const command = (value: Record<string, unknown>) => JSON.parse(engine.drawingCommand(id, JSON.stringify(value)));
    expect(id).toBeGreaterThan(0);
    const drawing = engine.drawingCreate(30, 40, 1);
    try {
      expect(drawing).toBeGreaterThan(0);
      expect(drawing).not.toBe(id);
      expect(JSON.parse(engine.drawingCommand(drawing, '{"op":"state"}')).ok).toBe(true);
      expect(command({ op: 'state' }).ok).toBe(false);
    } finally {
      engine.drawingDestroy(drawing);
    }
    const tree = command({
      op: 'components',
      action: 'tree',
      nodes: [{ id: 'avatar', kind: 'NImage', props: { source: { uri: 'unit-avatar.png' }, cachePolicy: 'none' }, children: [] }]
    });
    expect(tree.ok).toBe(true);
    expect(tree.value.events.map((e: { type: string }) => e.type)).toEqual(['loadStart']);
    expect(tree.value.imageRequests).toEqual([]);
    const jpeg = await readFile(new URL('../core/tests/fixtures/component-thumbnail.jpg', import.meta.url));
    const texture = await engine.textureLoadSizedAsync(Uint8Array.from(jpeg).buffer, 64, 64, 1);
    expect(texture).toBeGreaterThanOrEqual(0);
    expect(engine.textureSize(texture)).toEqual([64, 32]);
    expect((engine.texturePixels(texture) as ArrayBuffer).byteLength).toBe(64 * 32 * 4);
    engine.drawingDestroy(id);
    expect(command({ op: 'componentImage', request: 0, texture }).value).toBeNull();
    expect(engine.textureSize(texture)).toEqual([0, 0]);
  });

  test('world buffers and queries survive memory growth and another world', () => {
    const world = new World(20);
    const entity = world.spawn({ mesh: 'cube', position: [2, 3, 4] });
    world.update(0);
    const matrices = world.matrices;
    core.memory.grow(8);
    const other = new World(100);
    world.set(entity, { position: [5, 6, 7] });
    world.update(1 / 60);
    expect(world.position(entity)).toEqual([5, 6, 7]);
    expect(world.matrices).toBe(matrices);
    expect(matrices.buffer.byteLength).toBe(20 * 64);
    expect(Array.from(matrices.slice(12, 15))).toEqual([5, 6, 7]);
    world.update(1 / 60);
    expect(Array.from(matrices.slice(12, 15))).toEqual([5, 6, 7]);
    other.dispose();
    world.dispose();
    expect(() => world.spawn()).toThrow('dispose');
  });

  test('physics, raycasts, collisions and transforms use the shared core', () => {
    const world = new World(20);
    const ground = world.spawn({
      mesh: 'cube',
      position: [0, -0.5, 0],
      scale: [20, 1, 20],
      physics: 'fixed'
    });
    const ball = world.spawn({
      mesh: 'sphere',
      position: [0, 3, 0],
      physics: 'dynamic'
    });
    let collisions = 0;
    for (let i = 0; i < 120; i++) {
      world.update(1 / 60);
      world.forEachCollision((a, b, info) => {
        if (info.started && (a === ball || b === ball)) collisions++;
      });
    }
    expect(collisions).toBeGreaterThan(0);
    expect(world.position(ball)![1]).toBeLessThan(1);
    expect(world.raycast([5, 10, 0], [0, -1, 0], 20)?.entity).toBe(ground);
    const entity = world.spawn({ position: [0, 0, 0] });
    const batch = world.createTransformBatch();
    batch.set(entity, { position: [3, 4, 5] });
    batch.flush();
    expect(world.position(entity)).toEqual([3, 4, 5]);
    world.dispose();
  });

  test('scoreboard flag acknowledgements, timers and animation completions stay synchronized', async () => {
    const world = new World(10);
    let scores = 0,
      timers = 0;
    world.scoreboard.handlers = { onScore: () => scores++ };
    world.scoreboard.add(10);
    world.update(0);
    expect(scores).toBe(1);
    world.update(0);
    expect(scores).toBe(1);
    world.after(0.05, () => timers++);
    const entity = world.spawn();
    let complete = false;
    const done = animations.animate(world, entity, { position: [2, 0, 0] }, { duration: 0.1 }).then(() => {
      complete = true;
    });
    for (let i = 0; i < 20; i++) world.update(1 / 60);
    await done;
    expect(timers).toBe(1);
    expect(complete).toBe(true);
    expect(world.position(entity)![0]).toBeCloseTo(2);
    const repeat = animations.animate(world, entity, { position: [4, 0, 0] }, { repeat: 'forever', yoyo: true });
    world.update(1 / 60);
    const stoppedAt = world.position(entity);
    animations.stopAnimation(world, entity);
    await repeat;
    world.update(1 / 60);
    expect(world.position(entity)).toEqual(stoppedAt);
    world.dispose();
  });

  test('procedural geometry, optimization, aliases, textures and fonts cross the bridge', async () => {
    const cube = engine.renderMeshVertices(0) as ArrayBuffer;
    const indices = engine.renderMeshIndices(0) as ArrayBuffer;
    expect(cube.byteLength).toBeGreaterThan(0);
    const optimized = engine.geometryOptimize(cube, indices, 1, 0.01, true) as {
      vertices: ArrayBuffer;
      indices: ArrayBuffer;
    };
    expect(optimized.vertices.byteLength).toBeGreaterThan(0);
    expect(engine.meshAlias(0)).toBeGreaterThanOrEqual(16);
    const solid = engine.geometrySolid('{"solid":{"kind":"sphere","radius":1},"resolution":12}') as { vertices: ArrayBuffer };
    expect(solid.vertices.byteLength).toBeGreaterThan(0);
    const font = engine.fontLoad((await readFile(new URL('../core/tests/fixtures/Inter-Bold.ttf', import.meta.url))).buffer, 0.01, '12AB', 0);
    expect(font).toBeGreaterThanOrEqual(0);
    expect(engine.fontGlyphs(font).length).toBeGreaterThan(4);
    const png = await readFile(new URL('../../src/games/assets/__tests__/share.png', import.meta.url));
    const texture = engine.textureLoad(Uint8Array.from(png).buffer);
    expect(texture).toBeGreaterThanOrEqual(0);
    const [width, height] = engine.textureSize(texture);
    expect(width!).toBeGreaterThan(0);
    expect((engine.texturePixels(texture) as ArrayBuffer).byteLength).toBe(width! * height! * 4);
  });

  test('rigged GLB playback and vertex sampling use the same skeleton core', async () => {
    // This triangle is skinned to one joint with an animated X translation.
    const glb = Uint8Array.from(await readFile(new URL('./fixtures/animated-triangle.glb', import.meta.url)));
    const mesh = engine.modelLoad(glb.buffer, false, 0);
    expect(mesh).toBeGreaterThanOrEqual(16);
    const rig = JSON.parse(engine.modelRig(mesh)) as {
      joints: number;
      clips: { name: string }[];
    };
    expect(rig.joints).toBeGreaterThan(0);
    expect(rig.clips.length).toBeGreaterThan(0);
    const world = new World(2);
    const entity = world.spawn({
      mesh: { id: mesh } as import('../../src/games/assets/model').Model
    });
    expect(animations.playClip(world, entity, rig.clips[0]!.name, { time: 0 })).toBe(true);
    const indices = new Uint32Array([0, 1, 2]);
    const points = new Float32Array(9);
    expect(world.sampleSkinnedVertices(entity, indices, points, 1 / 60)).toBe(true);
    expect(Array.from(points).every(Number.isFinite)).toBe(true);
    world.update(1 / 60);
    expect(animations.stopClip(world, entity, true)).toBe(true);
    world.dispose();
  });

  test('WAV decoding, playback, stop and the shared mixer produce real PCM', () => {
    const wav = new ArrayBuffer(44 + 480 * 2);
    const view = new DataView(wav);
    const text = (at: number, value: string) => {
      for (let i = 0; i < value.length; i++) view.setUint8(at + i, value.charCodeAt(i));
    };
    text(0, 'RIFF');
    view.setUint32(4, wav.byteLength - 8, true);
    text(8, 'WAVEfmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, 48000, true);
    view.setUint32(28, 96000, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    text(36, 'data');
    view.setUint32(40, 960, true);
    for (let i = 0; i < 480; i++) view.setInt16(44 + i * 2, Math.sin(i / 10) * 16000, true);
    const sound = engine.audioLoad(wav);
    const voice = engine.audioPlay(sound, 1, 0, 1, true);
    expect(sound).toBeGreaterThanOrEqual(0);
    expect(voice).toBeGreaterThan(0);
    const playbackState = (value: number) => new Float32Array(engine.audioVoiceStatus!(value))[0];
    expect(playbackState(voice)).toBe(0);
    const alloc = core.engine_web_alloc as (size: number) => number;
    const render = core.engine_web_audio_render as (ptr: number, floats: number) => void;
    const free = core.engine_web_free as (ptr: number, bytes: number) => void;
    const pointer = alloc(4096);
    render(pointer, 1024);
    expect(playbackState(voice)).toBe(1);
    expect(new Float32Array(core.memory.buffer, pointer, 1024).some((s) => Math.abs(s) > 0.01)).toBe(true);
    expect(engine.audioControl?.(voice, 0, 1, 0)).toBe(true);
    render(pointer, 1024);
    expect(playbackState(voice)).toBe(2);
    expect(new Float32Array(core.memory.buffer, pointer, 1024).every((s) => s === 0)).toBe(true);
    expect(engine.audioControl?.(voice, 1, 0.001, 0)).toBe(true);
    expect(engine.audioControl?.(voice, 2, 0.5, -1)).toBe(true);
    expect(engine.audioControl?.(voice, 0, 0, 0)).toBe(true);
    render(pointer, 1024);
    const stereo = new Float32Array(core.memory.buffer, pointer, 1024);
    expect(stereo.some((s, i) => i % 2 === 0 && Math.abs(s) > 0.01)).toBe(true);
    expect(stereo.every((s, i) => i % 2 === 0 || s === 0)).toBe(true);
    expect(engine.audioControl?.(voice, 7, 1, 0)).toBe(true);
    render(pointer, 1024);
    expect(stereo.every((s) => s === 0)).toBe(true);
    expect(engine.audioControl?.(0, 3, 0, 0)).toBe(true);
    render(pointer, 1024);
    expect(playbackState(voice)).toBe(4);
    expect(new Float32Array(core.memory.buffer, pointer, 1024).every((s) => s === 0)).toBe(true);
    engine.audioStop(voice);
    engine.audioSetMuted(true);
    render(pointer, 1024);
    expect(new Float32Array(core.memory.buffer, pointer, 1024).every((s) => s === 0)).toBe(true);
    engine.audioSetMuted(false);
    const replay = engine.audioPlay(sound, 0, 0, 1, true);
    expect(engine.audioControl?.(replay, 5, 2, 0)).toBe(true);
    expect(engine.audioControl?.(replay, 6, 0, 0)).toBe(true);
    render(pointer, 1024);
    expect(playbackState(replay)).toBe(3);
    const exported = engine.audioEncodeWav!(sound);
    expect(new Uint8Array(exported, 0, 4)).toEqual(Uint8Array.of(82, 73, 70, 70));
    const decoded = engine.audioLoad(exported);
    expect(engine.audioDuration(decoded)).toBeCloseTo(0.01);
    engine.audioRelease(sound);
    engine.audioRelease(decoded);
    free(pointer, 4096);
  });

  test('descriptions and stale world handles are validated', () => {
    const id = engine.createWorld(1);
    const desc = new Float64Array(DESC_LEN);
    encode(desc, { position: [1, 2, 3] }, 0);
    expect(engine.spawnDesc(id, desc.buffer)).toBeGreaterThanOrEqual(0);
    expect(engine.spawnDesc(id, desc.buffer)).toBe(-1);
    engine.destroyWorld(id);
    expect(() => engine.count(id)).toThrow('disposed');
    expect(() => engine.createWorld(-1)).toThrow('capacity');
  });
});

describe('browser pointer gestures', () => {
  test('overlay capture, movement, cancellation and pinch preserve the shared callbacks', async () => {
    const { PanResponder } = await import('../../src/games/render/responder.web');
    mock.module('../../src/games/render/responder', () => ({ PanResponder }));
    const { createTouchResponder } = await import('../../src/games/render/touch');
    const taps: [number, number][] = [];
    const drags: { phase: string; cancelled?: boolean }[] = [];
    const pinches: { phase: string; scale: number }[] = [];
    const overlay: string[] = [];
    let claim = false;
    const touch = createTouchResponder(() => ({
      onTap: (x, y) => taps.push([x, y]),
      onDrag: (drag) => drags.push(drag),
      onPinch: (pinch) => pinches.push(pinch),
      onOverlayTouch: (phase) => {
        overlay.push(phase);
        return claim;
      }
    }));
    const events = touch.responder.panHandlers as unknown as ReturnType<typeof PanResponder.create>['panHandlers'];
    const event = (id: number, x: number, y: number) =>
      ({
        pointerId: id,
        clientX: x + 50,
        clientY: y + 100,
        button: 0,
        currentTarget: {
          getBoundingClientRect: () => ({ left: 50, top: 100 }),
          setPointerCapture() {}
        },
        preventDefault() {}
      }) as unknown as Parameters<typeof events.onPointerDown>[0];
    events.onPointerDown(event(1, 10, 20));
    events.onPointerUp(event(1, 10, 20));
    expect(taps).toEqual([[10, 20]]);
    claim = true;
    events.onPointerDown(event(1, 10, 20));
    events.onPointerMove(event(1, 20, 30));
    events.onPointerUp(event(1, 20, 30));
    expect(taps.length).toBe(1);
    expect(overlay.slice(-3)).toEqual(['start', 'move', 'end']);
    claim = false;
    events.onPointerDown(event(1, 10, 20));
    events.onPointerDown(event(2, 30, 20));
    events.onPointerMove(event(2, 50, 20));
    expect(drags.at(-1)?.cancelled).toBe(true);
    expect(pinches.at(-1)?.scale).toBe(2);
    touch.cancel();
    expect(pinches.at(-1)?.phase).toBe('end');
    // A new gesture must work immediately after blur/pause cancellation.
    events.onPointerDown(event(3, 5, 6));
    events.onPointerUp(event(3, 5, 6));
    expect(taps.at(-1)).toEqual([5, 6]);
    touch.dispose();
  });
});

describe('Rust browser cache with a binary asynchronous storage bridge', () => {
  test('large source files stay on demand and saved geometry warms synchronous Rust lookups', async () => {
    const wasm = await import('../core/build/web/engine_core.js');
    const saved = new Map<string, Uint8Array>();
    const kind = new Map<string, boolean>();
    wasm.install_asset_storage({
      write(name: string, bytes: Uint8Array, geometry: boolean) {
        saved.set(name, bytes);
        kind.set(name, geometry);
      },
      async read(name: string) {
        return saved.get(name);
      },
      remove(name: string) {
        saved.delete(name);
      },
      clear() {
        saved.clear();
      }
    });
    try {
      const payload = new Uint8Array(6 * 1024 * 1024);
      payload[0] = 17;
      payload[payload.length - 1] = 231;
      expect(engine.cacheWrite('source:large-file', payload.buffer)).toBe(true);
      expect((engine.cacheRead('source:large-file') as ArrayBuffer).byteLength).toBe(0);
      const loaded = await wasm.read_saved_asset('source:large-file');
      expect(loaded.length).toBe(payload.length);
      expect(loaded[0]).toBe(17);
      expect(loaded.at(-1)).toBe(231);
      expect([...saved.values()][0]!.length).toBeGreaterThan(5 * 1024 * 1024);
      expect([...kind.values()][0]).toBe(false);
      expect(engine.cacheWrite('prepared-test', new Uint8Array([1, 2, 3]).buffer)).toBe(true);
      const entry = [...saved].find(([name]) => kind.get(name))!;
      expect(wasm.restore_asset_record('wrong-key', entry[1])).toBe(false);
      expect(wasm.restore_asset_record(entry[0], entry[1])).toBe(true);
      expect(new Uint8Array(engine.cacheRead('prepared-test') as ArrayBuffer)).toEqual(new Uint8Array([1, 2, 3]));
      const bad = entry[1].slice();
      bad[bad.length - 1] = bad[bad.length - 1]! ^ 1;
      expect(wasm.restore_asset_record(entry[0], bad)).toBe(false);
      expect(wasm.can_warm_asset_record(65 * 1024 * 1024)).toBe(false);
      const world = new World(4);
      const actor = world.spawn({ mesh: 'cube' });
      expect(engine.cacheClear()).toBe(true);
      expect(saved.size).toBe(0);
      expect(world.position(actor)).toEqual([0, 0, 0]);
      world.dispose();
    } finally {
      wasm.install_asset_storage(undefined);
    }
  });
});
