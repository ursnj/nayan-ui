import NativeEngine from '../native/NativeNayanEngine';

export const speechPlatform = {
  get supported(): boolean {
    return typeof NativeEngine?.speechRequest === 'function';
  },
  request(command: string): Promise<string> {
    return NativeEngine!.speechRequest!(command);
  }
};
