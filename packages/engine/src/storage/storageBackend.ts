import { AppState } from 'react-native';
import NativeEngine from '../native/NativeNayanEngine';
import type { StorageBackend } from './types';

function request<T>(command: Record<string, unknown>): T {
  if (!NativeEngine?.storageRequest) throw new Error('Engine storage: rebuild the native app with storage support');
  const result = JSON.parse(NativeEngine.storageRequest(JSON.stringify(command))) as { value: T; error?: string };
  if (result.error) throw new Error(`Engine storage: ${result.error}`);
  return result.value;
}
let listening = false;
function listenForBackground() {
  if (listening || !AppState?.addEventListener) return;
  listening = true;
  AppState.addEventListener('change', (state) => {
    if (state === 'active') return;
    try {
      request<void>({ op: 'flush' });
    } catch (error) {
      console.warn('Engine storage: background flush failed', error);
    }
  });
}
export function openBackend(id: string): StorageBackend {
  const handle = request<number>({ op: 'open', id });
  listenForBackground();
  return {
    read: (key) => NativeEngine!.storageRead(handle, key).value,
    write: (key, value) => NativeEngine!.storageWrite(handle, key, { value }),
    command: (op, options) => request({ op, handle, ...options })
  };
}
