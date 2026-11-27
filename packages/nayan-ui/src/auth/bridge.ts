import NativeEngine from '../native/NativeNayanEngine';

export async function requestAuth(command: string): Promise<string> {
  if (typeof NativeEngine?.authRequest !== 'function') throw new Error('Sign-in requires a native app rebuild with the latest engine');
  return NativeEngine.authRequest(command);
}
