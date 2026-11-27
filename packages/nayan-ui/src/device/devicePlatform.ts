import NativeEngine from '../native/NativeNayanEngine';
import type { DeviceEnvironment } from './types';
let environment: DeviceEnvironment | undefined;

/** OS/build environment is fixed for this process. Failed detection remains retryable. */
export function getDeviceEnvironment(): DeviceEnvironment {
  if (environment) return environment;
  if (typeof NativeEngine?.deviceEnvironment !== 'function')
    throw new Error('Engine device utilities require a native app rebuild with device support');
  const value = NativeEngine.deviceEnvironment();
  if (value !== 'physical' && value !== 'emulator' && value !== 'simulator') throw new Error('Engine returned an unsupported device environment');
  environment = value;
  return value;
}
