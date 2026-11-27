import type { AssetInfo } from './types';

/** Bound individual reads independently of the smaller retained-byte cache. */
export const MAX_ASSET_BYTES = 128 * 1024 * 1024;
export function describeUri(uri: string): AssetInfo {
  const filename = uri.split(/[?#]/, 1)[0]!.split('/').pop() ?? '';
  const dot = filename.lastIndexOf('.');
  return { uri, name: dot > 0 ? filename.slice(0, dot) : filename, type: dot > 0 ? filename.slice(dot + 1) : '', cacheKey: uri };
}
export async function fetchAsset(uri: string): Promise<ArrayBuffer> {
  const response = await fetch(uri);
  if (!response.ok && !uri.startsWith('file:')) throw new Error(`HTTP ${response.status} for ${uri}`);
  return readResponseBytes(response, MAX_ASSET_BYTES, 'Asset exceeds the 128 MiB limit');
}

export async function readResponseBytes(response: Response, limit: number, limitError: string): Promise<ArrayBuffer> {
  const length = Number(response.headers?.get('content-length'));
  if (length > limit) {
    await response.body?.cancel();
    throw new Error(limitError);
  }
  const reader = response.body?.getReader();
  if (!reader) {
    const bytes = await response.arrayBuffer();
    if (bytes.byteLength > limit) throw new Error(limitError);
    return bytes;
  }
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > limit) {
        await reader.cancel();
        throw new Error(limitError);
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const chunk = chunks.length === 1 ? chunks[0] : undefined;
  // A whole, fetch-owned buffer can go straight to the decoder. Slices still need a bounded copy.
  if (chunk?.buffer instanceof ArrayBuffer && chunk.byteOffset === 0 && chunk.byteLength === chunk.buffer.byteLength) return chunk.buffer;
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return bytes.buffer;
}
