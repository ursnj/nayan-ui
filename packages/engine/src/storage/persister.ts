import { createStorage, type Storage } from './store';

export interface StoragePersister<T> {
  persistClient(value: T): Promise<void>;
  restoreClient(): Promise<T | undefined>;
  removeClient(): Promise<void>;
  /** Write the latest queued snapshot and make it durable. */
  flush(): Promise<void>;
}
export interface StoragePersisterOptions<T> {
  storage?: Pick<Storage, 'getString' | 'set' | 'remove' | 'flush'>;
  key?: string;
  throttleTime?: number;
  serialize?: (value: T) => string | Promise<string>;
  deserialize?: (value: string) => T | Promise<T>;
  /** Handle background persistence failures; without a handler the write promise rejects. */
  onError?: (error: unknown) => void;
}

/** Compatible with TanStack's Persister interface, without depending on TanStack or AsyncStorage. */
export function createStoragePersister<T = unknown>(options: StoragePersisterOptions<T> = {}): StoragePersister<T> {
  const storage = options.storage ?? createStorage();
  const key = options.key ?? 'REACT_QUERY_OFFLINE_CACHE';
  const delay = options.throttleTime ?? 1000;
  if (!key || !Number.isFinite(delay) || delay < 0 || delay > 0x7fffffff) throw new TypeError('Invalid storage persister key or throttleTime');
  const serialize = options.serialize ?? JSON.stringify;
  const deserialize = options.deserialize ?? JSON.parse;
  type Waiter = { resolve(): void; reject(error: unknown): void };
  let pending: { value: T; waiters: Waiter[] } | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let chain = Promise.resolve();
  let lastTask = chain;
  let lastWrite = -Infinity;
  function drain(): Promise<void> {
    if (timer) clearTimeout(timer);
    timer = undefined;
    const job = pending;
    pending = undefined;
    if (!job) return lastTask;
    const work = chain.then(async () => {
      const text = await serialize(job.value);
      if (typeof text !== 'string') throw new TypeError('Storage persister serializer must return a string');
      storage.set(key, text);
      storage.flush();
      lastWrite = Date.now();
    });
    // A failed write must never poison subsequent writes or removals.
    chain = work.catch(() => {});
    lastTask = work;
    void work.then(
      () => job.waiters.forEach((waiter) => waiter.resolve()),
      (error) => {
        if (options.onError) {
          try {
            options.onError(error);
            job.waiters.forEach((waiter) => waiter.resolve());
          } catch (failure) {
            job.waiters.forEach((waiter) => waiter.reject(failure));
          }
        } else job.waiters.forEach((waiter) => waiter.reject(error));
      }
    );
    return work;
  }
  return {
    persistClient(value) {
      return new Promise<void>((resolve, reject) => {
        if (pending) {
          pending.value = value;
          pending.waiters.push({ resolve, reject });
        } else pending = { value, waiters: [{ resolve, reject }] };
        if (!timer)
          timer = setTimeout(
            () => {
              void drain().catch(() => {});
            },
            Math.max(0, delay - (Date.now() - lastWrite))
          );
      });
    },
    async restoreClient() {
      await chain;
      const text = storage.getString(key);
      return text === undefined ? undefined : deserialize(text);
    },
    async removeClient() {
      if (timer) clearTimeout(timer);
      timer = undefined;
      const discarded = pending;
      pending = undefined;
      discarded?.waiters.forEach((waiter) => waiter.resolve());
      const work = chain.then(() => {
        storage.remove(key);
        storage.flush();
      });
      chain = work.catch(() => {});
      lastTask = work;
      await work;
    },
    flush: drain
  };
}
