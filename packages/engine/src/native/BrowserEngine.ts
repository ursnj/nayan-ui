import type { EngineBridge } from './EngineBridge';

/** Raw C exports are shared with the mobile JSI bridge. All pointers stay private here. */
export interface WasmCore {
  memory: WebAssembly.Memory;
  [name: string]: unknown;
}

type Export = (...args: number[]) => number | bigint;
type MirrorName = 'matrices' | 'colors' | 'regions' | 'ranges' | 'done' | 'events' | 'scratch' | 'scoreboard_state';

type WorldBuffers = {
  id: number;
  pointer: number;
  capacity: number;
  /** JS mirrors of the world's output buffers, each with a byte view reused by every sync. */
  buffers: Map<MirrorName, ArrayBuffer>;
  views: Map<MirrorName, Uint8Array>;
  /** The scoreboard mirror as doubles, for the flags write-back before each update. */
  score: Float64Array | null;
};

const lengths: Record<MirrorName, (capacity: number) => number> = {
  matrices: (c) => c * 64,
  colors: (c) => c * 16,
  regions: (c) => c * 16,
  ranges: () => 4096 * 16,
  done: (c) => (c * 5 + 64) * 4,
  events: () => 4096 * 16,
  scratch: () => 64,
  scoreboard_state: () => 64
};
/** Mirrors whose native memory is exactly as long as the mirror, so a renderer can read it in place. */
const drawable: ReadonlySet<MirrorName> = new Set(['matrices', 'colors', 'regions', 'ranges']);
const MATRIX_BYTES = 64;
const VEC4_BYTES = 16;
/** Doubles per `setTransforms` record (TRANSFORM_STRIDE). */
const TRANSFORM_DOUBLES = 16;
/** Scoreboard slot JS may clear after reading (see engine_world_scoreboard_state). */
const SCORE_FLAGS = 4;
const pixelExtent = (value: number) => (Number.isFinite(value) ? Math.max(0, Math.min(0xffffffff, value)) : 0);

export function createBrowserEngine(core: WasmCore): EngineBridge {
  const worlds = new Map<number, WorldBuffers>();
  // Mirrors handed to JS, so render calls given a world's own buffers read its memory in place.
  const mirrors = new WeakMap<ArrayBuffer, { world: WorldBuffers; name: MirrorName }>();
  let nextWorld = 1;
  const slots: ({ pointer: number; size: number } | undefined)[] = [];
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  // Exports are resolved once (lazily, so a core missing an optional export fails only when it is used).
  const resolved: Record<string, Export> = Object.create(null);
  const ex = (name: string): Export => {
    const cached = resolved[name];
    if (cached) return cached;
    const found = core[`engine_${name}`];
    if (typeof found !== 'function') throw new Error(`Engine WASM is missing engine_${name}`);
    resolved[name] = found as Export;
    return found as Export;
  };
  const fn = (name: string, ...args: number[]): number => Number(ex(name)(...args));

  // Views into WASM memory, re-created only after memory.grow replaces (detaches) the buffer.
  let heap: ArrayBuffer | null = null;
  let heapU8 = new Uint8Array(0);
  let heapF64 = new Float64Array(0);
  const memory = (): ArrayBuffer => {
    const current = core.memory.buffer;
    if (current !== heap) {
      heap = current;
      heapU8 = new Uint8Array(current);
      heapF64 = new Float64Array(current, 0, current.byteLength >> 3);
    }
    return current;
  };
  const u8 = () => {
    memory();
    return heapU8;
  };
  const f64 = () => {
    memory();
    return heapF64;
  };

  const buf = (value: ArrayBufferLike): ArrayBuffer => {
    if (!(value instanceof ArrayBuffer)) throw new Error('Engine: expected an ArrayBuffer');
    return value;
  };
  const bytes = (value: ArrayBufferLike): Uint8Array => new Uint8Array(buf(value));
  const copy = (pointer: number, length: number): ArrayBuffer => u8().slice(pointer, pointer + length).buffer;

  // Reused aligned scratch allocations, one per argument position.
  const slot = (index: number, size: number): number => {
    let s = slots[index];
    if (!s || s.size < size) {
      if (s) {
        slots[index] = undefined;
        fn('web_free', s.pointer, s.size);
      }
      const reserved = Math.max(64, size);
      s = { pointer: fn('web_alloc', reserved), size: reserved };
      slots[index] = s;
    }
    return s.pointer;
  };
  /** Copies `value` into scratch slot `index` (allocating first, since growth detaches views). */
  const put = (index: number, value: Uint8Array): number => {
    const pointer = slot(index, value.byteLength);
    u8().set(value, pointer);
    return pointer;
  };
  /** A zero-filled scratch slot for a native function to write into. */
  const zeroed = (index: number, size: number): number => {
    const pointer = slot(index, size);
    u8().fill(0, pointer, pointer + size);
    return pointer;
  };
  const inputs = (values: readonly Uint8Array[]): number[] => values.map((value, i) => put(i, value));
  const data = (...values: ArrayBufferLike[]) => inputs(values.map(bytes));

  const w = (id: number) => {
    const world = worlds.get(id);
    if (!world) throw new Error('World: unknown or disposed world');
    return world;
  };
  const ptr = (id: number) => w(id).pointer;
  const native = (world: WorldBuffers, name: MirrorName) => Number(ex(`world_${name}`)(world.pointer));
  /** Copies up to `length` bytes of a world output into its mirror (if JS asked for that mirror). */
  const sync = (world: WorldBuffers, name: MirrorName, length: number) => {
    const view = world.views.get(name);
    if (!view) return;
    const n = Math.min(length, view.byteLength);
    if (n <= 0) return;
    const pointer = native(world, name);
    view.set(u8().subarray(pointer, pointer + n));
  };
  const buffer = (id: number, name: MirrorName): ArrayBuffer => {
    const world = w(id);
    let b = world.buffers.get(name);
    if (!b) {
      b = new ArrayBuffer(lengths[name](world.capacity));
      world.buffers.set(name, b);
      world.views.set(name, new Uint8Array(b));
      if (name === 'scoreboard_state') world.score = new Float64Array(b);
      mirrors.set(b, { world, name });
      // done/events have valid lengths smaller than their reserved storage.
      sync(
        world,
        name,
        name === 'done' ? fn('world_done_len', world.pointer) * 4 : name === 'events' ? fn('world_event_len', world.pointer) * 4 : b.byteLength
      );
    }
    return b;
  };
  const scoreIn = (world: WorldBuffers) => {
    if (!world.score) return;
    const pointer = native(world, 'scoreboard_state');
    f64()[(pointer >> 3) + SCORE_FLAGS] = world.score[SCORE_FLAGS]!;
  };
  /**
   * A render input: a live world's own output buffer is read in place (the mirror holds the same
   * data, copied after the last update), anything else is copied into scratch slot `index`.
   */
  const source = (index: number, value: ArrayBufferLike): number => {
    const b = buf(value);
    const mirror = mirrors.get(b);
    if (mirror && drawable.has(mirror.name) && worlds.get(mirror.world.id) === mirror.world) return native(mirror.world, mirror.name);
    return put(index, new Uint8Array(b));
  };
  const scalar = (name: string, id: number, ...args: number[]) => Number(ex(name)(ptr(id), ...args));
  const hit = (id: number, name: string, ...args: number[]) => {
    const world = w(id);
    const result = Number(ex(name)(world.pointer, ...args));
    sync(world, 'scratch', 64);
    return result === 0xffffffff || result === -1 ? -1 : result;
  };
  const query = (id: number, name: string, ...args: number[]) => {
    const world = w(id);
    const result = Number(ex(name)(world.pointer, ...args));
    sync(world, 'scratch', 64);
    return result !== 0;
  };
  const string = (name: string, args: number[] = []) => {
    const length = fn(name, ...args, 0, 0);
    const p = zeroed(0, length + 1);
    fn(name, ...args, p, length + 1);
    return decoder.decode(u8().subarray(p, p + length));
  };
  const cString = (pointer: number) => {
    const b = u8();
    let end = pointer;
    while (end < b.length && b[end] !== 0) end++;
    return decoder.decode(b.subarray(pointer, end));
  };
  /** Copies a UTF-8 argument into scratch slot `index`: [pointer, byte length]. */
  const text = (index: number, value: string): [number, number] => {
    const b = encoder.encode(value);
    return [put(index, b), b.length];
  };
  /** A core function's f64 output (asked for its length first) as a new ArrayBuffer. */
  const readDoubles = (read: (out: number, capacity: number) => number): ArrayBuffer => {
    const count = read(0, 0);
    const out = zeroed(2, Math.max(8, count * 8));
    read(out, count);
    return copy(out, count * 8);
  };
  const geometry = (handle: number) => {
    try {
      const error = cString(fn('geometry_error', handle));
      if (error) throw new Error(`Engine geometry: ${error}`);
      const pointer = fn('geometry_data', handle);
      const size = fn('geometry_size', handle);
      if (size < 8) throw new Error('Engine geometry: invalid result');
      const header = new Uint32Array(memory(), pointer, 2);
      const vertexBytes = header[0]! * 44;
      const indexBytes = header[1]! * 4;
      if (size !== 8 + vertexBytes + indexBytes) throw new Error('Engine geometry: invalid buffers');
      return {
        vertices: copy(pointer + 8, vertexBytes),
        indices: copy(pointer + 8 + vertexBytes, indexBytes)
      };
    } finally {
      fn('geometry_free', handle);
    }
  };
  const meshCopy = (mesh: number, kind: 'vertices' | 'indices') => {
    const count = fn(`render_mesh_${kind === 'vertices' ? 'vertex' : 'index'}_count`, mesh);
    const size = count * (kind === 'vertices' ? 44 : 4);
    const p = zeroed(0, size);
    fn(`render_mesh_${kind}`, mesh, p, size / 4);
    return copy(p, size);
  };
  const dimensions = (name: string, id: number, count: number, float: boolean) => {
    const p = zeroed(0, count * 4);
    fn(name, id, p);
    return Array.from(float ? new Float32Array(memory(), p, count) : new Uint32Array(memory(), p, count));
  };
  /** A promise for work that runs right here (its errors reject it). */
  const settle = <T>(work: () => T): Promise<T> => new Promise((resolve) => resolve(work()));
  const nativeModule = (): never => {
    throw new Error('Engine: use the platform-specific module entry');
  };
  const engine: EngineBridge = {
    networkStart: nativeModule,
    networkStop: nativeModule,
    clipboardRequest: nativeModule,
    sharingRequest: nativeModule,
    captureRequest: nativeModule,
    systemThemeSet: nativeModule,
    systemBarsSet: nativeModule,
    systemBarsRemove: nativeModule,
    storageRequest: nativeModule,
    storageRead: nativeModule,
    storageWrite: nativeModule,
    uuid() {
      const pointer = slot(0, 36);
      if (!fn('uuid', pointer, 36)) throw new Error('Engine: UUID generation failed');
      return decoder.decode(u8().subarray(pointer, pointer + 36));
    },
    createWorld(capacity) {
      if (!Number.isInteger(capacity) || capacity < 1 || capacity > 1_000_000) throw new Error('World: capacity must be an integer in 1..1000000');
      const pointer = fn('world_new', capacity);
      if (!pointer) throw new Error('Games were disabled in this engine build');
      const id = nextWorld++;
      worlds.set(id, {
        id,
        pointer,
        capacity,
        buffers: new Map(),
        views: new Map(),
        score: null
      });
      return id;
    },
    destroyWorld(id) {
      fn('world_free', ptr(id));
      worlds.delete(id);
    },
    spawnDesc(id, desc) {
      const b = bytes(desc);
      const p = put(0, b);
      return hit(id, 'world_spawn_desc', p, b.byteLength / 8);
    },
    setDesc(id, entity, desc) {
      const b = bytes(desc);
      const p = put(0, b);
      return scalar('world_set_desc', id, entity, p, b.byteLength / 8) !== 0;
    },
    setTransforms(id, transforms, count) {
      const b = buf(transforms);
      // The batch's storage only grows: copy just the queued records.
      const used = count > 0 ? Math.min(b.byteLength, Math.trunc(count) * TRANSFORM_DOUBLES * 8) : b.byteLength;
      const p = put(0, new Uint8Array(b, 0, used));
      return scalar('world_set_transforms', id, p, used / 8, count);
    },
    despawn(id, entity) {
      return scalar('world_despawn', id, entity) !== 0;
    },
    impulse(id, entity, x, y, z) {
      scalar('world_apply_impulse', id, entity, x, y, z);
    },
    setGravity(id, x, y, z) {
      scalar('world_set_gravity', id, x, y, z);
    },
    setBounds(id, a, b, c, d) {
      scalar('world_set_bounds', id, a, b, c, d);
    },
    setListener(id, entity) {
      scalar('world_set_listener', id, entity);
    },
    raycast(id, ...args) {
      return hit(id, 'world_raycast', ...args);
    },
    pick(id, ...args) {
      return hit(id, 'world_pick', ...args);
    },
    pickScreen(id, x, y) {
      return hit(id, 'world_pick_screen', x, y);
    },
    setView(id, matrix, width, height) {
      const p = put(0, bytes(matrix));
      scalar('world_set_view', id, p, width, height);
    },
    screenRay(id, x, y) {
      return query(id, 'world_screen_ray', x, y);
    },
    screenToWorld(id, ...args) {
      return query(id, 'world_screen_to_world', ...args);
    },
    toScreen(id, x, y, z) {
      return query(id, 'world_to_screen', x, y, z);
    },
    readPosition(id, entity, rendered) {
      return query(id, 'world_read_position', entity, +rendered);
    },
    readVelocity(id, entity) {
      return query(id, 'world_read_velocity', entity);
    },
    animate(id, value) {
      const b = bytes(value);
      const p = put(0, b);
      return scalar('world_animate', id, p, b.byteLength / 8);
    },
    stopAnimation(id, entity) {
      return scalar('world_stop_animation', id, entity) !== 0;
    },
    burst(id, value) {
      const b = bytes(value);
      const p = put(0, b);
      return scalar('world_burst', id, p, b.byteLength / 8);
    },
    update(id, dt) {
      const world = w(id);
      scoreIn(world);
      ex('world_update')(world.pointer, dt);
      // Only the first `count` instances are valid after an update (ranges never reach past them),
      // so the per-instance mirrors copy just those rather than the whole capacity.
      const count = Number(ex('world_count')(world.pointer));
      sync(world, 'matrices', count * MATRIX_BYTES);
      sync(world, 'colors', count * VEC4_BYTES);
      sync(world, 'regions', count * VEC4_BYTES);
      sync(world, 'ranges', Infinity);
      sync(world, 'scoreboard_state', Infinity);
    },
    after(id, seconds) {
      return scalar('world_after', id, seconds);
    },
    cancelTimers(id) {
      return scalar('world_cancel_timers', id);
    },
    scoreboard(id, op, a, b) {
      const world = w(id);
      scoreIn(world);
      const result = Number(ex('world_scoreboard')(world.pointer, op, a, b));
      sync(world, 'scoreboard_state', Infinity);
      return result;
    },
    getScoreboard: (id) => buffer(id, 'scoreboard_state'),
    count: (id) => scalar('world_count', id),
    getMatrices: (id) => buffer(id, 'matrices'),
    getColors: (id) => buffer(id, 'colors'),
    getRegions: (id) => buffer(id, 'regions'),
    getRanges: (id) => buffer(id, 'ranges'),
    getDone: (id) => buffer(id, 'done'),
    doneLength(id) {
      const world = w(id);
      const length = fn('world_done_len', world.pointer);
      sync(world, 'done', length * 4);
      return length;
    },
    getEvents: (id) => buffer(id, 'events'),
    eventLength(id) {
      const world = w(id);
      const length = fn('world_event_len', world.pointer);
      sync(world, 'events', length * 4);
      return length;
    },
    getScratch: (id) => buffer(id, 'scratch'),
    modelRig: (mesh) => string('model_rig', [mesh]),
    playClip(id, entity, name, loop, speed, fade, time) {
      const b = encoder.encode(name);
      const p = put(0, b);
      return scalar('world_play_clip', id, entity, p, b.length, +loop, speed, fade, time) !== 0;
    },
    stopClip(id, entity, reset) {
      return scalar('world_stop_clip', id, entity, +reset) !== 0;
    },
    skinPoints(id, entity, vertices, output, after) {
      const count = bytes(vertices).byteLength / 4;
      if (bytes(output).byteLength < count * 12) throw new Error('skinPoints: output needs three floats per vertex');
      const [v, o] = data(vertices, output);
      const ok = scalar('world_skin_points', id, entity, v!, count, o!, after) !== 0;
      if (ok) bytes(output).set(u8().subarray(o!, o! + output.byteLength));
      return ok;
    },
    cacheRead(key) {
      const text = encoder.encode(key);
      const p = put(0, text);
      const record = fn('cache_read', p, text.length);
      if (!record) return new ArrayBuffer(0);
      try {
        return copy(fn('cache_data', record), fn('cache_size', record));
      } finally {
        fn('cache_free', record);
      }
    },
    cacheWrite(key, value) {
      const text = encoder.encode(key);
      const [p, data] = inputs([text, bytes(value)]);
      return fn('cache_write', p!, text.length, data!, bytes(value).length) !== 0;
    },
    cacheRemove(key) {
      const text = encoder.encode(key);
      const p = put(0, text);
      return fn('cache_remove', p, text.length) !== 0;
    },
    cacheClear: () => fn('cache_clear') !== 0,
    shapePrepare(vertices, indices, options) {
      const text = encoder.encode(options);
      const [v, i, o] = inputs([bytes(vertices), bytes(indices), text]);
      return fn('shape_prepare', v!, bytes(vertices).length / 4, i!, bytes(indices).length / 4, o!, text.length);
    },
    solidPrepare(recipe, options) {
      const r = encoder.encode(recipe),
        o = encoder.encode(options);
      const [a, b] = inputs([r, o]);
      return fn('solid_prepare', a!, r.length, b!, o.length);
    },
    modelLoad(value, center, fit) {
      const [p] = data(value);
      return fn('model_load', p!, bytes(value).length, +center, fit);
    },
    modelVertices: (mesh) => copy(fn('model_vertices', mesh), fn('model_vertex_count', mesh) * 44),
    modelIndices: (mesh) => copy(fn('model_indices', mesh), fn('model_index_count', mesh) * 4),
    modelSize: (mesh) => {
      const [x, y, z] = dimensions('model_size', mesh, 3, true);
      return [x!, y!, z!];
    },
    bakeKept(key) {
      const [k, length] = text(0, key);
      return fn('bake_kept', k, length) !== 0;
    },
    modelBake(mesh, spec) {
      const [s, length] = text(0, spec);
      const out = zeroed(1, 16);
      if (!fn('model_bake', mesh, s, length, out)) return [];
      const [texture, x, y, extent] = new Float32Array(u8().slice(out, out + 16).buffer);
      return [texture!, x!, y!, extent!];
    },
    // The browser core is single-threaded: the "background" loads settle at once with the same work.
    modelLoadAsync(value, center, fit) {
      return settle(() => engine.modelLoad(value, center, fit));
    },
    textureLoadAsync(value) {
      return settle(() => engine.textureLoad(value));
    },
    textureLoadSizedAsync(value, width, height, fit) {
      return settle(() => {
        const [p] = data(value);
        return fn('texture_load_sized', p!, bytes(value).length, width, height, fit);
      });
    },
    fontLoadAsync(value, depth, chars, weight) {
      return settle(() => engine.fontLoad(value, depth, chars, weight));
    },
    audioLoadAsync(value) {
      return settle(() => engine.audioLoad(value));
    },
    // An older core without it uploads through JS instead (see registerCoreMesh).
    renderModel: (mesh, texture, shine) => typeof core.engine_render_model === 'function' && fn('render_model', mesh, texture, shine) !== 0,
    modelTexture: (mesh) => fn('model_texture', mesh),
    meshAlias: (mesh) => fn('mesh_alias', mesh),
    meshCreate(vertices, indices) {
      const [v, i] = data(vertices, indices);
      return fn('mesh_create', v!, bytes(vertices).length / 44, i!, bytes(indices).length / 4);
    },
    pathExtrude(points, counts, depth, evenOdd) {
      if (counts.some((c) => !Number.isInteger(c) || c < 0) || counts.reduce((a, b) => a + b, 0) * 8 > bytes(points).length)
        throw new Error('pathExtrude: invalid contour counts');
      const [p, c] = inputs([bytes(points), new Uint8Array(new Uint32Array(counts).buffer)]);
      const count = fn('path_extrude', p!, c!, counts.length, depth, +evenOdd);
      const out = zeroed(0, count * 4);
      fn('path_extrude_copy', out, count);
      return copy(out, count * 4);
    },
    geometrySmoothNormals(vertices, indices) {
      const [v, i] = data(vertices, indices);
      fn('geometry_smooth_normals', v!, bytes(vertices).length / 44, i!, bytes(indices).length / 4);
      bytes(vertices).set(u8().subarray(v!, v! + vertices.byteLength));
    },
    geometrySolid(recipe) {
      const b = encoder.encode(recipe);
      const p = put(0, b);
      return geometry(fn('geometry_solid', p, b.length));
    },
    geometryOptimize(vertices, indices, ratio, error, lock) {
      const [v, i] = data(vertices, indices);
      return geometry(fn('geometry_optimize', v!, bytes(vertices).length / 4, i!, bytes(indices).length / 4, ratio, error, +lock));
    },
    geometryFaceOutward(vertices, indices) {
      const [v, i] = data(vertices, indices);
      fn('geometry_face_outward', v!, bytes(vertices).length / 44, i!, bytes(indices).length / 4);
      bytes(indices).set(u8().subarray(i!, i! + indices.byteLength));
    },
    geometryPlace(vertices, indices, placement, first, outVertices, vertexOffset, outIndices, indexOffset) {
      const vbytes = bytes(vertices),
        ibytes = bytes(indices);
      if (
        placement.length < 13 ||
        vertexOffset < 0 ||
        indexOffset < 0 ||
        vertexOffset * 4 + vbytes.length > bytes(outVertices).length ||
        indexOffset * 4 + ibytes.length > bytes(outIndices).length
      )
        throw new Error('geometryPlace: invalid output bounds');
      const [v, i, p, ov, oi] = inputs([vbytes, ibytes, new Uint8Array(new Float32Array(placement).buffer), bytes(outVertices), bytes(outIndices)]);
      fn('geometry_place', v!, vbytes.length / 44, i!, ibytes.length / 4, p!, first, ov! + vertexOffset * 4, oi! + indexOffset * 4);
      bytes(outVertices).set(u8().subarray(ov!, ov! + outVertices.byteLength));
      bytes(outIndices).set(u8().subarray(oi!, oi! + outIndices.byteLength));
    },
    textureLoad(value) {
      const [p] = data(value);
      return fn('texture_load', p!, bytes(value).length);
    },
    texturePixels(id) {
      const [width, height] = dimensions('texture_size', id, 2, false);
      const pointer = fn('texture_pixels', id);
      if (!pointer) throw new Error('NayanEngine: unknown world, mesh or texture');
      return copy(pointer, width! * height! * 4);
    },
    textureSize: (id) => {
      const [width, height] = dimensions('texture_size', id, 2, false);
      return [width!, height!];
    },
    fontLoad(value, depth, chars, weight) {
      const b = encoder.encode(chars);
      const [p, c] = inputs([bytes(value), b]);
      return fn('font_load', p!, bytes(value).length, depth, c!, b.length, weight);
    },
    fontGlyphs(id) {
      const count = fn('font_glyph_floats', id);
      const pointer = fn('font_glyphs', id);
      return [...new Float32Array(memory(), pointer, count), fn('font_cap_height', id)];
    },
    loadError: () => string('load_error'),
    generateBuiltinMeshes() {
      fn('generate_builtin_meshes');
    },
    renderWarmUp() {},
    renderMeshVertices: (mesh) => meshCopy(mesh, 'vertices'),
    renderMeshIndices: (mesh) => meshCopy(mesh, 'indices'),
    renderMesh(mesh, vertices, indices, texture, shine) {
      const [v, i] = data(vertices, indices);
      fn('render_mesh', mesh, v!, bytes(vertices).length / 44, i!, bytes(indices).length / 4, texture, shine);
    },
    renderFrame(surface, frame, matrices, colors, regions, ranges, count, viewProj, world) {
      const frameBuffer = buf(frame);
      const capacity = Math.min(buf(matrices).byteLength / MATRIX_BYTES, buf(colors).byteLength / VEC4_BYTES, buf(regions).byteLength / VEC4_BYTES);
      const f = put(0, new Uint8Array(frameBuffer));
      const m = source(1, matrices);
      const c = source(2, colors);
      const r = source(3, regions);
      const buckets = source(4, ranges);
      const out = buf(viewProj);
      const vp = put(5, new Uint8Array(out));
      const result = Number(
        ex('render_frame')(
          surface,
          f,
          frameBuffer.byteLength / 8,
          m,
          c,
          r,
          capacity,
          buckets,
          ranges.byteLength / 4,
          count,
          vp,
          world >= 0 ? ptr(world) : 0
        )
      );
      // Rendering may grow memory: u8() re-creates the view if so.
      new Uint8Array(out, 0, 64).set(u8().subarray(vp, vp + 64));
      return result;
    },
    renderOverlay(surface, matrices, colors, regions, ranges, count, width, height) {
      const capacity = Math.min(buf(matrices).byteLength / MATRIX_BYTES, buf(colors).byteLength / VEC4_BYTES, buf(regions).byteLength / VEC4_BYTES);
      const m = source(1, matrices);
      const c = source(2, colors);
      const r = source(3, regions);
      const buckets = source(4, ranges);
      ex('render_overlay')(surface, m, c, r, capacity, buckets, ranges.byteLength / 4, count, width, height);
    },
    renderBackdrop(surface, matrices, colors, regions, ranges, count) {
      const capacity = Math.min(buf(matrices).byteLength / MATRIX_BYTES, buf(colors).byteLength / VEC4_BYTES, buf(regions).byteLength / VEC4_BYTES);
      const m = source(1, matrices);
      const c = source(2, colors);
      const r = source(3, regions);
      const buckets = source(4, ranges);
      ex('render_backdrop')(surface, m, c, r, capacity, buckets, ranges.byteLength / 4, count);
    },
    renderError: () => string('render_error'),
    renderBackend: () => string('render_backend'),
    componentCreate: () => (typeof core.engine_component_create === 'function' ? fn('component_create') : fn('drawing_create', 1, 1, 1)),
    componentPresent:
      typeof core.engine_web_component_present === 'function'
        ? (document, width, height, pixelWidth, pixelHeight) => {
            const result = fn('web_component_present', document, width, height, pixelExtent(pixelWidth), pixelExtent(pixelHeight));
            if (result < 0) throw new Error(string('render_error') || 'Component render failed');
            return result > 0;
          }
        : undefined,
    documentEvent:
      typeof core.engine_drawing_take_event === 'function'
        ? (document) => {
            const pointer = fn('drawing_take_event', document);
            if (!pointer) return null;
            try {
              const memory = u8();
              const end = memory.indexOf(0, pointer);
              if (end < 0) throw new Error('Invalid surface event');
              return decoder.decode(memory.subarray(pointer, end));
            } finally {
              fn('drawing_result_free', pointer);
            }
          }
        : undefined,
    drawingCreate: (width, height, ratio) => fn('drawing_create', width, height, ratio),
    drawingDestroy: (document) => {
      fn('drawing_destroy', document);
    },
    async iconRequest(data, command) {
      const text = encoder.encode(command);
      const input = put(0, text);
      const bytes = put(1, new Uint8Array(data));
      const pointer = fn('icon_request', bytes, data.byteLength, input, text.length);
      if (!pointer) throw new Error('Icon request failed');
      try {
        const memory = u8();
        const end = memory.indexOf(0, pointer);
        if (end < 0) throw new Error('Invalid icon response');
        return decoder.decode(memory.subarray(pointer, end));
      } finally {
        fn('drawing_result_free', pointer);
      }
    },
    drawingCommand(document, command) {
      const text = encoder.encode(command);
      const input = put(0, text);
      const pointer = fn('drawing_command', document, input, text.length);
      if (!pointer) throw new Error('Drawing command failed');
      try {
        const memory = u8();
        const end = memory.indexOf(0, pointer);
        if (end < 0) throw new Error('Invalid drawing response');
        return decoder.decode(memory.subarray(pointer, end));
      } finally {
        fn('drawing_result_free', pointer);
      }
    },
    audioLoad(value) {
      const [p] = data(value);
      return fn('audio_load_wav', p!, bytes(value).length);
    },
    audioPlay(sound, volume, pan, pitch, loop) {
      return fn('audio_play', sound, volume, pan, pitch, +loop);
    },
    audioStop(voice) {
      const f = core.engine_audio_stop as (voice: bigint) => void;
      f(BigInt(voice));
    },
    audioControl(voice, action, value, pan) {
      const control = core.engine_audio_control as ((voice: bigint, action: number, value: number, pan: number) => number) | undefined;
      return control?.(BigInt(voice), action, value, pan) === 1;
    },
    audioSetVolume(volume) {
      fn('audio_set_volume', volume);
    },
    audioSetMuted(muted) {
      fn('audio_set_muted', +muted);
    },
    audioIsRunning: () => fn('audio_is_running') !== 0,
    audioRelease(sound) {
      fn('audio_release', sound);
    },
    audioDuration: (sound) => fn('audio_duration', sound),
    audioLevels(sound, perSecond) {
      const count = fn('audio_levels', sound, perSecond, 0, 0);
      if (!count) return new ArrayBuffer(0);
      const p = zeroed(0, count * 4);
      fn('audio_levels', sound, perSecond, p, count);
      return copy(p, count * 4);
    },
    audioShift: (sound, pitch, tempo, loudness, clean) => fn('audio_shift', sound, pitch, tempo, loudness, +clean),
    // The page's microphone (permission, getUserMedia and the input node) is installed over these
    // by `installMicrophoneInput`; the core keeps what was heard either way.
    micPermission: () => {
      const permission = core.engine_audio_mic_permission;
      return typeof permission !== 'function' || permission() === -2 ? -2 : 0;
    },
    micRequestPermission: () => Promise.resolve(false),
    micStart: (maxSeconds) => fn('audio_mic_start', maxSeconds) !== 0,
    micStop() {
      fn('audio_mic_stop');
    },
    micState: () => fn('audio_mic_state'),
    micLevel: () => fn('audio_mic_level'),
    micHeld: () => fn('audio_mic_held'),
    micTake: (seconds, skipEnd) => fn('audio_mic_take', seconds, skipEnd),
    hapticsSupported: () => fn('haptics_supported') !== 0,
    hapticsPlay(taps, throttle) {
      const p = put(0, new Uint8Array(new Float32Array(taps).buffer));
      fn('haptics_play', p, taps.length / 3, +throttle);
    },
    worldgenBuild: (recipe, key, prepareTerrain) => {
      const [r, rl] = text(0, recipe);
      const [k, kl] = text(1, key);
      return fn('worldgen_build', r, rl, k, kl, +prepareTerrain) >>> 0;
    },
    // The web core is single-threaded: build now, settle as a promise.
    worldgenBuildAsync: async (recipe, key, prepareTerrain) => engine.worldgenBuild(recipe, key, prepareTerrain),
    worldgenError: () => string('worldgen_error'),
    worldgenKept(key) {
      const [k, kl] = text(0, key);
      return fn('worldgen_kept', k, kl) !== 0;
    },
    worldgenFree(world) {
      fn('worldgen_free', world);
    },
    worldgenInfo: (world) => string('worldgen_info', [world]),
    worldgenLayer(world, name) {
      const [n, nl] = text(1, name);
      return readDoubles((out, capacity) => fn('worldgen_layer', world, n, nl, out, capacity));
    },
    worldgenReachable: (world) => readDoubles((out, capacity) => fn('worldgen_reachable', world, out, capacity)),
    worldgenOverview(world) {
      const count = fn('worldgen_overview', world, 0, 0);
      const out = zeroed(0, Math.max(1, count));
      fn('worldgen_overview', world, out, count);
      return copy(out, count);
    },
    worldgenPick: (world, run) => fn('worldgen_pick', world, run) !== 0,
    worldgenTerrain: (world, material) => geometry(fn('worldgen_terrain', world, material)),
    worldgenMesh(recipe) {
      const [r, rl] = text(0, recipe);
      return geometry(fn('worldgen_mesh', r, rl));
    },
    worldgenPaint(vertices, recipe) {
      const [v] = data(vertices);
      const [r, rl] = text(1, recipe);
      const ok = fn('worldgen_paint', v!, bytes(vertices).length / 44, r, rl) !== 0;
      if (ok) bytes(vertices).set(u8().subarray(v!, v! + vertices.byteLength));
      return ok;
    },
    worldgenGround: (world, x, z) => fn('worldgen_ground', world, x, z),
    worldgenSurface: (world, x, z) => fn('worldgen_surface', world, x, z),
    worldgenPlatform: (world, x, z) => fn('worldgen_platform', world, x, z),
    worldgenWalkable: (world, x, z, radius) => fn('worldgen_walkable', world, x, z, radius) !== 0,
    worldgenClearance: (world, x, z, radius) => fn('worldgen_clearance', world, x, z, radius),
    worldgenSolidClearance: (world, x, z, radius, bottom, top) => fn('worldgen_solid_clearance', world, x, z, radius, bottom, top),
    worldgenFieldIndex(world, name) {
      const [n, nl] = text(0, name);
      return fn('worldgen_field_index', world, n, nl);
    },
    worldgenField: (world, field, x, z) => fn('worldgen_field', world, field, x, z),
    worldgenTilt(world, x, z, yaw) {
      const out = zeroed(0, 32);
      fn('worldgen_tilt', world, x, z, yaw, out);
      const at = out >> 3;
      const q = f64();
      return [q[at]!, q[at + 1]!, q[at + 2]!, q[at + 3]!];
    },
    worldgenSight: (world, ax, az, bx, bz, radius, step, rise) => fn('worldgen_sight', world, ax, az, bx, bz, radius, step, rise) !== 0,
    worldgenMove(world, x, z, dx, dz, radius, bodies) {
      const list = bytes(bodies);
      const b = put(1, list);
      const p = zeroed(0, 16);
      f64().set([x, z], p >> 3);
      fn('worldgen_move', world, p, dx, dz, radius, b, Math.floor(list.byteLength / 24));
      const q = f64();
      return [q[p >> 3]!, q[(p >> 3) + 1]!];
    }
  };
  return engine;
}
