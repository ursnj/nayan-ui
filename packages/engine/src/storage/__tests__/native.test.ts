import { expect, mock, test } from 'bun:test';
import type { StorageValue } from '../types';

let background: ((state: string) => void) | undefined;
const events: string[] = [];
const lifecycle = mock((_name: string, callback: (state: string) => void) => {
  background = callback;
  return { remove() {} };
});
mock.module('react-native', () => ({ AppState: { addEventListener: lifecycle } }));
const values = new Map<string, StorageValue>();
mock.module('../../native/NativeNayanEngine', () => ({
  default: {
    storageRequest: (raw: string) => {
      const command = JSON.parse(raw);
      events.push(command.op);
      let value: unknown;
      if (command.op === 'open') value = 1;
      else if (command.op === 'contains') value = values.has(command.key);
      else if (command.op === 'remove') value = values.delete(command.key);
      else if (command.op === 'keys') value = [...values.keys()];
      else if (command.op === 'clear') {
        value = [...values.keys()];
        values.clear();
      } else if (command.op === 'flush') value = null;
      return JSON.stringify({ value });
    },
    storageRead: (_handle: number, key: string) => ({ value: values.get(key) }),
    storageWrite: (_handle: number, key: string, input: { value: StorageValue }) => {
      values.set(key, input.value);
    }
  }
}));

test('native storage starts without browser text encoders and sends primitives through JSI', async () => {
  const encoder = Object.getOwnPropertyDescriptor(globalThis, 'TextEncoder');
  const decoder = Object.getOwnPropertyDescriptor(globalThis, 'TextDecoder');
  Object.defineProperty(globalThis, 'TextEncoder', { configurable: true, value: undefined });
  Object.defineProperty(globalThis, 'TextDecoder', { configurable: true, value: undefined });
  try {
    const { createStorage } = await import('../store');
    const storage = createStorage({ id: 'native' });
    const text = 'hello 🌏\0'.repeat(10000);
    storage.set('text', text);
    storage.set('number', NaN);
    storage.set('boolean', false);
    expect(storage.getString('text')).toBe(text);
    expect(storage.getNumber('number')).toBeNaN();
    expect(storage.getBoolean('boolean')).toBe(false);
    expect(storage.getString('missing')).toBeUndefined();
    expect(storage.contains('text')).toBe(true);
    expect(storage.remove('text')).toBe(true);
    expect(storage.getAllKeys()).toEqual(['number', 'boolean']);
    storage.clearAll();
    expect(storage.getAllKeys()).toEqual([]);
  } finally {
    if (encoder) Object.defineProperty(globalThis, 'TextEncoder', encoder);
    if (decoder) Object.defineProperty(globalThis, 'TextDecoder', decoder);
  }
});

test('native storage flushes once per background transition with one shared AppState subscription', async () => {
  const { createStorage } = await import('../store');
  const first = createStorage(),
    second = createStorage({ id: 'another' });
  expect(lifecycle).toHaveBeenCalledTimes(1);
  const count = () => events.filter((event) => event === 'flush').length;
  const before = count();
  background!('active');
  expect(count()).toBe(before);
  background!('background');
  expect(count()).toBe(before + 1);
  first.flush();
  second.flush();
  expect(count()).toBe(before + 3);
});
