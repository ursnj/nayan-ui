import NativeEngine from './NativeNayanEngine';
export function appServicesAvailable(): boolean {
  return typeof NativeEngine?.appRequest === 'function';
}
export async function requestAppService<T>(command: Record<string, unknown>): Promise<T> {
  if (!appServicesAvailable()) throw new Error('Engine app services require a native app rebuild');
  return JSON.parse(await NativeEngine!.appRequest!(JSON.stringify(command))) as T;
}
