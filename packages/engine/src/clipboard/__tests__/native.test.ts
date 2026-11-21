import { beforeEach, expect, mock, test } from 'bun:test';

let text = '';
const engine = {
  clipboardRequest: mock(async (action: string, value: string) => {
    if (action === 'set') {
      text = value;
      return '';
    }
    return text;
  })
};
mock.module('../../native/NativeNayanEngine', () => ({ default: engine }));
const { clipboard } = await import('../clipboard');
beforeEach(() => {
  text = '';
  engine.clipboardRequest.mockClear();
});

test('native text access uses the engine bridge without browser APIs or engine warm-up', async () => {
  const value = 'Code 🌏\nதமிழ்\0text';
  await clipboard.setString(value);
  expect(await clipboard.getString()).toBe(value);
  expect(engine.clipboardRequest.mock.calls).toEqual([
    ['set', value],
    ['get', '']
  ]);
  await clipboard.setString('');
  expect(await clipboard.getString()).toBe('');
});

test('native access errors propagate and older builds require a rebuild', async () => {
  const failure = new Error('Clipboard access failed');
  engine.clipboardRequest.mockRejectedValueOnce(failure);
  await expect(clipboard.setString('code')).rejects.toBe(failure);
  const request = engine.clipboardRequest;
  Object.defineProperty(engine, 'clipboardRequest', { configurable: true, value: undefined });
  try {
    await expect(clipboard.setString('code')).rejects.toThrow('native app rebuild');
    await expect(clipboard.getString()).rejects.toThrow('native app rebuild');
  } finally {
    Object.defineProperty(engine, 'clipboardRequest', { configurable: true, value: request });
  }
});

test('HTML, inspection and clear send explicit native operations without polling', async () => {
  expect(clipboard.isAvailable()).toBe(true);
  engine.clipboardRequest.mockResolvedValueOnce('');
  await clipboard.setHTML('<p>Hello</p>', 'Hello');
  expect(engine.clipboardRequest.mock.calls[0]).toEqual(['setHTML', JSON.stringify({ html: '<p>Hello</p>', text: 'Hello' })]);
  engine.clipboardRequest.mockResolvedValueOnce('<p>Hello</p>');
  expect(await clipboard.getHTML()).toBe('<p>Hello</p>');
  engine.clipboardRequest.mockResolvedValueOnce('true');
  expect(await clipboard.hasString()).toBe(true);
  engine.clipboardRequest.mockResolvedValueOnce('');
  await clipboard.clear();
  expect(engine.clipboardRequest.mock.calls.at(-1)).toEqual(['clear', '']);
});
