import { getDeviceEnvironment } from './devicePlatform';

/** Synchronous platform utilities. No permissions, engine warm-up or render surface needed. */
export const device = {
  getEnvironment: getDeviceEnvironment,
  isPhysicalDevice(): boolean {
    return getDeviceEnvironment() === 'physical';
  },
  /** Android emulators and Apple simulators; browsers return false. */
  isVirtualDevice(): boolean {
    const environment = getDeviceEnvironment();
    return environment === 'emulator' || environment === 'simulator';
  }
};
