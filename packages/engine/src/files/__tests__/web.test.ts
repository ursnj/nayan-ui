import { expect, mock, test } from 'bun:test';
import { IDBFactory } from 'fake-indexeddb';
const { openFileDirectory, temporaryFiles } = await import('../filesPlatform.web');
mock.module('../filesPlatform', () => ({ openFileDirectory, temporaryFiles }));
const { files } = await import('../files');

test('browser files preserve binary bytes, content type and caller-controlled lifetime', async () => {
  const uri = await files.writeTemporary('AAECAw==', { fileName: 'post.png', mimeType: 'image/png' });
  const response = await fetch(uri);
  expect(response.headers.get('content-type')).toBe('image/png');
  expect(new Uint8Array(await response.arrayBuffer())).toEqual(new Uint8Array([0, 1, 2, 3]));
  await files.removeTemporary(uri);
  await expect(fetch(uri)).rejects.toThrow();
  await files.removeTemporary(uri);
  await expect(files.removeTemporary('file:///someone-else')).rejects.toThrow('Only engine');
});
test('strict base64 validation rejects embedded padding, whitespace and invalid bytes', async () => {
  for (const value of ['****', '    ', 'AA==AAAA', '====']) await expect(files.writeTemporary(value)).rejects.toThrow();
  const uri = await files.writeTemporary('');
  expect((await (await fetch(uri)).arrayBuffer()).byteLength).toBe(0);
  await files.removeTemporary(uri);
});
test('large browser payloads decode across aligned chunks without changing binary data', async () => {
  const binary = new Uint8Array(70000).map((_, i) => i % 256);
  const uri = await files.writeTemporary(Buffer.from(binary).toString('base64'));
  expect(new Uint8Array(await (await fetch(uri)).arrayBuffer())).toEqual(binary);
  await files.removeTemporary(uri);
});

test('private files persist by namespace and distinguish missing data from empty files', async () => {
  const original = Object.getOwnPropertyDescriptor(globalThis, 'indexedDB');
  Object.defineProperty(globalThis, 'indexedDB', { configurable: true, value: new IDBFactory() });
  try {
    const one = await files.openDirectory('drafts');
    const other = await files.openDirectory('exports');
    const view = new DataView(Uint8Array.of(99, 0, 255, 88).buffer, 1, 2);
    const writing = one.write('bytes.bin', view);
    view.setUint8(1, 42);
    await writing;
    await Promise.all([one.writeText('café.txt', 'नमस्ते\0✓'), one.writeText('empty.txt', '')]);
    await other.writeText('café.txt', 'separate');
    const reopened = await files.openDirectory('drafts');
    expect(new Uint8Array((await reopened.read('bytes.bin'))!)).toEqual(Uint8Array.of(0, 255));
    expect(await reopened.readText('café.txt')).toBe('नमस्ते\0✓');
    expect(await other.readText('café.txt')).toBe('separate');
    expect(await reopened.readText('empty.txt')).toBe('');
    expect(await reopened.read('missing')).toBeUndefined();
    expect((await reopened.list()).map(({ name, size }) => [name, size])).toEqual([
      ['bytes.bin', 2],
      ['café.txt', 22],
      ['empty.txt', 0]
    ]);
    expect((await reopened.stat('bytes.bin'))?.modifiedAt).toBeGreaterThan(0);
    await expect(reopened.readText('bytes.bin')).rejects.toThrow();
    await expect(reopened.remove('../café.txt')).rejects.toThrow('filename');
    expect(await Promise.all([reopened.remove('bytes.bin'), reopened.remove('bytes.bin')])).toEqual([true, false]);
    expect(await reopened.stat('bytes.bin')).toBeUndefined();
  } finally {
    if (original) Object.defineProperty(globalThis, 'indexedDB', original);
    else Reflect.deleteProperty(globalThis, 'indexedDB');
  }
});
