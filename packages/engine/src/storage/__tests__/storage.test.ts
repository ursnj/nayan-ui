import { beforeEach, expect, mock, test } from 'bun:test';
import { openBackend } from '../storageBackend.web';

const disk = new Map<string, string>();
Object.defineProperty(globalThis, 'window', {
  configurable: true,
  value: {
    localStorage: {
      getItem: (key: string) => disk.get(key) ?? null,
      setItem: (key: string, value: string) => {
        disk.set(key, value);
      },
      removeItem: (key: string) => {
        disk.delete(key);
      }
    }
  }
});
mock.module('../storageBackend', () => ({ openBackend }));
const { createStorage } = await import('../store');
beforeEach(() => disk.clear());

test('typed values survive new adapters, including falsy values, Unicode and special numbers', () => {
  const store = createStorage();
  const values = { empty: '', unicode: 'hello 🌏\0', zero: 0, negative: -1.25, nan: NaN, infinity: Infinity, off: false, on: true };
  for (const [key, value] of Object.entries(values)) store.set(key, value);
  store.set('__proto__', 'safe');
  const next = createStorage();
  expect(next.getString('empty')).toBe('');
  expect(next.getString('unicode')).toBe(values.unicode);
  for (const key of ['zero', 'negative', 'nan', 'infinity'] as const) expect(next.getNumber(key)).toBe(values[key]);
  expect(next.getBoolean('off')).toBe(false);
  expect(next.getBoolean('on')).toBe(true);
  expect(next.getString('__proto__')).toBe('safe');
  expect(next.getString('zero')).toBeUndefined();
  expect(next.getNumber('missing')).toBeUndefined();
  expect(next.contains('empty')).toBe(true);
  expect(next.getAllKeys().length).toBe(9);
});
test('remove, delete and clear are synchronous and isolated by namespace', () => {
  const a = createStorage({ id: 'a' }),
    b = createStorage({ id: 'b' });
  a.set('key', 'a');
  b.set('key', 'b');
  expect(a.remove('absent')).toBe(false);
  expect(a.remove('key')).toBe(true);
  a.set('again', true);
  a.delete('again');
  expect(a.getAllKeys()).toEqual([]);
  a.set('last', 'x');
  a.clearAll();
  expect(a.getAllKeys()).toEqual([]);
  expect(b.getString('key')).toBe('b');
  expect(createStorage({ id: 'b' }).getString('key')).toBe('b');
});
test('invalid values, unavailable storage and malformed records fail visibly', () => {
  expect(() => createStorage({ id: '' })).toThrow('nonempty');
  const store = createStorage();
  store.set('key', 'original');
  expect(() => store.set('', 'no')).toThrow('empty');
  expect(() => store.set('key', {} as never)).toThrow('string, number or boolean');
  expect(store.getString('key')).toBe('original');
  const name = [...disk.keys()][0]!;
  disk.set(name, '{}bad');
  expect(() => store.getString('key')).toThrow();
  disk.set(name, '{"key":3}');
  expect(() => store.getString('key')).toThrow('corrupt');
});
test('browser quota failures preserve the last committed value and propagate to callers', () => {
  const store = createStorage();
  store.set('key', 'old');
  const original = window.localStorage.setItem;
  window.localStorage.setItem = () => {
    throw new Error('quota');
  };
  try {
    expect(() => store.set('key', 'new')).toThrow('quota');
  } finally {
    window.localStorage.setItem = original;
  }
  expect(store.getString('key')).toBe('old');
});

test('binary data is copied, preserves typed-array offsets and survives reopen without changing primitive types', () => {
  const store = createStorage({ id: 'documents' });
  const bytes = new Uint8Array([99, 0, 255, 128, 42]);
  store.set('binary', bytes.subarray(1, 4));
  bytes.fill(7);
  const next = createStorage({ id: 'documents' });
  const buffer = next.getBuffer('binary')!;
  expect([...new Uint8Array(buffer)]).toEqual([0, 255, 128]);
  new Uint8Array(buffer).fill(9);
  expect([...new Uint8Array(next.getBuffer('binary')!)]).toEqual([0, 255, 128]);
  expect(next.getString('binary')).toBeUndefined();
  store.set('empty-buffer', new ArrayBuffer(0));
  expect(next.getBuffer('empty-buffer')?.byteLength).toBe(0);
  expect(next.getBuffer('missing')).toBeUndefined();
});

test('JSON handles objects, arrays and null, and malformed data is not silently reset', () => {
  const store = createStorage();
  const value = { profile: { name: '🌏', enabled: false }, items: [0, null, ''] };
  store.setJSON('profile', value);
  expect(store.getJSON('profile')).toEqual(value);
  store.setJSON('null', null);
  expect(store.getJSON('null')).toBeNull();
  expect(store.getJSON('missing')).toBeUndefined();
  store.set('bad', '{bad');
  expect(() => store.getJSON('bad')).toThrow();
  expect(() => store.setJSON('profile', undefined as never)).toThrow('JSON');
  const circular: Record<string, unknown> = {};
  circular.self = circular;
  expect(() => store.setJSON('profile', circular as never)).toThrow();
  expect(store.getJSON('profile')).toEqual(value);
});
