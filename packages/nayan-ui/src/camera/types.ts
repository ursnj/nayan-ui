import type { ImagePickerOptions, PickedImage } from '../image-picker/index';

export interface CameraPhotoOptions extends Omit<ImagePickerOptions, 'multiple' | 'selectionLimit'> {
  /** Open the image picker editor after capture. If both options are set, allowsEditing takes precedence. */
  allowEditing?: boolean;
}
export type CameraPhoto = PickedImage;
