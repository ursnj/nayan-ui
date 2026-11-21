import NativeEngine from '../native/NativeNayanEngine';
import type { SharingOptions } from './types';

export const sharingPlatform = {
  async isAvailable(): Promise<boolean> {
    return typeof NativeEngine?.sharingRequest === 'function';
  },
  async share(options: SharingOptions): Promise<void> {
    if (typeof NativeEngine?.sharingRequest !== 'function') throw new Error('Engine sharing requires a native app rebuild with sharing support');
    if (options.file) throw new Error('Use a file URI for native sharing');
    await NativeEngine.sharingRequest(JSON.stringify(options));
  }
};
