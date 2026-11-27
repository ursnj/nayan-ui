import { imagePicker } from '../image-picker/index';
import { cameraOptions } from './options';
import type { CameraPhoto, CameraPhotoOptions } from './types';

export const { isAvailable, release } = imagePicker;

export async function takePhoto(options: CameraPhotoOptions = {}): Promise<CameraPhoto | null> {
  const result = await imagePicker.launchCamera(cameraOptions(options));
  return result.canceled ? null : (result.assets[0] ?? null);
}
