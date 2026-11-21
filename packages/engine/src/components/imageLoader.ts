import { assetBytes, forgetAssetBytes } from '../assets/AssetBytesCache';
import { readResponseBytes } from '../assets/read';
import { loadAssetBytes } from '../assets/source';
import { readPersistentAsset } from '../assets/storage';
import NativeEngine from '../native/NativeNayanEngine';

const waiting: (() => void)[] = [];
let active = 0;

/** Bound network/decode jobs across UI roots, including jobs no longer present in a virtualized row. */
export async function loadUIImage(
  source: Record<string, unknown>,
  policy: string,
  disposed: () => boolean,
  decode?: { width: number; height: number; fit: number }
): Promise<number | null> {
  if (active < 4) active++;
  else await new Promise<void>((resolve) => waiting.push(resolve));
  try {
    if (disposed()) return null;
    return await load(source, policy, disposed, decode);
  } finally {
    const next = waiting.shift();
    if (next) next();
    else active--;
  }
}

const MAX_IMAGE_BYTES = 32 * 1024 * 1024;
const IMAGE_SIZE_ERROR = 'Image file exceeds 32 MiB';

/** Thin platform I/O. Rust requests sources and consumes the temporary decoded handles. */
async function load(
  source: Record<string, unknown>,
  policy: string,
  disposed: () => boolean,
  decode?: { width: number; height: number; fit: number }
): Promise<number | null> {
  const uri = String(source.uri ?? '');
  const headers = source.headers as Record<string, string> | undefined;
  const key = `component-image:${JSON.stringify([uri, Object.fromEntries(Object.entries(headers ?? {}).sort(([a], [b]) => a.localeCompare(b)))])}`;
  const fetchBytes = async () => {
    if (source.cache === 'only-if-cached') {
      const saved = policy === 'disk' || policy === 'memory-disk' ? await readPersistentAsset(key) : null;
      if (!saved) throw new Error('No cached image is available');
      return saved;
    }
    const response = await fetch(uri, {
      headers,
      cache: policy === 'none' ? 'no-store' : source.cache === 'reload' ? 'reload' : source.cache === 'force-cache' ? 'force-cache' : 'default'
    });
    if (!response.ok && !uri.startsWith('file:')) throw new Error(`Image request failed (HTTP ${response.status})`);
    return readResponseBytes(response, MAX_IMAGE_BYTES, IMAGE_SIZE_ERROR);
  };
  const bundled = typeof source.assetModule === 'number' ? await loadAssetBytes(source.assetModule) : undefined;
  const bytes = bundled
    ? bundled.bytes
    : policy === 'disk' || policy === 'memory-disk'
      ? await assetBytes(key, fetchBytes, { reload: source.cache === 'reload' })
      : policy === 'memory'
        ? await assetBytes(key, fetchBytes, { disk: false, reload: source.cache === 'reload' })
        : await fetchBytes();
  if (bytes.byteLength > MAX_IMAGE_BYTES) throw new Error(IMAGE_SIZE_ERROR);
  if (disposed()) return null;
  let texture: number;
  try {
    texture =
      decode && typeof NativeEngine!.textureLoadSizedAsync === 'function'
        ? await NativeEngine!.textureLoadSizedAsync(bytes, decode.width, decode.height, decode.fit)
        : typeof NativeEngine!.textureLoadAsync === 'function'
          ? await NativeEngine!.textureLoadAsync(bytes)
          : NativeEngine!.textureLoad(bytes);
    if (texture < 0) throw new Error('Image is corrupt or uses an unsupported format');
  } catch (error) {
    await forgetAssetBytes(bundled?.cacheKey ?? key);
    throw error;
  }
  return texture;
}
