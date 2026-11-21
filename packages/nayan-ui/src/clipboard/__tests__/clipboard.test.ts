import { afterAll, beforeEach, expect, mock, test } from 'bun:test';
import * as web from '../clipboardPlatform.web';

mock.module('../clipboardPlatform', () => web);
const { clipboard } = await import('../clipboard');
const originalNavigator = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
let text = '';
const browser = {
  writeText: mock(async (value: string) => {
    text = value;
  }),
  readText: mock(async () => text)
};
beforeEach(() => {
  text = '';
  browser.writeText.mockReset().mockImplementation(async (value: string) => {
    text = value;
  });
  browser.readText.mockReset().mockImplementation(async () => text);
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { clipboard: browser } });
});
afterAll(() => {
  if (originalNavigator) Object.defineProperty(globalThis, 'navigator', originalNavigator);
  else Reflect.deleteProperty(globalThis, 'navigator');
});

test('plain text, Unicode, newlines, embedded nulls and empty strings round-trip through the platform', async () => {
  for (const value of ['referral-code', 'Hi 🌏\nவணக்கம்\0end', '']) {
    expect(await clipboard.setString(value)).toBeUndefined();
    expect(await clipboard.getString()).toBe(value);
  }
});

test('writes invoke the browser inside the initiating call and resolve only after the browser succeeds', async () => {
  let finish!: () => void;
  browser.writeText.mockImplementationOnce(
    () =>
      new Promise<void>((resolve) => {
        finish = resolve;
      })
  );
  let completed = false;
  const pending = clipboard.setString('code').then(() => {
    completed = true;
  });
  expect(browser.writeText).toHaveBeenCalledWith('code');
  await Promise.resolve();
  expect(completed).toBe(false);
  finish();
  await pending;
  expect(completed).toBe(true);
});

test('browser permission and focus errors reject rather than reporting a false success', async () => {
  const denied = new DOMException('User denied clipboard access', 'NotAllowedError');
  browser.writeText.mockRejectedValueOnce(denied);
  browser.readText.mockRejectedValueOnce(denied);
  await expect(clipboard.setString('code')).rejects.toBe(denied);
  await expect(clipboard.getString()).rejects.toBe(denied);
});

test('server rendering and unsupported clipboard methods reject clearly and independently', async () => {
  Reflect.deleteProperty(globalThis, 'navigator');
  await expect(clipboard.setString('code')).rejects.toThrow('Clipboard access is unavailable');
  await expect(clipboard.getString()).rejects.toThrow('Clipboard access is unavailable');
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { clipboard: { writeText: browser.writeText } } });
  await clipboard.setString('write-only');
  await expect(clipboard.getString()).rejects.toThrow('Clipboard access is unavailable');
  expect(browser.writeText).toHaveBeenCalledTimes(1);
});

test('invalid JavaScript input cannot silently replace clipboard text', async () => {
  await expect(clipboard.setString(null as unknown as string)).rejects.toThrow('must be a string');
  expect(browser.writeText).not.toHaveBeenCalled();
});

test('HTML writes include a plain-text alternative and reads select the HTML representation', async () => {
  const originalItem = Object.getOwnPropertyDescriptor(globalThis, 'ClipboardItem');
  class Item {
    types: string[];
    constructor(readonly data: Record<string, Blob>) {
      this.types = Object.keys(data);
    }
    getType(type: string) {
      return Promise.resolve(this.data[type]!);
    }
  }
  let items: Item[] = [];
  const rich = {
    ...browser,
    write: mock(async (value: Item[]) => {
      items = value;
    }),
    read: mock(async () => items)
  };
  Object.defineProperty(globalThis, 'ClipboardItem', { configurable: true, value: Item });
  Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { clipboard: rich } });
  try {
    expect(clipboard.isAvailable()).toBe(true);
    const pending = clipboard.setHTML('<b>Hello 🌏</b>', 'Hello 🌏');
    expect(rich.write).toHaveBeenCalledTimes(1); // Retains browser user activation.
    await pending;
    expect(await items[0]!.getType('text/plain').then((value) => value.text())).toBe('Hello 🌏');
    expect(await clipboard.getHTML()).toBe('<b>Hello 🌏</b>');
    await clipboard.setString('text');
    expect(await clipboard.hasString()).toBe(true);
    await clipboard.clear();
    expect(await clipboard.hasString()).toBe(false);
    items = [];
    expect(await clipboard.getHTML()).toBe('');
    await expect(clipboard.setHTML(null as never, '')).rejects.toThrow('must be strings');
  } finally {
    if (originalItem) Object.defineProperty(globalThis, 'ClipboardItem', originalItem);
    else Reflect.deleteProperty(globalThis, 'ClipboardItem');
  }
});
