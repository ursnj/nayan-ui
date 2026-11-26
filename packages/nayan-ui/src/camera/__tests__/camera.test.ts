import { expect, mock, test } from 'bun:test';
import type { ImagePickerResult } from '../../image-picker/index';

const photo = { uri: 'file:///photo.jpg', width: 640, height: 480, fileName: 'photo.jpg', mimeType: 'image/jpeg', fileSize: 128 };
const launchCamera = mock(async (): Promise<ImagePickerResult> => ({ canceled: false, assets: [photo] }));
const release = mock(async (_uri: string) => {});
const check = mock(async (_permission: string) => ({ status: 'prompt', canAskAgain: true }));
const request = mock(async (_permission: string) => ({ status: 'granted', canAskAgain: false }));
mock.module('../../image-picker/index', () => ({ imagePicker: { launchCamera, release, isAvailable: () => true } }));
mock.module('../../permissions/index', () => ({ permissions: { check, request } }));
const { camera } = await import('../index');

test('camera uses shared permission and photo ownership APIs', async () => {
  expect(camera.isAvailable()).toBe(true);
  expect(await camera.getPermission()).toEqual({ status: 'prompt', canAskAgain: true });
  expect(await camera.requestPermission()).toEqual({ status: 'granted', canAskAgain: false });
  expect(check).toHaveBeenCalledWith('camera');
  expect(request).toHaveBeenCalledWith('camera');
  expect(await camera.takePhoto({ quality: 0.8 })).toEqual(photo);
  expect(launchCamera).toHaveBeenCalledWith({ quality: 0.8 });
  await camera.release(photo.uri);
  expect(release).toHaveBeenCalledWith(photo.uri);
  launchCamera.mockResolvedValueOnce({ canceled: true, assets: null });
  expect(await camera.takePhoto()).toBeNull();
});

test('camera forwards either spelling of the editing option to the image picker', async () => {
  const aspect = [4, 3] as const;
  expect(await camera.takePhoto({ allowEditing: true, aspect })).toEqual(photo);
  expect(launchCamera).toHaveBeenLastCalledWith({ allowsEditing: true, aspect });
  await camera.takePhoto({ allowsEditing: true });
  expect(launchCamera).toHaveBeenLastCalledWith({ allowsEditing: true });
  await camera.takePhoto({ allowEditing: true, allowsEditing: false });
  expect(launchCamera).toHaveBeenLastCalledWith({ allowsEditing: false });
});
