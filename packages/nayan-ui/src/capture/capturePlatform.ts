import NativeEngine from '../native/NativeNayanEngine';
import type { CapturedImage } from './types';

function native() {
  if (typeof NativeEngine?.captureRequest !== 'function') throw new Error('Engine capture requires a native app rebuild with capture support');
  return NativeEngine;
}
export const capture = {
  async isAvailable(): Promise<boolean> {
    return typeof NativeEngine?.captureRequest === 'function';
  },
  async screen(): Promise<CapturedImage> {
    const result = JSON.parse(await native().captureRequest('screen', '')) as CapturedImage;
    if (
      !result ||
      typeof result.uri !== 'string' ||
      !result.uri.startsWith('file:') ||
      ![result.width, result.height, result.scale].every((n) => Number.isFinite(n) && n > 0)
    )
      throw new Error('Invalid native capture result');
    return result;
  },
  async release(uri: string): Promise<void> {
    if (typeof uri !== 'string' || !uri || uri.includes('\0')) throw new TypeError('A capture URI is required');
    await native().captureRequest('release', uri);
  }
};
