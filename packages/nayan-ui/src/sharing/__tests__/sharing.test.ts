import { afterAll, beforeEach, expect, mock, test } from 'bun:test';
import * as web from '../sharingPlatform.web';

mock.module('../sharingPlatform', () => web);
const { sharing } = await import('../sharing');
const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
const originalFetch = globalThis.fetch;
const share = mock(async (_data: ShareData) => {}),
  canShare = mock((_data: ShareData) => true);
beforeEach(() => {
  share.mockReset().mockResolvedValue(undefined);
  canShare.mockReset().mockReturnValue(true);
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { share, canShare } });
  globalThis.fetch = originalFetch;
});
afterAll(() => {
  if (originalNavigator) Object.defineProperty(globalThis, 'navigator', originalNavigator);
  else Reflect.deleteProperty(globalThis, 'navigator');
  globalThis.fetch = originalFetch;
});

test('text and preloaded browser files invoke Web Share immediately and preserve Unicode', async () => {
  expect(await sharing.isAvailable()).toBe(true);
  const file = new File(['image-bytes'], 'photo.png', { type: 'image/png' });
  const pending = sharing.share({ file, text: 'Hello 🌏\nJoin me', title: 'Invite' });
  expect(share).toHaveBeenCalledTimes(1);
  expect(share.mock.calls[0]![0]).toEqual({ files: [file], text: 'Hello 🌏\nJoin me', title: 'Invite' });
  await pending;
  await sharing.share({ text: 'https://example.com' });
  expect(share.mock.calls[1]![0].files).toBeUndefined();
});

test('a remote file is loaded with a stable filename and file-type capability check', async () => {
  globalThis.fetch = mock(async () => new Response('PNG', { headers: { 'Content-Type': 'image/png' } })) as unknown as typeof fetch;
  await sharing.share({ uri: 'https://cdn.test/image.png?token=123', fileName: 'invite.png', mimeType: 'image/png', text: 'Invite' });
  const file = share.mock.calls[0]![0].files![0]!;
  expect(file.name).toBe('invite.png');
  expect(file.type).toBe('image/png');
  expect(await file.text()).toBe('PNG');
  expect(canShare).toHaveBeenCalledWith({ files: [file] });
});

test('dismissal resolves normally, while permission errors and unsupported file sharing reject', async () => {
  share.mockRejectedValueOnce(new DOMException('Dismissed', 'AbortError'));
  expect(await sharing.share({ text: 'Hello' })).toBeUndefined();
  share.mockRejectedValueOnce({ name: 'AbortError' }); // Errors from another browser realm.
  expect(await sharing.share({ text: 'Hello' })).toBeUndefined();
  const denied = new DOMException('Denied', 'NotAllowedError');
  share.mockRejectedValueOnce(denied);
  await expect(sharing.share({ text: 'Hello' })).rejects.toBe(denied);
  canShare.mockReturnValue(false);
  await expect(sharing.share({ file: new File(['x'], 'file.png') })).rejects.toThrow('cannot share');
});

test('failed and oversized downloads do not open a share sheet', async () => {
  globalThis.fetch = mock(async () => new Response('', { status: 404 })) as unknown as typeof fetch;
  await expect(sharing.share({ uri: 'https://cdn.test/missing.png' })).rejects.toThrow('404');
  globalThis.fetch = mock(async () => new Response('x', { headers: { 'content-length': String(65 * 1024 * 1024) } })) as unknown as typeof fetch;
  await expect(sharing.share({ uri: 'https://cdn.test/large.png' })).rejects.toThrow('64 MiB');
  expect(share).not.toHaveBeenCalled();
});

test('invalid paths, filenames, anchors and empty requests cannot reach the platform', async () => {
  for (const options of [
    {},
    { text: '   ' },
    { uri: 'file://bad\0path' },
    { text: 'x', fileName: '../escape' },
    { text: 'x', anchor: { x: 0, y: NaN, width: 1, height: 1 } },
    { uri: 'https://cdn.test/a', file: new File(['x'], 'x') }
  ]) {
    await expect(sharing.share(options)).rejects.toBeInstanceOf(TypeError);
  }
  await expect(sharing.share({ uri: 'file:///phone/file.png' })).rejects.toThrow('Browser');
  expect(share).not.toHaveBeenCalled();
});

test('SSR and browsers without Web Share report unavailable', async () => {
  Reflect.deleteProperty(globalThis, 'navigator');
  expect(await sharing.isAvailable()).toBe(false);
  await expect(sharing.share({ text: 'Hello' })).rejects.toThrow('unavailable');
});

test('webpage links are shared as URLs without fetching them as files', async () => {
  const fetch = mock(async () => new Response('should not download'));
  globalThis.fetch = fetch as unknown as typeof globalThis.fetch;
  await sharing.share({ url: 'https://example.com/article?id=1', text: 'Read this', title: 'Article' });
  expect(share.mock.calls[0]![0]).toEqual({ url: 'https://example.com/article?id=1', text: 'Read this', title: 'Article' });
  expect(fetch).not.toHaveBeenCalled();
  await expect(sharing.share({ url: 'file:///private/file' })).rejects.toThrow('HTTP(S)');
});
