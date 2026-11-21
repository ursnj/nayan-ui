import { clearAssetBytes } from './AssetBytesCache';
import { advanceCacheGeneration } from './CacheGeneration';
import { clearPersistentStorage } from './storage';

/**
 * Explicitly removes the engine's saved geometry and original model/texture/font/audio files.
 * Also clears temporary download bytes. Existing worlds and loaded handles remain usable;
 * registrations are session resources and will be rebuilt/reloaded on a future app launch.
 * Custom ProceduralStorage adapters belong to their host and are not cleared by this function.
 * Rejects if storage cannot be cleared, allowing a settings screen to report the failure.
 */
export async function clearAssetCache(): Promise<void> {
  advanceCacheGeneration();
  clearAssetBytes();
  await clearPersistentStorage();
}
