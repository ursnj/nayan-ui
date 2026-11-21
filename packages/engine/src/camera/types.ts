import type { ImagePickerOptions, PickedImage } from '../image-picker/index';

export type CameraPhotoOptions = Omit<ImagePickerOptions, 'multiple' | 'selectionLimit'>;
export type CameraPhoto = PickedImage;
