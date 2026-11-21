import { afterEach, beforeEach, expect, mock, spyOn, test } from 'bun:test';
import { installDom } from '../../__tests__/dom';
import * as camera from '../../camera/platform.web';
import { imagePicker } from '../imagePicker.web';
import type { ImagePickerOptions } from '../types';

const globals = ['HTMLInputElement', 'HTMLDialogElement', 'createImageBitmap'] as const;
let dom: ReturnType<typeof installDom>;
let original: (PropertyDescriptor | undefined)[];

beforeEach(() => {
  dom = installDom();
  original = globals.map((name) => Object.getOwnPropertyDescriptor(globalThis, name));
  Object.defineProperties(globalThis, {
    HTMLInputElement: { configurable: true, value: dom.window.HTMLInputElement },
    HTMLDialogElement: { configurable: true, value: dom.window.HTMLDialogElement }
  });
  Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true });
});

afterEach(() => {
  for (const [index, name] of globals.entries()) {
    const descriptor = original[index];
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else Reflect.deleteProperty(globalThis, name);
  }
  dom.cleanup();
});

function choose(...files: File[]) {
  const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
  Object.defineProperty(input, 'files', { configurable: true, value: files });
  input.dispatchEvent(new Event('change'));
}

test('the picker rejects invalid options before opening and releases the input on cancellation', async () => {
  const cases: ImagePickerOptions[] = [
    { quality: -1 },
    { maxDimension: 25 },
    { selectionLimit: 0 },
    { format: 'gif' as ImagePickerOptions['format'] },
    { base64: 'yes' as unknown as boolean },
    { multiple: true, allowsEditing: true },
    { aspect: [2, 0] }
  ];
  for (const options of cases) await expect(imagePicker.pickFromLibrary(options)).rejects.toThrow();
  await expect(imagePicker.launchCamera({ multiple: true })).rejects.toThrow('Camera capture supports one image');
  expect(document.querySelector('input')).toBeNull();

  const selection = imagePicker.launchCamera();
  expect(document.querySelector('input')?.getAttribute('capture')).toBe('environment');
  await expect(imagePicker.pickFromLibrary()).rejects.toThrow('already open');
  document.querySelector('input')!.dispatchEvent(new Event('cancel'));
  expect(await selection).toEqual({ canceled: true, assets: null });
  expect(document.querySelector('input')).toBeNull();
});

test('selected images resize and own their blob URL, and a failed batch rolls back earlier images', async () => {
  const close = mock(() => {});
  const bitmap = { width: 400, height: 200, close };
  const decode = mock(async (_file: File) => bitmap);
  Object.defineProperty(globalThis, 'createImageBitmap', { configurable: true, value: decode });
  const drawImage = mock((..._args: unknown[]) => {});
  Object.defineProperty(dom.window.HTMLCanvasElement.prototype, 'getContext', {
    configurable: true,
    value: () => ({ drawImage })
  });
  Object.defineProperty(dom.window.HTMLCanvasElement.prototype, 'toBlob', {
    configurable: true,
    value: (callback: (blob: Blob) => void, mime: string) => callback(new Blob(['image'], { type: mime }))
  });
  const create = spyOn(URL, 'createObjectURL').mockReturnValueOnce('blob:fixture/first').mockReturnValueOnce('blob:fixture/second');
  const revoke = spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  const file = new File(['bitmap'], 'photo.jpeg', { type: 'image/jpeg' });
  try {
    const selection = imagePicker.pickFromLibrary({ maxDimension: 100, format: 'png' });
    choose(file);
    expect(await selection).toEqual({
      canceled: false,
      assets: [{ uri: 'blob:fixture/first', width: 100, height: 50, fileName: 'photo.png', mimeType: 'image/png', fileSize: 5 }]
    });
    expect(drawImage).toHaveBeenCalledWith(bitmap, 0, 0, 100, 50);
    await imagePicker.release('blob:fixture/first');
    await imagePicker.release('blob:fixture/first');
    await expect(imagePicker.release('https://example.test/foreign')).rejects.toThrow('Only owned image URLs');

    const batch = imagePicker.pickFromLibrary({ multiple: true, selectionLimit: 2 });
    choose(file, new File(['text'], 'notes.txt', { type: 'text/plain' }));
    await expect(batch).rejects.toThrow('Select an image');
    expect(revoke.mock.calls).toEqual([['blob:fixture/first'], ['blob:fixture/second']]);
    expect(close).toHaveBeenCalledTimes(2);
  } finally {
    create.mockRestore();
    revoke.mockRestore();
  }
});

test('canceling camera preview before permission resolves stops the late media stream', async () => {
  const open = Promise.withResolvers<MediaStream>();
  const getUserMedia = mock((_constraints: MediaStreamConstraints) => open.promise);
  const stop = mock(() => {});
  Object.defineProperty(navigator, 'mediaDevices', { configurable: true, value: { getUserMedia } });
  expect(camera.isAvailable()).toBe(true);

  const capture = camera.takePhoto();
  expect(getUserMedia).toHaveBeenCalledWith({ video: { facingMode: { ideal: 'environment' } }, audio: false });
  await expect(camera.takePhoto()).rejects.toThrow('already open');
  document.querySelector<HTMLDialogElement>('dialog')!.dispatchEvent(new Event('cancel', { cancelable: true }));
  expect(await capture).toBeNull();
  expect(document.querySelector('dialog')).toBeNull();
  open.resolve({ getTracks: () => [{ stop }] } as unknown as MediaStream);
  await Promise.resolve();
  expect(stop).toHaveBeenCalledTimes(1);

  getUserMedia.mockRejectedValueOnce(new Error('camera denied'));
  await expect(camera.takePhoto()).rejects.toThrow('camera denied');
  expect(document.querySelector('dialog')).toBeNull();
});
