import type { DeviceEnvironment } from './types';
/** No user-agent sniffing: a browser cannot reliably identify an emulator or simulator. */
export function getDeviceEnvironment(): DeviceEnvironment {
  return 'browser';
}
