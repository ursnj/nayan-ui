import * as platform from './assetPlatform.web';
import { createAssets } from './assetService';
import type { AssetSource } from './types';
export type { AssetSource } from './types';
export function assetUri(source: AssetSource): string | undefined {
  return platform.resolveAsset(source)?.uri;
}
export const loadAssetBytes = /* @__PURE__ */ createAssets(platform).load;

export { normalizeImageSource as imageAssetSource } from './imageSource';
