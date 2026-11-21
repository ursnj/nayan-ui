/** A Metro require(...) identifier on native, or a URL on any platform. */
export type AssetSource = number | string;

export interface AssetInfo {
  uri: string;
  name: string;
  type: string;
  hash?: string;
  width?: number;
  height?: number;
  scale?: number;
  /** Includes the bundled content hash and density, so app upgrades cannot reuse stale bytes. */
  cacheKey: string;
}
export interface LoadedAsset extends AssetInfo {
  bytes: ArrayBuffer;
}
export interface AssetLoadOptions {
  /** Ignore retained/persisted bytes and load the source again. */
  reload?: boolean;
}

/** Optional storage override. The engine selects a best-effort platform cache by default. */
export interface ProceduralStorage {
  read(key: string): Uint8Array | null;
  write(key: string, bytes: Uint8Array): void | Promise<void>;
  /**
   * The store itself verifies every record's integrity (the engine's own Rust store checksums each
   * one with SHA-256), so the cache needn't checksum and scan them again in JS. Geometry is still
   * validated by the core when it's registered.
   */
  readonly verified?: boolean;
}
