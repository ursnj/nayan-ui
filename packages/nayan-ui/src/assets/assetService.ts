import { assetBytes, forgetAssetBytes } from './AssetBytesCache';
import { fetchAsset } from './read';
import type { AssetInfo, AssetLoadOptions, AssetSource, LoadedAsset } from './types';

export function createAssets(platform: {
  resolveAsset(source: AssetSource): AssetInfo | undefined;
  readLocalAsset(uri: string): Promise<ArrayBuffer> | undefined;
}) {
  function resolve(source: AssetSource): AssetInfo {
    const info = platform.resolveAsset(source);
    if (!info) throw new Error("Engine: couldn't resolve the asset; use a URL on browsers and check Metro's assetExts for native require(...) files");
    return info;
  }
  async function load(source: AssetSource, options?: AssetLoadOptions): Promise<LoadedAsset> {
    const info = resolve(source);
    const bytes = await assetBytes(info.cacheKey, () => platform.readLocalAsset(info.uri) ?? fetchAsset(info.uri), options);
    return { ...info, bytes };
  }

  /** Shared, bounded source-byte cache used by engine images, models, fonts and audio. */
  return {
    resolve,
    load,
    async read(source: AssetSource, options?: AssetLoadOptions): Promise<ArrayBuffer> {
      return (await load(source, options)).bytes;
    },
    /** Warm several sources with at most four reads in flight. Failed loads can be retried. */
    async prefetch(sources: readonly AssetSource[]): Promise<void> {
      let next = 0;
      await Promise.all(
        Array.from({ length: Math.min(4, sources.length) }, async () => {
          while (next < sources.length) await load(sources[next++]!);
        })
      );
    },
    async evict(source: AssetSource): Promise<void> {
      await forgetAssetBytes(resolve(source).cacheKey);
    }
  };
}
