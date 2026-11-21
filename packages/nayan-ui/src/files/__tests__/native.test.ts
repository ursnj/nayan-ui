import { beforeEach, expect, mock, test } from 'bun:test';
const request = mock(async (action: string, _value: string, _name: string): Promise<string> =>
  action === 'write' ? 'file:///cache/nayan-files/file.png' : ''
);
const bridge: { fileRequest?: typeof request } = { fileRequest: request };
mock.module('../../native/NativeNayanEngine', () => ({ default: bridge }));
const { files } = await import('../files');
beforeEach(() => {
  request.mockClear();
  bridge.fileRequest = request;
});

test('native file writes and cleanup dispatch asynchronously without engine warm-up', async () => {
  const uri = await files.writeTemporary('AAECAw==', { fileName: 'post.png', mimeType: 'image/png' });
  expect(uri).toBe('file:///cache/nayan-files/file.png');
  expect(request).toHaveBeenCalledWith('write', 'AAECAw==', 'post.png');
  await files.removeTemporary(uri);
  expect(request).toHaveBeenLastCalledWith('remove', uri, '');
});
test('invalid filenames, invalid encodings and missing native support fail before writing', async () => {
  for (const fileName of ['../post.png', '.', '..', 'a/b', 'a\\b', 'a\0b', ''])
    await expect(files.writeTemporary('AAAA', { fileName })).rejects.toThrow('filename');
  await expect(files.writeTemporary('bad')).rejects.toThrow('base64');
  await expect(files.removeTemporary('')).rejects.toThrow('URI');
  expect(request).not.toHaveBeenCalled();
  bridge.fileRequest = undefined;
  await expect(files.writeTemporary('AAAA')).rejects.toThrow('native app rebuild');
});

test('private file bridge preserves exact byte ranges, text, metadata and missing files', async () => {
  const directory = await files.openDirectory('drafts');
  expect(request).toHaveBeenLastCalledWith('storeOpen', '', 'drafts');
  await directory.write('bytes.bin', Uint8Array.of(99, 1, 2, 3, 88).subarray(1, 4));
  expect(request).toHaveBeenLastCalledWith('storeWrite', 'AQID', 'drafts/bytes.bin');
  request.mockResolvedValueOnce(':AQID');
  expect(new Uint8Array((await directory.read('bytes.bin'))!)).toEqual(Uint8Array.of(1, 2, 3));
  request.mockResolvedValueOnce(':');
  expect((await directory.read('empty.bin'))?.byteLength).toBe(0);
  expect(await directory.read('missing.bin')).toBeUndefined();
  request.mockResolvedValueOnce(':Hello\0世界');
  expect(await directory.readText('document.txt')).toBe('Hello\0世界');
  request.mockResolvedValueOnce('null');
  expect(await directory.stat('missing.bin')).toBeUndefined();
  await expect(directory.writeText('.nayan-pending-', '')).rejects.toThrow('filename');
});
