import { appServicesAvailable, requestAppService } from '../native/appServices';
import NativeEngine from '../native/NativeNayanEngine';
import type { CameraPermission, ImagePickerOptions, ImagePickerResult } from './types';
export const imagePicker = {
  isAvailable(): boolean {
    return appServicesAvailable() && (NativeEngine?.hasImagePicker?.() ?? true);
  },
  getCameraPermission(): Promise<CameraPermission> {
    return requestAppService({ action: 'image.permission' });
  },
  requestCameraPermission(): Promise<CameraPermission> {
    return requestAppService({ action: 'image.requestPermission' });
  },
  /** System library picker grants access only to selected items; no broad library permission. */
  pickFromLibrary(options: ImagePickerOptions = {}): Promise<ImagePickerResult> {
    return requestAppService({ action: 'image.library', options });
  },
  launchCamera(options: ImagePickerOptions = {}): Promise<ImagePickerResult> {
    return requestAppService({ action: 'image.camera', options });
  },
  /** Release an engine-owned picked/cropped image after upload. */
  async release(uri: string): Promise<void> {
    await requestAppService({ action: 'image.release', uri });
  }
};
