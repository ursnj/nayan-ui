import { afterAll, beforeEach, expect, mock, spyOn, test } from 'bun:test';
import { capture } from '../capturePlatform.web';

const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
const originalDocument = Object.getOwnPropertyDescriptor(globalThis, 'document');
const stop = mock(() => {});
const media = mock(async () => ({ getTracks: () => [{ stop }] }) as unknown as MediaStream);
const pause = mock(() => {});
const draw = mock(() => {});
const video = { muted: false, playsInline: false, srcObject: null, videoWidth: 1280, videoHeight: 720, play: mock(async () => {}), pause };
const canvas = {
  width: 0,
  height: 0,
  getContext: () => ({ drawImage: draw }),
  toBlob: (done: BlobCallback) => done(new Blob(['png'], { type: 'image/png' }))
};
const objectURL = spyOn(URL, 'createObjectURL').mockReturnValue('blob:engine-capture');
const revoke = spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
beforeEach(() => {
  stop.mockClear();
  pause.mockClear();
  draw.mockClear();
  revoke.mockClear();
  objectURL.mockClear();
  media.mockReset().mockResolvedValue({ getTracks: () => [{ stop }] } as unknown as MediaStream);
  video.play.mockReset().mockResolvedValue(undefined);
  video.videoWidth = 1280;
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { mediaDevices: { getDisplayMedia: media } } });
  Object.defineProperty(globalThis, 'document', {
    configurable: true,
    value: { createElement: (tag: string) => (tag === 'video' ? video : canvas) }
  });
});
afterAll(() => {
  for (const [key, descriptor] of [
    ['navigator', originalNavigator],
    ['document', originalDocument]
  ] as const) {
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else Reflect.deleteProperty(globalThis, key);
  }
  objectURL.mockRestore();
  revoke.mockRestore();
});
test('browser capture requests permission in the gesture and immediately stops its media tracks after encoding', async () => {
  expect(await capture.isAvailable()).toBe(true);
  const pending = capture.screen();
  expect(media).toHaveBeenCalledWith({ video: true, audio: false });
  expect(await pending).toEqual({ uri: 'blob:engine-capture', width: 1280, height: 720, scale: 1 });
  expect(draw).toHaveBeenCalledTimes(1);
  expect(stop).toHaveBeenCalledTimes(1);
  expect(pause).toHaveBeenCalledTimes(1);
  expect(video.srcObject).toBeNull();
  await capture.release('blob:unrelated');
  expect(revoke).not.toHaveBeenCalled();
  await capture.release('blob:engine-capture');
  await capture.release('blob:engine-capture');
  expect(revoke).toHaveBeenCalledTimes(1);
});
test('permission denial and frame failures reject, clean up and allow another capture', async () => {
  media.mockRejectedValueOnce(new DOMException('Denied', 'NotAllowedError'));
  await expect(capture.screen()).rejects.toThrow('Denied');
  video.play.mockRejectedValueOnce(new Error('No frame'));
  await expect(capture.screen()).rejects.toThrow('No frame');
  expect(stop).toHaveBeenCalledTimes(1);
  video.videoWidth = 50000;
  await expect(capture.screen()).rejects.toThrow('12 megapixels');
  expect(stop).toHaveBeenCalledTimes(2);
  expect(objectURL).not.toHaveBeenCalled();
});
test('overlapping browser captures are rejected without opening another picker', async () => {
  let ready!: () => void;
  video.play.mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        ready = resolve;
      })
  );
  const pending = capture.screen();
  await Promise.resolve();
  await expect(capture.screen()).rejects.toThrow('already in progress');
  expect(media).toHaveBeenCalledTimes(1);
  ready();
  await pending;
  await capture.release('blob:engine-capture');
});
test('SSR and unsupported browsers report unavailable without accessing document', async () => {
  Reflect.deleteProperty(globalThis, 'navigator');
  expect(await capture.isAvailable()).toBe(false);
  await expect(capture.screen()).rejects.toThrow('supported browser');
  await expect(capture.release('file:///unrelated')).rejects.toThrow('Only engine capture');
});
