import { proceduralStorage } from '../../assets/storage';
import type { ProceduralStorage } from '../../assets/types';
import NativeEngine from '../../native/NativeNayanEngine';
import { meshInfo } from '../render/meshes';
import { type Model, registerModelMesh } from './model';
export type { ProceduralStorage } from '../../assets/types';
type Value = null | boolean | number | string | Value[] | { [key: string]: Value };
interface MeshRecord {
  floats: number;
  indices: number;
  shine: number;
}
interface RecordHeader {
  revision: string;
  key: string;
  value: Value;
  meshes: MeshRecord[];
}
const MAGIC = 0x3143504e; // NPC1: static vertices (11 floats) and u32 indices, little endian.
const LIMIT = 32 * 1024 * 1024;
// JSON is escaped to ASCII so Hermes hosts need no TextEncoder/TextDecoder polyfill.
function encodeJson(value: unknown): Uint8Array {
  const text = JSON.stringify(value).replace(/[\u007f-\uffff]/g, (char) => '\\u' + char.charCodeAt(0).toString(16).padStart(4, '0'));
  const bytes = new Uint8Array(text.length);
  for (let i = 0; i < text.length; i++) bytes[i] = text.charCodeAt(i);
  return bytes;
}
function decodeJson(bytes: Uint8Array): unknown {
  let text = '';
  for (let i = 0; i < bytes.length; i += 4096) text += String.fromCharCode(...bytes.subarray(i, i + 4096));
  return JSON.parse(text);
}

function checksum(bytes: Uint8Array): number {
  let hash = 2166136261;
  for (let i = 0; i < bytes.length; i++) hash = Math.imul(hash ^ bytes[i]!, 16777619);
  return hash >>> 0;
}

/**
 * Persists the output of a deterministic model factory, including nested model arrays/objects.
 * Hits register saved vertices directly: no procedural tessellation, painting or optimization.
 * Imported/skinned/textured models are intentionally excluded; their own loaders retain their rigs.
 */
export class ProceduralCache {
  private memory = new Map<string, unknown>();
  private hits = 0;
  private builds = 0;
  private invalid = 0;
  private failures = 0;
  private writes = new Set<Promise<void>>();

  constructor(
    readonly revision: string,
    private storage: ProceduralStorage | undefined = proceduralStorage(revision)
  ) {}

  /** The engine storage key of `key` in this revision (for records the native core reads and writes itself). */
  storageKey(key: string): string {
    return `procedural:${this.revision}:${key}`;
  }

  get stats() {
    return {
      hits: this.hits,
      builds: this.builds,
      invalid: this.invalid,
      failures: this.failures,
      pendingWrites: this.writes.size
    };
  }
  async flush(): Promise<void> {
    await Promise.all([...this.writes]);
  }

  /**
   * A value already cached (in memory, or saved by an earlier launch), without building anything:
   * undefined when there is none yet. Lets work that's spread over many frames (a level generated
   * step by step) skip itself entirely when a saved result exists, then save with `get`.
   */
  peek<T>(key: string): T | undefined {
    if (this.memory.has(key)) return this.memory.get(key) as T;
    if (!this.storage) return undefined;
    try {
      const bytes = this.storage.read(key);
      if (!bytes) return undefined;
      const value = this.restore(bytes, key) as T;
      this.memory.set(key, value);
      this.hits++;
      return value;
    } catch {
      this.invalid++;
      return undefined;
    }
  }

  get<T>(key: string, build: () => T): T {
    if (this.memory.has(key)) return this.memory.get(key) as T;
    if (this.storage) {
      try {
        const bytes = this.storage.read(key);
        if (bytes) {
          try {
            const value = this.restore(bytes, key) as T;
            this.memory.set(key, value);
            this.hits++;
            return value;
          } catch {
            this.invalid++;
          }
        }
      } catch {
        this.failures++;
      }
    }
    const value = build();
    this.builds++;
    this.memory.set(key, value);
    if (this.storage) {
      try {
        const result = this.storage.write(key, this.encode(value, key));
        if (result) {
          const pending = Promise.resolve(result)
            .catch(() => {
              this.failures++;
            })
            .finally(() => {
              this.writes.delete(pending);
            });
          this.writes.add(pending);
        }
      } catch {
        this.failures++;
      } // Storage/unsupported values never prevent a game from running.
    }
    return value;
  }

  private encode(value: unknown, key: string): Uint8Array {
    const models: Model[] = [];
    const ids = new Map<number, number>();
    const visit = (v: unknown): Value => {
      if (v === undefined) return { $undefined: true };
      if (v === null || typeof v === 'string' || typeof v === 'boolean') return v;
      if (typeof v === 'number' && Number.isFinite(v)) return v;
      if (Array.isArray(v)) return v.map(visit);
      if (typeof v !== 'object' || !v || Object.getPrototypeOf(v) !== Object.prototype) throw Error('not a plain procedural asset');
      const obj = v as Record<string, unknown>;
      if (Number.isSafeInteger(obj.id) && Array.isArray(obj.size) && obj.size.length === 3) {
        const model = v as Model;
        const info = meshInfo(model.id);
        if (!info || info.texture !== undefined || 'jointCount' in obj || 'animations' in obj) throw Error('not a static procedural model');
        let index = ids.get(model.id);
        if (index === undefined) {
          index = models.length;
          ids.set(model.id, index);
          models.push(model);
        }
        return { $mesh: index };
      }
      if (Number.isSafeInteger(obj.id)) throw Error('native handles cannot be persisted as plain data');
      const result: Record<string, Value> = {};
      for (const name of Object.keys(obj)) {
        if (name.startsWith('$')) throw Error('reserved cache key');
        if (Object.getOwnPropertyDescriptor(obj, name)?.get) throw Error('lazy values must be cached separately');
        result[name] = visit(obj[name]);
      }
      return result;
    };
    const root = visit(value);
    const infos = models.map((model) => meshInfo(model.id)!);
    const header: RecordHeader = {
      revision: this.revision,
      key,
      value: root,
      meshes: infos.map((info) => ({
        floats: info.geometry.vertices.length,
        indices: info.geometry.indices.length,
        shine: info.shine ?? 0
      }))
    };
    const json = encodeJson(header);
    const start = (16 + json.length + 3) & ~3;
    const length = start + infos.reduce((sum, info) => sum + info.geometry.vertices.byteLength + info.geometry.indices.byteLength, 0);
    if (length > LIMIT) throw Error('procedural asset too large');
    const bytes = new Uint8Array(length),
      view = new DataView(bytes.buffer);
    view.setUint32(0, MAGIC, true);
    view.setUint32(4, json.length, true);
    view.setUint32(8, length, true);
    bytes.set(json, 16);
    let offset = start;
    for (const { geometry } of infos)
      for (const data of [geometry.vertices, geometry.indices]) {
        bytes.set(new Uint8Array(data.buffer, data.byteOffset, data.byteLength), offset);
        offset += data.byteLength;
      }
    // A verifying store checksums the record itself: hashing every byte again in JS cost more than
    // building small models.
    view.setUint32(12, this.storage?.verified ? 0 : checksum(bytes.subarray(16)), true);
    return bytes;
  }

  private restore(raw: Uint8Array, key: string): unknown {
    if (raw.length < 16 || raw.length > LIMIT) throw Error('cache size');
    const bytes = raw.byteOffset % 4 ? raw.slice() : raw;
    const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    const jsonLength = view.getUint32(4, true);
    if (
      view.getUint32(0, true) !== MAGIC ||
      view.getUint32(8, true) !== bytes.length ||
      jsonLength > bytes.length - 16 ||
      (!this.storage?.verified && view.getUint32(12, true) !== checksum(bytes.subarray(16)))
    )
      throw Error('cache integrity');
    const header = decodeJson(bytes.subarray(16, 16 + jsonLength)) as RecordHeader;
    if (!('value' in header) || header.revision !== this.revision || header.key !== key || !Array.isArray(header.meshes))
      throw Error('cache revision');
    let offset = (16 + jsonLength + 3) & ~3;
    const payloads: {
      vertices: Float32Array;
      indices: Uint32Array;
      shine: number;
    }[] = [];
    // Validate the complete record before registering any mesh (including the value's references).
    for (const mesh of header.meshes) {
      if (
        !Number.isSafeInteger(mesh.floats) ||
        mesh.floats <= 0 ||
        mesh.floats % 11 ||
        !Number.isSafeInteger(mesh.indices) ||
        mesh.indices <= 0 ||
        mesh.indices % 3 ||
        !Number.isFinite(mesh.shine) ||
        mesh.shine < 0 ||
        mesh.shine > 1
      )
        throw Error('cache geometry');
      const end = offset + (mesh.floats + mesh.indices) * 4;
      if (end > bytes.length) throw Error('cache truncated');
      const vertices = new Float32Array(bytes.buffer, bytes.byteOffset + offset, mesh.floats);
      const indices = new Uint32Array(bytes.buffer, bytes.byteOffset + offset + mesh.floats * 4, mesh.indices);
      // A verified record is the one this cache wrote, and the core rejects bad geometry anyway:
      // scanning millions of floats in JS was most of a relaunch's loading time.
      if (!this.storage?.verified) {
        for (const value of vertices) if (!Number.isFinite(value)) throw Error('cache vertex');
        for (const index of indices) if (index >= mesh.floats / 11) throw Error('cache index');
      }
      payloads.push({ vertices, indices, shine: mesh.shine });
      offset = end;
    }
    if (offset !== bytes.length) throw Error('cache length');
    const mapValue = (v: Value, models?: Model[]): unknown => {
      if (v === null || typeof v !== 'object') return v;
      if (Array.isArray(v)) return v.map((item) => mapValue(item, models));
      if ('$mesh' in v) {
        const index = v.$mesh;
        if (!Number.isSafeInteger(index) || typeof index !== 'number' || index < 0 || index >= header.meshes.length || Object.keys(v).length !== 1)
          throw Error('cache model reference');
        return models?.[index];
      }
      if ('$undefined' in v) return undefined;
      const result: Record<string, unknown> = {};
      for (const name of Object.keys(v)) {
        if (name.startsWith('$') || name === '__proto__') throw Error('cache value');
        result[name] = mapValue(v[name]!, models);
      }
      return result;
    };
    mapValue(header.value);
    if (!NativeEngine) throw Error('native engine unavailable');
    const restored = payloads.map((mesh) => {
      let id = NativeEngine!.meshCreate(mesh.vertices.slice().buffer, mesh.indices.slice().buffer);
      if (id < 0) throw Error('cache registration');
      id = registerModelMesh(id, mesh.shine);
      const [x, y, z] = NativeEngine!.modelSize(id);
      return { id, size: [x!, y!, z!] } as Model;
    });
    return mapValue(header.value, restored);
  }
}
