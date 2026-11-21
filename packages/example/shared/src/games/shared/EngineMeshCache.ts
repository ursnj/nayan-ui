// Keep only recipe identity here. The engine owns durable storage, validation and recovery.
// Completed records have no expiry/eviction; this cache skips entire expensive JS factories.
import { ProceduralCache } from '@nayan-ui/engine';
import * as versions from './ProceduralCacheVersion';

const { PROCEDURAL_CACHE_VERSION } = versions;
// A Metro started before per-game revisions regenerates the older file without them: everything then
// follows the single revision, as before, until Metro restarts.
const PROCEDURAL_CACHE_VERSIONS: Readonly<Record<string, string>> =
  (versions as { PROCEDURAL_CACHE_VERSIONS?: Readonly<Record<string, string>> }).PROCEDURAL_CACHE_VERSIONS ?? {};

const caches = new Map<string, ProceduralCache>();

/**
 * The cache for a key's namespace: "<folder>/..." keys follow their game folder's revision (or the
 * shared folder's), so an app update that changes one game rebuilds only that game's models; other
 * keys follow every source.
 */
function cacheFor(key: string): ProceduralCache {
  const slash = key.indexOf('/');
  const colon = key.indexOf(':');
  const folder = slash > 0 && (colon < 0 || slash < colon) ? key.slice(0, slash) : '';
  const revision = PROCEDURAL_CACHE_VERSIONS[folder] ?? PROCEDURAL_CACHE_VERSION;
  let cache = caches.get(revision);
  if (!cache) caches.set(revision, (cache = new ProceduralCache(revision)));
  return cache;
}

/** Product recipe revisioning is separate from the engine's geometry/storage format. */
export function cacheGameAsset<T>(key: string, build: () => T): T {
  return cacheFor(key).get(key, build);
}

/** The engine storage key for a record the native core saves itself under this game's cache revision. */
export function gameStorageKey(key: string): string {
  return cacheFor(key).storageKey(key);
}

/** A saved asset from this or an earlier launch, or undefined: nothing is built. */
export function peekGameAsset<T>(key: string): T | undefined {
  return cacheFor(key).peek<T>(key);
}

export const flushProceduralCache = async () => {
  await Promise.all([...caches.values()].map((cache) => cache.flush()));
};
