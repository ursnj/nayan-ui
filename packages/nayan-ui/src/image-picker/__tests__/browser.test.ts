import { afterEach, beforeAll, beforeEach, expect, mock, spyOn, test } from 'bun:test';
import { initSync } from '../../../native/core/build/web/engine_core.js';
import { installDom } from '../../__tests__/dom';
import * as camera from '../../camera/platform.web';
import { imagePicker } from '../imagePicker.web';
import type { ImagePickerOptions } from '../types';

const globals = ['HTMLInputElement', 'HTMLDialogElement', 'createImageBitmap'] as const;
let dom: ReturnType<typeof installDom>;
let original: (PropertyDescriptor | undefined)[];

beforeAll(async () => {
  const module = await Bun.file(new URL('../../../native/core/build/web/engine_core_bg.wasm', import.meta.url)).arrayBuffer();
  initSync({ module });
});

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

test('the editor saves the preview transform and color adjustments and can reset or cancel', async () => {
  const close = mock(() => {});
  Object.defineProperty(globalThis, 'createImageBitmap', {
    configurable: true,
    value: async () => ({ width: 400, height: 200, close })
  });
  const contexts = new Map<HTMLCanvasElement, ReturnType<typeof makeContext>>();
  function makeContext(canvas: HTMLCanvasElement) {
    return {
      canvas,
      save() {},
      restore() {},
      translate() {},
      clearRect() {},
      scale: mock((_x: number, _y: number) => {}),
      rotate: mock((_radians: number) => {}),
      drawImage() {},
      getImageData: () => ({ data: new Uint8ClampedArray([180, 60, 20, 128]) }),
      putImageData: mock((_pixels: { data: Uint8ClampedArray }) => {})
    };
  }
  Object.defineProperty(dom.window.HTMLCanvasElement.prototype, 'getContext', {
    configurable: true,
    value(this: HTMLCanvasElement) {
      let context = contexts.get(this);
      if (!context) {
        context = makeContext(this);
        contexts.set(this, context);
      }
      return context;
    }
  });
  Object.defineProperty(dom.window.HTMLCanvasElement.prototype, 'toBlob', {
    configurable: true,
    value: (callback: (blob: Blob) => void, mime: string) => callback(new Blob(['image'], { type: mime }))
  });
  const file = new File(['bitmap'], 'photo.png', { type: 'image/png' });
  const openEditor = async () => {
    const result = imagePicker.pickFromLibrary({ allowsEditing: true, format: 'png', aspect: [2, 1] });
    choose(file);
    await dom.window.happyDOM.waitUntilComplete();
    return { result, dialog: document.querySelector<HTMLDialogElement>('dialog')! };
  };
  const press = (dialog: HTMLDialogElement, label: string) => {
    [...dialog.querySelectorAll('button')].find((button) => button.textContent === label)!.click();
  };
  const { result, dialog } = await openEditor();
  const select = dialog.querySelector('select')!;
  const brightness = dialog.querySelector<HTMLInputElement>('label input[type="range"]')!;
  const preview = contexts.get(dialog.querySelector('canvas')!)!;
  press(dialog, 'Rotate right');
  press(dialog, 'Flip horizontally');
  select.selectedIndex = 2;
  select.dispatchEvent(new Event('change'));
  brightness.value = '1.25';
  brightness.dispatchEvent(new Event('input'));
  expect(preview.putImageData.mock.lastCall?.[0].data).toEqual(new Uint8ClampedArray([151, 134, 105, 128]));
  press(dialog, 'Reset');
  expect(select.selectedIndex).toBe(0);
  expect(brightness.value).toBe('1');
  expect(preview.rotate.mock.lastCall).toEqual([0]);
  press(dialog, 'Rotate right');
  press(dialog, 'Flip horizontally');
  select.selectedIndex = 2;
  select.dispatchEvent(new Event('change'));
  brightness.value = '1.25';
  brightness.dispatchEvent(new Event('input'));
  press(dialog, 'Use image');
  const saved = await result;
  expect(saved.canceled).toBe(false);
  if (saved.canceled) throw Error('Expected an edited image');
  const [asset] = saved.assets;
  expect(asset).toMatchObject({ width: 200, height: 100, mimeType: 'image/png' });
  const output = [...contexts.values()].at(-1)!;
  expect(output.rotate).toHaveBeenCalledWith(Math.PI / 2);
  expect(output.scale).toHaveBeenCalledWith(-1, 1);
  expect(output.putImageData.mock.lastCall?.[0].data).toEqual(new Uint8ClampedArray([151, 134, 105, 128]));
  await imagePicker.release(asset!.uri);

  const second = await openEditor();
  press(second.dialog, 'Cancel');
  expect(await second.result).toEqual({ canceled: true, assets: null });
  expect(close).toHaveBeenCalledTimes(2);
  expect(document.querySelector('dialog')).toBeNull();
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
