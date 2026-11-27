import { Image } from 'react-native';
import { resolveAsset } from './assetPlatform';
import { assets } from './assets';
import { normalizeImageSource } from './imageSource';
import type { AssetSource } from './types';
export type { AssetSource } from './types';
export function assetUri(source: AssetSource): string | undefined {
  return resolveAsset(source)?.uri;
}
export const loadAssetBytes = assets.load;

export function imageAssetSource(source: unknown) {
  return normalizeImageSource(source, (id) => Image.resolveAssetSource(id));
}
