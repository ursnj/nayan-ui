import { imagePicker } from '../image-picker/index';
import type { CameraPhoto, CameraPhotoOptions } from './types';

export const { isAvailable, release } = imagePicker;

export async function takePhoto(options: CameraPhotoOptions = {}): Promise<CameraPhoto | null> {
  const result = await imagePicker.launchCamera(options);
  return result.canceled ? null : (result.assets[0] ?? null);
}
