import { act } from 'react';
import { afterAll, expect, mock, test } from 'bun:test';
import type { CameraPermission, ImagePickerResult } from '../image-picker/types';
import { review as webReview } from '../review/review.web';
import { installReactTestEnvironment } from './dom';

const request = mock(async (_command: string) => 'null');
const hasImagePicker = mock(() => false);
const bridge: { appRequest?: typeof request; hasImagePicker?: typeof hasImagePicker } = { appRequest: request, hasImagePicker };
mock.module('../native/NativeNayanEngine', () => ({ default: bridge }));
const { imagePicker } = await import('../image-picker');
const { review } = await import('../review');
const { useKeepAwake } = await import('../keep-awake');
const compat = await import('../keep-awake/compat');
const dom = await installReactTestEnvironment();
afterAll(() => dom.cleanup());

test('image picker honors native availability and forwards permissions, selection, cancellation and cleanup', async () => {
  request.mockClear();
  expect(imagePicker.isAvailable()).toBe(false);
  hasImagePicker.mockReturnValueOnce(true);
  expect(imagePicker.isAvailable()).toBe(true);
  bridge.hasImagePicker = undefined;
  expect(imagePicker.isAvailable()).toBe(true);
  bridge.hasImagePicker = hasImagePicker;
  const permission: CameraPermission = { status: 'granted', canAskAgain: true };
  const picked: ImagePickerResult = {
    canceled: false,
    assets: [{ uri: 'file:///cache/picked.jpg', width: 320, height: 240, fileName: 'picked.jpg', mimeType: 'image/jpeg', fileSize: 1024 }]
  };
  request
    .mockResolvedValueOnce(JSON.stringify(permission))
    .mockResolvedValueOnce(JSON.stringify(permission))
    .mockResolvedValueOnce(JSON.stringify(picked))
    .mockResolvedValueOnce('{"canceled":true,"assets":null}');
  expect(await imagePicker.getCameraPermission()).toEqual(permission);
  expect(await imagePicker.requestCameraPermission()).toEqual(permission);
  expect(await imagePicker.pickFromLibrary({ maxDimension: 320 })).toEqual(picked);
  expect(await imagePicker.launchCamera()).toEqual({ canceled: true, assets: null });
  await imagePicker.release(picked.assets[0]!.uri);
  expect(request.mock.calls.map(([value]) => JSON.parse(value))).toEqual([
    { action: 'image.permission' },
    { action: 'image.requestPermission' },
    { action: 'image.library', options: { maxDimension: 320 } },
    { action: 'image.camera', options: {} },
    { action: 'image.release', uri: 'file:///cache/picked.jpg' }
  ]);
});

test('store review distinguishes missing native support, platform denial and a completed request', async () => {
  request.mockClear();
  bridge.appRequest = undefined;
  try {
    expect(await review.isAvailable()).toBe(false);
    await expect(review.requestReview()).rejects.toThrow('native app rebuild');
    expect(request).not.toHaveBeenCalled();
  } finally {
    bridge.appRequest = request;
  }
  request.mockResolvedValueOnce('true').mockRejectedValueOnce(new Error('store unavailable'));
  expect(await review.isAvailable()).toBe(true);
  await expect(review.requestReview()).rejects.toThrow('store unavailable');
  await review.requestReview();
  expect(request.mock.calls.map(([value]) => JSON.parse(value).action)).toEqual(['review.available', 'review.request', 'review.request']);
  expect(await webReview.isAvailable()).toBe(false);
  await expect(webReview.requestReview()).rejects.toThrow('unavailable in browsers');
});

test('a retained screen releases only its own keep-awake tag when focus changes', async () => {
  request.mockClear();
  const root = dom.createRoot(document.createElement('div'));
  function Screen({ active }: { active: boolean }) {
    useKeepAwake(active);
    return null;
  }
  try {
    await act(() => root.render(<Screen active />));
    await act(() => root.render(<Screen active={false} />));
    const calls = request.mock.calls.map(([value]) => JSON.parse(value));
    expect(calls).toEqual([
      { action: 'awake.activate', tag: expect.stringMatching(/^react:/) },
      { action: 'awake.deactivate', tag: calls[0]!.tag }
    ]);
    await compat.activateKeepAwakeAsync();
    await compat.deactivateKeepAwake();
    expect(await compat.isAvailableAsync()).toBe(true);
    expect(request.mock.calls.slice(2).map(([value]) => JSON.parse(value))).toEqual([
      { action: 'awake.activate', tag: compat.ExpoKeepAwakeTag },
      { action: 'awake.deactivate', tag: compat.ExpoKeepAwakeTag }
    ]);
  } finally {
    await act(() => root.unmount());
  }
});
