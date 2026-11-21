'use client';

import { useCallback, useMemo, useSyncExternalStore } from 'react';
import { createStorage, type Storage } from './store';
import type { StoragePrimitive } from './types';

export type StorageSetter<T> = (next: T | undefined | ((current: T) => T | undefined)) => void;
type StorageState<T extends StoragePrimitive> = T extends string ? string : T extends number ? number : boolean;
let shared: Storage | undefined;
/** Read a typed preference reactively; passing undefined to the setter removes it. */
export function useStorage<T extends StoragePrimitive>(
  key: string,
  defaultValue: T,
  storage?: Storage
): [StorageState<T>, StorageSetter<StorageState<T>>] {
  const store = storage ?? (shared ??= createStorage());
  const snapshot = useCallback((): StorageState<T> => {
    const value =
      typeof defaultValue === 'string' ? store.getString(key) : typeof defaultValue === 'number' ? store.getNumber(key) : store.getBoolean(key);
    return (value ?? defaultValue) as StorageState<T>;
  }, [store, key, defaultValue]);
  const subscribe = useCallback(
    (changed: () => void) =>
      store.subscribe((changedKey) => {
        if (!changedKey || changedKey === key) changed();
      }),
    [store, key]
  );
  const serverSnapshot = useCallback(() => defaultValue as unknown as StorageState<T>, [defaultValue]);
  const value = useSyncExternalStore(subscribe, snapshot, serverSnapshot);
  const set = useCallback<StorageSetter<StorageState<T>>>(
    (next) => {
      const value = typeof next === 'function' ? next(snapshot()) : next;
      if (value === undefined) store.remove(key);
      else store.set(key, value);
    },
    [store, key, snapshot]
  );
  return [value, set];
}

/** Reactive JSON data. Subscriptions compare stored strings so snapshots stay stable. */
export function useStorageJSON<T>(key: string, defaultValue: T, storage?: Storage): [T, StorageSetter<T>] {
  const serialized = JSON.stringify(defaultValue);
  if (serialized === undefined) throw new TypeError('Engine storage: expected a JSON default');
  const [text, setText] = useStorage(key, serialized, storage);
  const value = useMemo(() => JSON.parse(text) as T, [text]);
  const set = useCallback<StorageSetter<T>>(
    (next) => {
      setText((current) => {
        const value = typeof next === 'function' ? (next as (current: T) => T | undefined)(JSON.parse(current) as T) : next;
        if (value === undefined) return undefined;
        const encoded = JSON.stringify(value);
        if (encoded === undefined) throw new TypeError('Engine storage: expected JSON data');
        return encoded;
      });
    },
    [setText]
  );
  return [value, set];
}
