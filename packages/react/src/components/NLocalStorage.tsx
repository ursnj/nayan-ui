import { useCallback, useEffect, useRef, useState } from 'react';

const isWindowDefined = () => typeof window !== 'undefined';

export type LocalStorageSerializer<T> = (object: T | undefined) => string;
export type LocalStorageParser<T> = (val: string) => T | undefined;
export type LocalStorageSetter<T> = React.Dispatch<React.SetStateAction<T | undefined>>;

export type UseLocalStorageOptions<T> = Partial<{
  serializer: LocalStorageSerializer<T>;
  parser: LocalStorageParser<T>;
  logger: (error: unknown) => void;
  syncData: boolean;
}>;

// Named export for the hook
export function useLocalStorage<T>(key: string, defaultValue?: T, options?: UseLocalStorageOptions<T>): [T | undefined, LocalStorageSetter<T>] {
  const serializer = options?.serializer ?? (JSON.stringify as LocalStorageSerializer<T>);
  const parser = options?.parser ?? (JSON.parse as LocalStorageParser<T>);
  const logger = options?.logger ?? console.error;
  const syncData = options?.syncData ?? true;

  // Stable refs so event handlers always see the latest values without re-registering
  const serializerRef = useRef(serializer);
  const parserRef = useRef(parser);
  const loggerRef = useRef(logger);
  const defaultValueRef = useRef(defaultValue);
  const keyRef = useRef(key);
  serializerRef.current = serializer;
  parserRef.current = parser;
  loggerRef.current = logger;
  defaultValueRef.current = defaultValue;

  // Initial value from localStorage or default
  const [value, setValue] = useState<T | undefined>(() => {
    if (!isWindowDefined()) return defaultValue;
    try {
      const raw = window.localStorage.getItem(key);
      return raw !== null ? parser(raw) : defaultValue;
    } catch (e) {
      logger(e);
      return defaultValue;
    }
  });

  useEffect(() => {
    if (!isWindowDefined() || keyRef.current === key) return;
    keyRef.current = key;
    try {
      const raw = window.localStorage.getItem(key);
      setValue(raw !== null ? parserRef.current(raw) : defaultValueRef.current);
    } catch (error) {
      loggerRef.current(error);
      setValue(defaultValueRef.current);
    }
  }, [key]);

  // Cross-tab sync via native storage event
  useEffect(() => {
    if (!isWindowDefined() || !syncData) return;
    const handleStorage = (e: StorageEvent) => {
      if (e.key !== key) return;
      try {
        setValue(e.newValue !== null ? parserRef.current(e.newValue) : defaultValueRef.current);
      } catch (err) {
        loggerRef.current(err);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [key, syncData]);

  // Setter: update state and localStorage
  const setLocalStorageValue = useCallback<LocalStorageSetter<T>>(
    val => {
      setValue(prev => {
        const resolved = typeof val === 'function' ? (val as any)(prev) : val;
        if (!isWindowDefined()) return resolved;
        try {
          if (resolved === undefined) {
            window.localStorage.removeItem(key);
          } else {
            window.localStorage.setItem(key, serializerRef.current(resolved));
          }
        } catch (e) {
          loggerRef.current(e);
        }
        return resolved;
      });
    },
    [key]
  );

  return [value, setLocalStorageValue];
}
