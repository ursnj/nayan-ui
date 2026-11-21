import type { EngineBridge } from '../native/EngineBridge';
import NativeEngine from '../native/NativeNayanEngine';
import { prepareEngine } from '../native/prepare';
import { forgetAssetBytes } from './AssetBytesCache';
import { type AssetSource, assetUri, loadAssetBytes } from './source';

/** Shared session handles; source-byte persistence stays in AssetBytesCache and Rust. */
export class AssetLoader<T> {
  private readonly loads = new Map<string, Promise<T>>();

  constructor(private readonly name: string) {}

  load(
    source: AssetSource,
    decode: (native: EngineBridge, bytes: ArrayBuffer) => T | Promise<T>,
    variant: readonly (string | number | boolean)[] = []
  ): Promise<T> {
    let uri: string | undefined;
    try {
      uri = assetUri(source);
      if (!uri) throw new Error("couldn't resolve the asset source");
    } catch (cause) {
      return Promise.reject(this.error(String(source), cause));
    }
    // Tuple encoding prevents a URI containing separators from colliding with loader options.
    const key = JSON.stringify([uri, ...variant]);
    const existing = this.loads.get(key);
    if (existing) return existing;
    const pending = Promise.resolve()
      .then(() => prepareEngine())
      .then(async () => {
        if (!NativeEngine) throw new Error('the engine core is not linked into this build');
        const { bytes, cacheKey } = await loadAssetBytes(source);
        try {
          return await decode(NativeEngine, bytes);
        } catch (cause) {
          // Only rejected payloads invalidate saved bytes. Initialization/network failures don't.
          forgetAssetBytes(cacheKey ?? uri);
          throw cause;
        }
      })
      .catch((cause: unknown) => {
        this.loads.delete(key);
        throw this.error(uri!, cause);
      });
    this.loads.set(key, pending);
    return pending;
  }

  private error(source: string, cause: unknown): Error {
    const message = cause instanceof Error ? cause.message : String(cause);
    return new Error(`${this.name}: couldn't load ${source}: ${message}`, {
      cause
    });
  }
}
