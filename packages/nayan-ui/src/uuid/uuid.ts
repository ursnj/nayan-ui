import NativeEngine from '../native/NativeNayanEngine';
import { prepareEngine } from '../native/prepare';

/** Check that the native UUID bridge is available. */
export async function prepareUuid(): Promise<void> {
  await prepareEngine();
  if (typeof NativeEngine?.uuid !== 'function') throw new Error('Engine: uuid requires a native app rebuild with the latest engine');
}

/**
 * A lowercase, hyphenated UUID v4 generated in Rust with secure randomness.
 * Requires a native app build with the UUID bridge.
 */
export function uuid(): string {
  if (typeof NativeEngine?.uuid !== 'function') throw new Error('Engine: uuid requires a native app rebuild with the latest engine');
  return NativeEngine.uuid();
}
