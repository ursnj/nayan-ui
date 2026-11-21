import { permissions } from '../permissions/index';
import { isAvailable, release, takePhoto } from './platform';

export type { CameraPhoto, CameraPhotoOptions } from './types';

export const camera = {
  /** Whether the platform provides a photo capture flow. */
  isAvailable,
  getPermission: () => permissions.check('camera'),
  requestPermission: () => permissions.request('camera'),

  /** Open the photo capture flow. Returns null when the user cancels. */
  takePhoto,
  release
};
