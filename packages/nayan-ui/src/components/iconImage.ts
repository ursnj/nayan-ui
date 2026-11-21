import NativeEngine from '../native/NativeNayanEngine';
import { prepareEngine } from '../native/prepare';

export interface IconOutline {
  paths: string | readonly string[];
  viewBox?: number | readonly [number, number, number, number];
}

export async function requestIcon<T>(bytes: ArrayBufferLike, command: object): Promise<T> {
  await prepareEngine();
  if (typeof NativeEngine?.iconRequest !== 'function') throw new Error('Rebuild the engine and app with vector icon support');
  const result = JSON.parse(await NativeEngine.iconRequest(bytes, JSON.stringify(command))) as { ok: boolean; value: T; error?: string };
  if (!result.ok) throw new Error(result.error || 'Icon request failed');
  return result.value;
}

let images: Map<string, Promise<string>> | undefined;
/** Black PNG coverage; native Image tintColor supplies color without regenerating pixels. */
export function iconImage(outline: IconOutline, pixels: number, strokeWidth?: number, fillRule?: string): Promise<string> {
  const imagesCache = (images ??= new Map<string, Promise<string>>());
  const command = { action: 'image', ...outline, pixels, strokeWidth, fillRule };
  const key = JSON.stringify(command);
  const hit = imagesCache.get(key);
  if (hit) {
    imagesCache.delete(key);
    imagesCache.set(key, hit);
    return hit;
  }
  const request = requestIcon<string>(new ArrayBuffer(0), command).catch((error) => {
    if (imagesCache.get(key) === request) imagesCache.delete(key);
    throw error;
  });
  imagesCache.set(key, request);
  while (imagesCache.size > 256) imagesCache.delete(imagesCache.keys().next().value!);
  return request;
}
