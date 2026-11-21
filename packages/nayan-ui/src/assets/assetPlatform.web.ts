import { describeUri } from './read';
import type { AssetInfo, AssetSource } from './types';
export function resolveAsset(source: AssetSource): AssetInfo | undefined {
  return typeof source === 'string' && source ? describeUri(source) : undefined;
}
export function readLocalAsset(_uri: string): Promise<ArrayBuffer> | undefined {
  return undefined;
}
