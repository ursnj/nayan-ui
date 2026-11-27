import { expect, spyOn, test } from 'bun:test';
import { installDom } from '../../__tests__/dom';
import { getDocumentAsync, isAvailable, release } from '../platform.web';

test('the browser picker filters MIME types, returns files and revokes owned blob URLs', async () => {
  const dom = installDom();
  const original = Object.getOwnPropertyDescriptor(globalThis, 'FileReader');
  Object.defineProperty(globalThis, 'FileReader', { configurable: true, value: dom.window.FileReader });
  const create = spyOn(URL, 'createObjectURL').mockReturnValueOnce('blob:documents/pdf').mockReturnValueOnce('blob:documents/text');
  const revoke = spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  try {
    expect(await isAvailable()).toBe(true);
    const pending = getDocumentAsync({ type: ['APPLICATION/PDF', 'application/pdf', 'text/plain'], multiple: true, base64: true });
    const input = document.querySelector('input')!;
    expect(input.accept).toBe('application/pdf,text/plain');
    expect(input.multiple).toBe(true);
    await expect(getDocumentAsync()).rejects.toThrow('already open');
    const pdf = new dom.window.File(['pdf'], 'report.pdf', { type: 'application/pdf', lastModified: 1234 });
    const text = new dom.window.File(['text'], 'notes.txt', { type: 'text/plain' });
    const selected = [pdf, text];
    Object.defineProperty(input, 'files', { value: selected });
    input.dispatchEvent(new Event('change'));
    const result = await pending;
    expect(result.canceled).toBe(false);
    if (result.canceled) throw new Error('Expected selected documents');
    expect(result.output).toBe(selected as unknown as FileList);
    expect(result.assets[0]).toMatchObject({
      uri: 'blob:documents/pdf',
      file: pdf,
      name: 'report.pdf',
      mimeType: 'application/pdf',
      size: 3,
      lastModified: 1234,
      base64: 'data:application/pdf;base64,cGRm'
    });
    for (const asset of result.assets) await release(asset.uri);
    await release(result.assets[0]!.uri);
    expect(revoke.mock.calls).toEqual([['blob:documents/pdf'], ['blob:documents/text']]);
    expect(document.querySelector('input')).toBeNull();
  } finally {
    create.mockRestore();
    revoke.mockRestore();
    if (original) Object.defineProperty(globalThis, 'FileReader', original);
    else Reflect.deleteProperty(globalThis, 'FileReader');
    dom.cleanup();
  }
});

test('the browser picker handles server rendering, invalid options and cancellation', async () => {
  expect(await isAvailable()).toBe(false);
  expect(await getDocumentAsync()).toEqual({ canceled: true, assets: null });
  const dom = installDom();
  try {
    await expect(getDocumentAsync({ type: [] })).rejects.toThrow('MIME type');
    expect(document.querySelector('input')).toBeNull();
    for (let pick = 0; pick < 2; pick++) {
      const pending = getDocumentAsync();
      const input = document.querySelector('input')!;
      expect(input.accept).toBe('');
      expect(input.multiple).toBe(false);
      input.dispatchEvent(new Event('cancel'));
      expect(await pending).toEqual({ canceled: true, assets: null, output: null });
      expect(document.querySelector('input')).toBeNull();
    }
  } finally {
    dom.cleanup();
  }
});
