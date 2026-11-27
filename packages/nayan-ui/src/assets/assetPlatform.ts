import { AssetRegistry, Image } from 'react-native';
import NativeEngine from '../native/NativeNayanEngine';
import { describeUri } from './read';
import type { AssetInfo, AssetSource } from './types';

export function resolveAsset(source: AssetSource): AssetInfo | undefined {
  if (typeof source === 'string') return source ? describeUri(source) : undefined;
  const resolved = Image.resolveAssetSource(source);
  if (!resolved?.uri) return;
  const metadata = AssetRegistry?.getAssetByID?.(source);
  const { uri, width, height, scale } = resolved;
  const hash = metadata?.hash;
  const description = describeUri(uri);
  return {
    ...description,
    name: metadata?.name ?? description.name,
    type: metadata?.type ?? description.type,
    hash,
    width,
    height,
    scale,
    // Numeric Metro identifiers are process-local; never persist them as cache identities.
    cacheKey: hash ? JSON.stringify(['bundle', uri, hash, scale]) : uri
  };
}

export function readLocalAsset(uri: string): Promise<ArrayBuffer> | undefined {
  if (/^(?:https?:|data:|blob:)/i.test(uri) || (!uri.includes(':') && !uri.startsWith('/') && /[./]/.test(uri))) return;
  if (typeof NativeEngine?.assetRead !== 'function') {
    // Older hosts can still fetch file URLs; Android resource names need the new native reader.
    if (uri.startsWith('file:')) return;
    return Promise.reject(new Error('Rebuild the app with engine asset loading support'));
  }
  return NativeEngine.assetRead(uri);
}
