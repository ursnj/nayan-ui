import { beforeEach, expect, mock, spyOn, test } from 'bun:test';
import { IDBDatabase, IDBFactory, IDBObjectStore } from 'fake-indexeddb';
import { IndexedDbCache } from '../IndexedDbCache.web';

let factory: IDBFactory;
beforeEach(() => {
  factory = new IDBFactory();
  Object.defineProperty(globalThis, 'indexedDB', {
    configurable: true,
    value: factory
  });
});
async function rawDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = factory.open('nayan-engine-assets-v1', 1);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}
function completed(transaction: IDBTransaction) {
  return new Promise<void>((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onabort = () => reject(transaction.error);
  });
}

test('large binary records survive reopening without localStorage or text conversion', async () => {
  const first = await IndexedDbCache.open();
  const bytes = new Uint8Array(6 * 1024 * 1024 + 3);
  bytes[0] = 17;
  bytes[bytes.length - 1] = 89;
  await first.write('source:large', bytes, false);
  await first.flush();
  const second = await IndexedDbCache.open();
  const result = await second.read('source:large');
  expect(result).toEqual(bytes);
  expect(result).not.toBe(bytes);
  expect(await second.read('missing')).toBeUndefined();
});

test('clear cancels queued old writes, preserves later writes and deletes geometry metadata', async () => {
  const cache = await IndexedDbCache.open();
  const before = cache.write('old', new Uint8Array([1]), true);
  const clearing = cache.clear();
  expect(cache.cleared()).toBe(clearing);
  const after = cache.write('new', new Uint8Array([2]), true);
  await Promise.all([before, clearing, after]);
  expect(await cache.read('old')).toBeUndefined();
  expect(await cache.read('new')).toEqual(new Uint8Array([2]));
  await cache.remove('new');
  const restored: string[] = [];
  await cache.warm(
    () => true,
    (name) => {
      restored.push(name);
      return true;
    }
  );
  expect(restored).toEqual([]);
});

test('quota errors roll back both stores and cannot poison subsequent operations', async () => {
  const cache = await IndexedDbCache.open();
  await cache.write('saved', new Uint8Array([7]), true);
  const original = IDBObjectStore.prototype.put;
  const failing = spyOn(IDBObjectStore.prototype, 'put').mockImplementation(function (this: IDBObjectStore, ...args: Parameters<typeof original>) {
    if (this.name === 'geometry') throw new DOMException('disk full', 'QuotaExceededError');
    return original.apply(this, args);
  });
  try {
    const rejected = cache.write('partial', new Uint8Array([3]), true);
    const flushing = cache.flush();
    const settled = await Promise.allSettled([rejected, flushing]);
    expect(settled.map((value) => value.status)).toEqual(['rejected', 'rejected']);
    for (const value of settled)
      if (value.status === 'rejected') {
        expect(value.reason.name).toBe('QuotaExceededError');
        expect(value.reason.message).toBe('disk full');
      }
  } finally {
    failing.mockRestore();
  }
  expect(await cache.read('partial')).toBeUndefined();
  expect(await cache.read('saved')).toEqual(new Uint8Array([7]));
  await cache.write('later', new Uint8Array([8]), false);
  expect(await cache.read('later')).toEqual(new Uint8Array([8]));
  await cache.clear();
  expect(await cache.read('saved')).toBeUndefined();
});

test('warm-up reads newest geometry within budget, skips large entries and never loads source records', async () => {
  const cache = await IndexedDbCache.open();
  const clock = spyOn(Date, 'now');
  try {
    clock.mockReturnValue(1);
    await cache.write('older', new Uint8Array(4), true);
    clock.mockReturnValue(2);
    await cache.write('large', new Uint8Array(20), true);
    clock.mockReturnValue(3);
    await cache.write('newer', new Uint8Array(3), true);
    await cache.write('source', new Uint8Array(100), false);
  } finally {
    clock.mockRestore();
  }
  let remaining = 7;
  const loaded: string[] = [];
  await cache.warm(
    (size) => (size === 0 ? remaining > 0 : size <= remaining),
    (name, bytes) => {
      remaining -= bytes.byteLength;
      loaded.push(name);
      return true;
    }
  );
  expect(loaded).toEqual(['newer', 'older']);
  expect(await cache.read('large')).toHaveLength(20);
  expect(await cache.read('source')).toHaveLength(100);
});

test('corrupt metadata, wrong types and truncated records cannot reach the Rust restore callback', async () => {
  const cache = await IndexedDbCache.open();
  const db = await rawDatabase();
  const transaction = db.transaction(['records', 'geometry'], 'readwrite');
  const done = completed(transaction);
  const records = transaction.objectStore('records'),
    metadata = transaction.objectStore('geometry');
  for (const [name, info, data] of [
    ['bad-metadata', null, new Uint8Array(3)],
    ['bad-size', { bytes: -1, writtenAt: 1 }, new Uint8Array(3)],
    ['truncated', { bytes: 9, writtenAt: 1 }, new Uint8Array(3)],
    ['wrong-type', { bytes: 3, writtenAt: 1 }, 'abc'],
    [9, { bytes: 3, writtenAt: 1 }, new Uint8Array(3)]
  ] as const) {
    records.put(data, name);
    metadata.put(info, name);
  }
  await done;
  const restore = mock(() => true);
  try {
    await cache.warm(() => true, restore);
    expect(restore).not.toHaveBeenCalled();
    expect(await cache.read('wrong-type')).toBeUndefined();
  } finally {
    db.close();
  }
});

test('storage denial and failed upgrades reject instead of leaving startup pending', async () => {
  const denied = spyOn(factory, 'open').mockImplementation(() => {
    throw new DOMException('denied', 'SecurityError');
  });
  try {
    await expect(IndexedDbCache.open()).rejects.toThrow('denied');
  } finally {
    denied.mockRestore();
  }
  const creation = spyOn(IDBDatabase.prototype, 'createObjectStore').mockImplementation(() => {
    throw new Error('upgrade failed');
  });
  try {
    await expect(IndexedDbCache.open()).rejects.toBeDefined();
  } finally {
    creation.mockRestore();
  }
});

test('version changes close old connections so upgrades are not blocked', async () => {
  const cache = await IndexedDbCache.open();
  await new Promise<void>((resolve, reject) => {
    const request = factory.open('nayan-engine-assets-v1', 2);
    request.onsuccess = () => {
      request.result.close();
      resolve();
    };
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('old cache blocked upgrade'));
  });
  await expect(cache.read('old')).rejects.toThrow();
  await expect(IndexedDbCache.open()).rejects.toThrow();
});
