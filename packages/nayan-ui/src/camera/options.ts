import type { ImagePickerOptions } from '../image-picker/types';
import type { CameraPhotoOptions } from './types';

export function cameraOptions({ allowEditing, ...options }: CameraPhotoOptions): ImagePickerOptions {
  if (options.allowsEditing === undefined && allowEditing !== undefined) options.allowsEditing = allowEditing;
  return options;
}
